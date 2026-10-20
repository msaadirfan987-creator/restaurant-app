import { useState, useEffect } from "react";
import { adminApi } from "./adminApi";
import { useAdmin } from "./AdminContext";
import {
  Button,
  ConfirmDialog,
  EmptyBlock,
  ErrorBlock,
  Field,
  LoadingBlock,
  Modal,
  PageHeader,
  useFetch,
} from "./ui";

function ProductForm({ initial, categories = [], onSaved, onClose }) {
  const { notify, fail } = useAdmin();
  const [f, setF] = useState({
    name: initial?.name || "",
    category: initial?.category?.id || initial?.category?._id || categories[0]?.id || "",
    price: initial?.price ?? "",
    discountPrice: initial?.discountPrice ?? "",
    description: initial?.description || "",
    image: initial?.images?.[0] || "",
    isFeatured: Boolean(initial?.isFeatured),
    isAvailable: initial?.isAvailable !== undefined ? Boolean(initial.isAvailable) : true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return notify("Only JPG, PNG or WebP images are allowed.", "error");
    }
    if (file.size > 5 * 1024 * 1024) {
      return notify("Image must be 5 MB or smaller.", "error");
    }

    setUploading(true);
    try {
      const res = await adminApi.upload(file);
      setF((prev) => ({ ...prev, image: res.url }));
    } catch (err) {
      fail(err);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    const trimmedName = f.name.trim();
    if (trimmedName.length < 2) errs.name = "Enter product name (at least 2 characters).";
    const numPrice = Number(f.price);
    if (isNaN(numPrice) || numPrice < 0) errs.price = "Enter a valid positive price.";

    let numDiscount = null;
    if (f.discountPrice !== "" && f.discountPrice != null) {
      numDiscount = Number(f.discountPrice);
      if (isNaN(numDiscount) || numDiscount < 0) {
        errs.discountPrice = "Discount price must be a valid number.";
      } else if (numDiscount >= numPrice) {
        errs.discountPrice = "Discount price must be lower than the regular price.";
      }
    }

    if (!f.category) errs.category = "Select a category.";

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        category: f.category,
        price: numPrice,
        discountPrice: numDiscount,
        description: f.description.trim(),
        images: f.image ? [f.image] : [],
        isFeatured: f.isFeatured,
        isAvailable: f.isAvailable,
      };

      if (initial) {
        await adminApi.products.update(initial._id || initial.id, payload);
      } else {
        await adminApi.products.create(payload);
      }
      notify(initial ? "Product updated." : "Product added.");
      onSaved();
    } catch (err) {
      if (err.errors && Object.keys(err.errors).length) {
        setErrors(err.errors);
      } else {
        fail(err);
      }
      setSaving(false);
    }
  };

  return (
    <Modal
      title={initial ? "Edit product" : "Add new dish"}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button busy={saving} disabled={uploading} onClick={submit}>
            {initial ? "Save changes" : "Create product"}
          </Button>
        </>
      }
    >
      <form className="ap-form" onSubmit={submit} noValidate>
        <div className="full">
          <Field label="Dish / Product Name" id="p-name" error={errors.name}>
            <input
              id="p-name"
              className={`ap-input ${errors.name ? "has-error" : ""}`}
              value={f.name}
              maxLength={80}
              placeholder="e.g. Double Beef Cheeseburger"
              onChange={(e) => {
                setF({ ...f, name: e.target.value });
                setErrors({});
              }}
            />
          </Field>
        </div>

        <div className="grid-2">
          <Field label="Category" id="p-cat" error={errors.category}>
            <select
              id="p-cat"
              className={`ap-select ${errors.category ? "has-error" : ""}`}
              value={f.category}
              onChange={(e) => setF({ ...f, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Regular Price (Rs.)" id="p-price" error={errors.price}>
            <input
              id="p-price"
              type="number"
              min="0"
              step="10"
              className={`ap-input ${errors.price ? "has-error" : ""}`}
              value={f.price}
              placeholder="e.g. 1190"
              onChange={(e) => setF({ ...f, price: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid-2">
          <Field
            label="Special / Discount Price (Rs.)"
            id="p-disc"
            error={errors.discountPrice}
            hint="Leave blank if no discount."
          >
            <input
              id="p-disc"
              type="number"
              min="0"
              step="10"
              className={`ap-input ${errors.discountPrice ? "has-error" : ""}`}
              value={f.discountPrice}
              placeholder="e.g. 990"
              onChange={(e) => setF({ ...f, discountPrice: e.target.value })}
            />
          </Field>

          <Field label="Image URL or Upload" id="p-img" hint="Paste URL or upload image below.">
            <input
              id="p-img"
              className="ap-input"
              value={f.image}
              placeholder="https://..."
              onChange={(e) => setF({ ...f, image: e.target.value })}
            />
          </Field>
        </div>

        <div className="full">
          <div className="ap-images">
            {f.image && (
              <div className="ap-img-item">
                <img src={f.image} alt="Preview" />
                <button
                  type="button"
                  className="ap-img-rm"
                  onClick={() => setF({ ...f, image: "" })}
                >
                  Remove
                </button>
              </div>
            )}
            {uploading && (
              <div
                className="ap-img-item"
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <span className="ap-spin" />
              </div>
            )}
            {!uploading && (
              <label className="ap-img-add">
                Upload image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={pick}
                />
              </label>
            )}
          </div>
        </div>

        <div className="full">
          <Field label="Description" id="p-desc">
            <textarea
              id="p-desc"
              className="ap-textarea"
              maxLength={400}
              placeholder="Fresh flame-grilled beef patty, aged cheddar, toasted brioche bun..."
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid-2" style={{ marginTop: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={f.isFeatured}
              onChange={(e) => setF({ ...f, isFeatured: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: "#d9a441" }}
            />
            <span style={{ fontSize: 14, color: "#f4ead5", fontWeight: 600 }}>
              Feature on Homepage
            </span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={f.isAvailable}
              onChange={(e) => setF({ ...f, isAvailable: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: "#d9a441" }}
            />
            <span style={{ fontSize: 14, color: "#f4ead5", fontWeight: 600 }}>
              Available in Stock
            </span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

export default function ProductsPage() {
  const { notify, fail } = useAdmin();
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const list = useFetch(
    () => adminApi.products.list({ category: categoryFilter, search: searchTerm, limit: 100 }),
    [categoryFilter, searchTerm]
  );
  const categoriesFetch = useFetch(() => adminApi.categories.list(), []);

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const items = list.data?.items || [];
  const categories = categoriesFetch.data?.items || [];

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await adminApi.products.remove(deleting._id || deleting.id);
      notify("Product deleted.");
      setDeleting(null);
      list.reload();
      categoriesFetch.reload();
    } catch (err) {
      fail(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const toggleAvailability = async (product) => {
    try {
      await adminApi.products.update(product._id || product.id, {
        isAvailable: !product.isAvailable,
      });
      notify(
        !product.isAvailable
          ? `"${product.name}" marked as In Stock.`
          : `"${product.name}" marked as Out of Stock.`
      );
      list.reload();
    } catch (err) {
      fail(err);
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Manage your dishes, pricing, featured items, and stock availability."
        action={
          <Button onClick={() => setEditing("new")} disabled={categories.length === 0}>
            Add dish
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 14,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="search"
          placeholder="Search dishes..."
          className="ap-input"
          style={{ maxWidth: 280 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="ap-select"
          style={{ maxWidth: 220 }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id || c.id} value={c._id || c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {list.loading && !list.data ? (
        <LoadingBlock label="Loading menu items" />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : items.length === 0 ? (
        <EmptyBlock
          title="No products found"
          text="No menu items match your search or filter. Click below to add a new dish."
          action={<Button onClick={() => setEditing("new")}>Add dish</Button>}
        />
      ) : (
        <div className="ap-tablewrap">
          <table className="ap-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Dish</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th className="ap-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={p._id || p.id} style={{ "--i": i }}>
                  <td>
                    <div className="ap-cell-main">
                      {p.images?.[0] ? (
                        <img className="ap-thumb" src={p.images[0]} alt="" />
                      ) : (
                        <span className="ap-thumb-ph">{p.name.charAt(0).toUpperCase()}</span>
                      )}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="ap-strong">{p.name}</span>
                          {p.isFeatured && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                background: "rgba(217, 164, 65, 0.2)",
                                color: "#d9a441",
                                padding: "2px 6px",
                                borderRadius: 4,
                              }}
                            >
                              Featured
                            </span>
                          )}
                        </div>
                        {p.description && (
                          <div className="ap-muted" style={{ fontSize: 13, marginTop: 2 }}>
                            {p.description.slice(0, 60)}
                            {p.description.length > 60 ? "..." : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="ap-muted">{p.category?.name || "General"}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 700, color: "#f4ead5" }}>
                        Rs. {p.discountPrice != null ? p.discountPrice : p.price}
                      </span>
                      {p.discountPrice != null && (
                        <span
                          style={{
                            fontSize: 12,
                            textDecoration: "line-through",
                            color: "rgba(244, 234, 213, 0.4)",
                          }}
                        >
                          Rs. {p.price}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleAvailability(p)}
                      style={{
                        cursor: "pointer",
                        border: 0,
                        background: "transparent",
                        padding: 0,
                      }}
                      title="Click to toggle availability"
                    >
                      <span
                        className={`ap-badge ${
                          p.isAvailable ? "ap-badge--delivered" : "ap-badge--cancelled"
                        }`}
                      >
                        {p.isAvailable ? "In Stock" : "Out of Stock"}
                      </span>
                    </button>
                  </td>
                  <td>
                    <div className="ap-actions">
                      <Button
                        variant="ghost"
                        className="ap-btn--sm"
                        onClick={() => setEditing(p)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="ap-btn--sm"
                        onClick={() => setDeleting(p)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProductForm
          initial={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            list.reload();
            categoriesFetch.reload();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete product"
          busy={busy}
          message={`Are you sure you want to delete "${deleting.name}"? This will remove it from the menu immediately.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
