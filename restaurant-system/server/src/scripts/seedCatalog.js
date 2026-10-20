import { createRequire } from "module";
import dns from "node:dns";
import mongoose from "mongoose";

const require = createRequire(import.meta.url);
require("dotenv").config();

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import connectDB from "../config/db.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Setting from "../models/Setting.js";

const img = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const INITIAL_DATA = [
  {
    name: "Burgers",
    description: "Juicy flame-grilled patties, toasted artisanal buns, and bold signature flavors.",
    banner: img("photo-1550547660-d9450f859349", 1600),
    items: [
      {
        name: "Classic Beef Burger",
        price: 990,
        discountPrice: 890,
        isFeatured: true,
        description: "150g prime beef patty, aged cheddar, crisp lettuce, and our house secret sauce.",
        image: img("photo-1568901346375-23c9450c58cd"),
      },
      {
        name: "Double Patty Cheeseburger",
        price: 1390,
        isFeatured: true,
        description: "Two juicy grilled patties, double cheddar cheese, and crunchy dill pickles.",
        image: img("photo-1572802419224-296b0aeee0d9"),
      },
      {
        name: "Smoky BBQ Bacon Burger",
        price: 1190,
        isFeatured: true,
        description: "Aged cheddar, tangy pickles, crispy onion straw, and house smoky BBQ sauce.",
        image: img("photo-1550547660-d9450f859349"),
      },
      {
        name: "Wood-Fire Cheeseburger",
        price: 1090,
        isFeatured: true,
        description: "Flame-grilled artisan patty, ripe vine tomatoes, red onion, and melted cheddar.",
        image: img("photo-1571091718767-18b5b1457add"),
      },
      {
        name: "Crispy Fried Chicken Burger",
        price: 950,
        isFeatured: false,
        description: "Southern buttermilk crispy chicken thigh, creamy ranch sauce, and crunchy slaw.",
        image: img("photo-1625813506062-0aeb1d7a094b"),
      },
      {
        name: "Spicy Jalapeño Crunch",
        price: 1050,
        isFeatured: false,
        description: "Fiery chipotle mayo, fresh sliced jalapeños, pepper jack cheese, and crispy lettuce.",
        image: img("photo-1586190848861-99aa4a171e90"),
      },
    ],
  },
  {
    name: "Fries & Sides",
    description: "Golden, crisp, and seasoned to perfection. The ultimate burger sidekicks.",
    banner: img("photo-1576107232684-1279f3908594", 1600),
    items: [
      {
        name: "Classic Golden Salted Fries",
        price: 390,
        description: "Hand-cut Idaho potatoes fried golden, tossed with flaky sea salt.",
        image: img("photo-1576107232684-1279f3908594"),
      },
      {
        name: "Loaded Cheese & Bacon Fries",
        price: 690,
        isFeatured: false,
        description: "Smothered in warm melted cheddar cheese sauce and chopped crispy beef bacon.",
        image: img("photo-1585109649139-366815a0d713"),
      },
      {
        name: "Crispy Truffle Fries",
        price: 620,
        description: "Crisp potato fries tossed in aromatic black truffle oil and freshly grated parmesan.",
        image: img("photo-1541592106381-b31e9677c0e5"),
      },
      {
        name: "Crispy Mozzarella Sticks (6 Pcs)",
        price: 590,
        description: "Stretchy golden mozzarella coated in herbed breadcrumbs, served with marinara.",
        image: img("photo-1531749668029-2db88e4276c7"),
      },
    ],
  },
  {
    name: "Drinks",
    description: "Thick hand-spun milkshakes, cold-pressed refreshments, and fizzy fountain classics.",
    banner: img("photo-1572490122747-3968b75cc699", 1600),
    items: [
      {
        name: "Thick Belgian Chocolate Shake",
        price: 590,
        isFeatured: false,
        description: "Rich dark Belgian chocolate blended with creamy whole milk vanilla ice cream.",
        image: img("photo-1572490122747-3968b75cc699"),
      },
      {
        name: "Classic Salted Caramel Shake",
        price: 590,
        description: "Buttery sea-salt caramel ribbons swirled into decadent whipped cream.",
        image: img("photo-1579954115545-a95591f28bfc"),
      },
      {
        name: "Iced Peach Lemon Tea",
        price: 380,
        description: "Slow-brewed Ceylon black tea infused with natural white peach puree and fresh mint.",
        image: img("photo-1556679343-c7306c1976bc"),
      },
    ],
  },
  {
    name: "Combos",
    description: "Your favorite signature burger bundled with golden fries and an ice-cold beverage.",
    banner: img("photo-1610614819513-58e34989848b", 1600),
    items: [
      {
        name: "Classic Meal Deal",
        price: 1390,
        discountPrice: 1290,
        isFeatured: true,
        description: "Classic Beef Burger + Regular Golden Salted Fries + 330ml Can of Drink.",
        image: img("photo-1610614819513-58e34989848b"),
      },
      {
        name: "Double Delight Feast for 2",
        price: 2490,
        description: "2x Signature Cheeseburgers + 1x Large Loaded Fries + 2x Soft Drinks.",
        image: img("photo-1594212699903-ec8a3eca50f5"),
      },
    ],
  },
];

async function seed() {
  console.log("Seeding Catalog (Categories & Products)...");
  await connectDB();

  // Initialize settings
  const existingSetting = await Setting.findOne();
  if (!existingSetting) {
    await Setting.create({
      restaurantName: "Burger House",
      tagline: "Freshly Grilled Burgers, Straight to Your Table",
      phone: "+92 300 1234567",
      email: "info@burgerhouse.com",
      address: "Plot 12-C, Food Street, Phase 5, DHA, Karachi",
      openingHours: "12:00 PM – 02:00 AM Daily",
      deliveryFee: 150,
      minOrderAmount: 500,
    });
    console.log("✅ Initialized Settings");
  }

  const catCount = await Category.countDocuments();
  if (catCount > 0) {
    console.log(`ℹ️ Categories already exist (${catCount} found). Skipping catalog seed.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  for (const group of INITIAL_DATA) {
    const category = await Category.create({
      name: group.name,
      description: group.description,
      image: { url: group.banner, publicId: "" },
      productCount: group.items.length,
    });

    for (const item of group.items) {
      await Product.create({
        name: item.name,
        description: item.description,
        price: item.price,
        discountPrice: item.discountPrice || null,
        category: category._id,
        images: [item.image],
        isFeatured: Boolean(item.isFeatured),
        isAvailable: true,
      });
    }
    console.log(`✅ Seeded Category "${category.name}" with ${group.items.length} products`);
  }

  console.log("🎉 Catalog seeded successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding error:", err);
  process.exit(1);
});
