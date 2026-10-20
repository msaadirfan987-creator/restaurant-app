-- =============================================================================
-- 001_initial_schema.sql (Corrected & Security-Hardened)
-- Supabase PostgreSQL Schema Migration for Restaurant System
-- Architecture: React Frontend -> Node.js/Express Backend -> Supabase PostgreSQL
-- Auth: Custom Bcrypt Hashing + Express JWT (NOT Supabase GoTrue Auth)
-- =============================================================================

-- Enable cryptographic & UUID extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. SEQUENCES & HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Sequence for human-readable sequential order numbers (starts at 1001, matching Counter.js)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001 INCREMENT BY 1;

-- Automatic updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. USERS TABLE (Mongoose Model: User)
-- Features: Customers, Admins, Cashiers, Kitchen staff, Waiters
-- Security: Password hashes are strictly isolated from PostgREST/anon access
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id VARCHAR(24) UNIQUE, -- Preserves historical MongoDB _id for seamless data migration
  name VARCHAR(60) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  phone VARCHAR(25) NOT NULL DEFAULT '',
  password_hash VARCHAR(255), -- Stores bcrypt hashed password (12 rounds)
  legacy_password VARCHAR(255), -- Fallback for legacy passwords
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  token_version INTEGER NOT NULL DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints derived from Mongoose validations
  CONSTRAINT users_name_minlength CHECK (char_length(trim(name)) >= 2),
  CONSTRAINT users_email_format CHECK (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin', 'kitchen', 'cashier', 'waiter', 'user'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_mongo_id ON users(mongo_id);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Safe public view of users without sensitive password hashes
CREATE OR REPLACE VIEW user_profiles WITH (security_invoker = true) AS
SELECT
  id,
  mongo_id,
  name,
  email,
  phone,
  role,
  is_active,
  created_at,
  updated_at
FROM users;

-- -----------------------------------------------------------------------------
-- 3. CATEGORIES TABLE (Mongoose Model: Category)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id VARCHAR(24) UNIQUE,
  name VARCHAR(60) NOT NULL,
  description VARCHAR(200) NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  image_public_id VARCHAR(100) NOT NULL DEFAULT '',
  product_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT categories_name_minlength CHECK (char_length(trim(name)) >= 2)
);

-- Case-insensitive uniqueness for category name
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_unique ON categories (LOWER(TRIM(name)));
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_mongo_id ON categories(mongo_id);

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. PRODUCTS TABLE (Mongoose Model: Product)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id VARCHAR(24) UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL,
  discount_price NUMERIC(10, 2),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  images TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT products_name_minlength CHECK (char_length(trim(name)) >= 2),
  CONSTRAINT products_price_range CHECK (price >= 0 AND price <= 1000000),
  CONSTRAINT products_discount_price_valid CHECK (
    discount_price IS NULL OR (discount_price >= 0 AND discount_price < price)
  )
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_catalog_sort ON products(is_featured DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_mongo_id ON products(mongo_id);

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. MENU ITEMS TABLE (Mongoose Model: MenuItem — Legacy & Fallback)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id VARCHAR(24) UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT menu_items_price_non_negative CHECK (price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_mongo_id ON menu_items(mongo_id);

DROP TRIGGER IF EXISTS trg_menu_items_updated_at ON menu_items;
CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. RESTAURANT TABLES (Mongoose Model: Table)
-- Dine-in table management, capacity, and QR codes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id VARCHAR(24) UNIQUE,
  number INTEGER NOT NULL UNIQUE,
  table_number INTEGER, -- Synonymous column matching Mongoose model pre-save hook
  seats INTEGER NOT NULL DEFAULT 4,
  capacity INTEGER NOT NULL DEFAULT 4, -- Synonymous column matching Mongoose model pre-save hook
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  is_active BOOLEAN NOT NULL DEFAULT true,
  qr_code TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT tables_number_positive CHECK (number >= 1),
  CONSTRAINT tables_seats_positive CHECK (seats >= 1),
  CONSTRAINT tables_status_check CHECK (status IN ('available', 'occupied', 'reserved'))
);

CREATE INDEX IF NOT EXISTS idx_tables_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_is_active ON restaurant_tables(is_active);
CREATE INDEX IF NOT EXISTS idx_tables_mongo_id ON restaurant_tables(mongo_id);

-- Robust trigger to sync number/table_number and seats/capacity
CREATE OR REPLACE FUNCTION sync_table_synonyms()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.number IS NOT NULL AND NEW.table_number IS NULL THEN
      NEW.table_number := NEW.number;
    ELSIF NEW.table_number IS NOT NULL AND NEW.number IS NULL THEN
      NEW.number := NEW.table_number;
    END IF;

    IF NEW.seats IS NOT NULL AND NEW.capacity IS NULL THEN
      NEW.capacity := NEW.seats;
    ELSIF NEW.capacity IS NOT NULL AND NEW.seats IS NULL THEN
      NEW.seats := NEW.capacity;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.number IS DISTINCT FROM OLD.number THEN
      NEW.table_number := NEW.number;
    ELSIF NEW.table_number IS DISTINCT FROM OLD.table_number THEN
      NEW.number := NEW.table_number;
    END IF;

    IF NEW.seats IS DISTINCT FROM OLD.seats THEN
      NEW.capacity := NEW.seats;
    ELSIF NEW.capacity IS DISTINCT FROM OLD.capacity THEN
      NEW.seats := NEW.capacity;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_table_synonyms ON restaurant_tables;
CREATE TRIGGER trg_sync_table_synonyms
  BEFORE INSERT OR UPDATE ON restaurant_tables
  FOR EACH ROW
  EXECUTE FUNCTION sync_table_synonyms();

DROP TRIGGER IF EXISTS trg_restaurant_tables_updated_at ON restaurant_tables;
CREATE TRIGGER trg_restaurant_tables_updated_at
  BEFORE UPDATE ON restaurant_tables
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Security-invoker view to support legacy queries referencing "tables" without bypassing RLS
CREATE OR REPLACE VIEW tables WITH (security_invoker = true) AS
SELECT * FROM restaurant_tables;

-- -----------------------------------------------------------------------------
-- 7. ORDERS TABLE (Mongoose Model: Order)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id VARCHAR(24) UNIQUE,
  order_number INTEGER UNIQUE DEFAULT nextval('order_number_seq'),
  order_id VARCHAR(60) NOT NULL UNIQUE,
  client_key VARCHAR(64) UNIQUE,

  source VARCHAR(20) NOT NULL DEFAULT 'online',
  type VARCHAR(20) NOT NULL DEFAULT 'delivery',
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  bill_requested BOOLEAN NOT NULL DEFAULT false,
  bill_requested_at TIMESTAMPTZ,

  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Customer details (Flattened from customer: { name, phone, address, notes })
  customer_name VARCHAR(100) NOT NULL DEFAULT '',
  customer_phone VARCHAR(30) NOT NULL DEFAULT '',
  customer_address VARCHAR(300) NOT NULL DEFAULT '',
  customer_notes TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',

  -- Financial totals & discounts
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'none',
  discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.05,
  tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,

  -- Lifecycle and kitchen status
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  cancel_reason TEXT NOT NULL DEFAULT '',

  -- Payment fields
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
  paid_at TIMESTAMPTZ,
  amount_received NUMERIC(10, 2),
  change_given NUMERIC(10, 2),
  received_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Validations derived from Mongoose models and orderService.js
  CONSTRAINT orders_source_check CHECK (source IN ('online', 'pos')),
  CONSTRAINT orders_type_check CHECK (type IN ('dine-in', 'takeaway', 'delivery')),
  CONSTRAINT orders_guest_count_min CHECK (guest_count >= 1),
  CONSTRAINT orders_subtotal_min CHECK (subtotal >= 0),
  CONSTRAINT orders_discount_min CHECK (discount >= 0),
  CONSTRAINT orders_discount_cap CHECK (discount <= subtotal),
  CONSTRAINT orders_tax_min CHECK (tax >= 0),
  CONSTRAINT orders_tax_rate_check CHECK (tax_rate >= 0 AND tax_rate <= 1.0),
  CONSTRAINT orders_delivery_fee_min CHECK (delivery_fee >= 0),
  CONSTRAINT orders_total_min CHECK (total >= 0),
  CONSTRAINT orders_discount_type_check CHECK (discount_type IN ('none', 'percent', 'amount')),
  CONSTRAINT orders_status_check CHECK (
    status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled')
  ),
  CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('unpaid', 'paid')),
  CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('cash', 'cod', 'card'))
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_payment ON orders(status, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_source_status ON orders(source, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_received_by ON orders(received_by);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_mongo_id ON orders(mongo_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_key ON orders(client_key);

-- Trigger to auto-generate formatted order_id if not supplied
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If order_number was omitted, draw from sequence
  IF NEW.order_number IS NULL THEN
    NEW.order_number := nextval('order_number_seq');
  END IF;

  -- Format human-readable orderId e.g. #1001 if omitted
  IF NEW.order_id IS NULL OR NEW.order_id = '' THEN
    NEW.order_id := '#' || NEW.order_number::text;
  END IF;

  -- Synchronize instructions and customer_notes
  IF NEW.instructions <> '' AND NEW.customer_notes = '' THEN
    NEW.customer_notes := NEW.instructions;
  ELSIF NEW.customer_notes <> '' AND NEW.instructions = '' THEN
    NEW.instructions := NEW.customer_notes;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_order_id ON orders;
CREATE TRIGGER trg_generate_order_id
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_id();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 8. ORDER ITEMS TABLE (Normalized relational items from Order.items schema)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  legacy_item_id VARCHAR(80), -- Matches subdocument item.id
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  qty INTEGER NOT NULL DEFAULT 1, -- Synonymous column matching itemSchema
  image TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  round INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT order_items_price_non_negative CHECK (price >= 0),
  CONSTRAINT order_items_quantity_min CHECK (quantity >= 1),
  CONSTRAINT order_items_round_min CHECK (round >= 1)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Robust trigger to sync quantity and qty
CREATE OR REPLACE FUNCTION sync_order_item_qty()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.quantity IS NULL AND NEW.qty IS NOT NULL THEN
      NEW.quantity := NEW.qty;
    ELSIF NEW.qty IS NULL AND NEW.quantity IS NOT NULL THEN
      NEW.qty := NEW.quantity;
    ELSIF NEW.quantity IS NOT NULL AND NEW.qty IS NOT NULL AND NEW.quantity <> NEW.qty THEN
      NEW.qty := NEW.quantity;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.quantity IS DISTINCT FROM OLD.quantity THEN
      NEW.qty := NEW.quantity;
    ELSIF NEW.qty IS DISTINCT FROM OLD.qty THEN
      NEW.quantity := NEW.qty;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_order_item_qty ON order_items;
CREATE TRIGGER trg_sync_order_item_qty
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_item_qty();

-- -----------------------------------------------------------------------------
-- 9. SETTINGS TABLE (Mongoose Model: Setting)
-- Contains public restaurant info, operating hours, delivery fee, min order amount
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id VARCHAR(24) UNIQUE,
  restaurant_name VARCHAR(100) NOT NULL DEFAULT 'Burger House',
  tagline VARCHAR(150) NOT NULL DEFAULT 'Artisanal Crafted Burgers & Cafe',
  phone VARCHAR(30) NOT NULL DEFAULT '+92 300 1234567',
  email VARCHAR(100) NOT NULL DEFAULT 'contact@burgerhouse.com',
  address VARCHAR(200) NOT NULL DEFAULT 'Plot 12-C, Food Street, Phase 5, DHA, Karachi',
  opening_hours VARCHAR(100) NOT NULL DEFAULT '12:00 PM – 02:00 AM Daily',
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 150,
  min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 500,
  tax_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.05, -- Discovered from orderService.js
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT settings_delivery_fee_range CHECK (delivery_fee >= 0 AND delivery_fee <= 10000),
  CONSTRAINT settings_min_order_amount_min CHECK (min_order_amount >= 0),
  CONSTRAINT settings_tax_rate_range CHECK (tax_rate >= 0 AND tax_rate <= 1.0)
);

DROP TRIGGER IF EXISTS trg_settings_updated_at ON settings;
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 10. COUNTERS TABLE (Mongoose Model: Counter — Legacy Compatibility)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS counters (
  id VARCHAR(50) PRIMARY KEY,
  seq BIGINT NOT NULL DEFAULT 0
);

INSERT INTO counters (id, seq)
VALUES ('order', 0)
ON CONFLICT (id) DO NOTHING;

-- Helper function to sync sequence after historical MongoDB data import
CREATE OR REPLACE FUNCTION sync_order_number_seq()
RETURNS VOID AS $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(order_number), 1000) INTO max_num FROM orders;
  PERFORM setval('order_number_seq', max_num + 1, false);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 11. SECURITY, PRIVILEGES & ROW LEVEL SECURITY (RLS)
-- Architecture: Express backend gatekeeps all auth & business logic.
-- Direct PostgREST access via anon is strictly restricted.
-- =============================================================================

-- Enable RLS across all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Service-Role & Database Superuser Policies (Used by Express Backend)
-- The Node.js Express backend connects using the service_role key or direct PG connection.
-- Express verifies JWTs, checks roles, checks ownership, and recalculates prices.
-- -----------------------------------------------------------------------------
CREATE POLICY users_service_role_all ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY categories_service_role_all ON categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY products_service_role_all ON products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY menu_items_service_role_all ON menu_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY restaurant_tables_service_role_all ON restaurant_tables FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY orders_service_role_all ON orders FOR ALL TO service_role USING (true) WITH CHECK (true) WITH CHECK (true);
CREATE POLICY order_items_service_role_all ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY settings_service_role_all ON settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY counters_service_role_all ON counters FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Defense-in-Depth PostgREST Public/Anon Permissions:
-- 1. REVOKE access to sensitive financial & user tables from anon / authenticated.
--    This prevents unauthorized clients from directly reading users, inserting fake orders,
--    or tampering with order items via Supabase public APIs.
-- 2. ALLOW read-only access to public catalog (active categories, available products, settings).
-- -----------------------------------------------------------------------------

-- Strip direct public table access from anon on sensitive data
REVOKE ALL ON users FROM anon, authenticated;
REVOKE ALL ON orders FROM anon, authenticated;
REVOKE ALL ON order_items FROM anon, authenticated;
REVOKE ALL ON counters FROM anon, authenticated;

-- Allow public read of catalog and settings (safe for PostgREST if ever queried directly)
GRANT SELECT ON categories TO anon, authenticated;
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT ON menu_items TO anon, authenticated;
GRANT SELECT ON restaurant_tables TO anon, authenticated;
GRANT SELECT ON settings TO anon, authenticated;
GRANT SELECT ON tables TO anon, authenticated;

-- Public read-only RLS policies
CREATE POLICY categories_public_select ON categories FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY products_public_select ON products FOR SELECT TO anon, authenticated USING (is_available = true);
CREATE POLICY menu_items_public_select ON menu_items FOR SELECT TO anon, authenticated USING (is_available = true);
CREATE POLICY restaurant_tables_public_select ON restaurant_tables FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY settings_public_select ON settings FOR SELECT TO anon, authenticated USING (true);

-- Explicitly disallow any public inserts/updates/deletes on all tables
-- All mutations MUST pass through Express backend controllers for validation, auth, and calculations.
