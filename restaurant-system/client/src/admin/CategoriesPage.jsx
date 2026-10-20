import { useState } from "react";
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

function CategoryForm({ initial, onSaved, onClose }) {
  const { notify, fail } = useAdmin();
  const [f, setF] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    image: initial?.image || null,
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
      const img = await adminApi.upload(file);
      setF((x) => ({ ...x, image: img }));
    } catch (err) {
      fail(err);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const trimmedName = f.name.trim();
    if (trimmedName.length < 2) {
      return setErrors({ name: "Category name must be at least 2 characters." });
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        description: f.description.trim(),
        image: f.image,
      };

      if (initial) {
        await adminApi.categories.update(initial._id || initial.id, payload);
      } else {
        await adminApi.categories.create(payload);
      }
      notify(initial ? "Category updated." : "Category added.");
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
      title={initial ? "Edit category" : "Add category"}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button busy={saving} disabled={uploading} onClick={submit}>
            {initial ? "Save changes" : "Add category"}
          </Button>
        </>
      }
    >
      <form className="ap-form" onSubmit={submit} noValidate>
        <div className="full">
          <Field label="Name" id="c-name" error={errors.name}>
            <input
              id="c-name"
              className={`ap-input ${errors.name ? "has-error" : ""}`}
              value={f.name}
              maxLength={60}
              placeholder="e.g. Burgers, Beverages"
              onChange={(e) => {
                setF({ ...f, name: e.target.value });
                setErrors({});
              }}
            />
          </Field>
        </div>

        <div className="full">
          <Field
            label="Short description (shown on menu banner)"
            id="c-desc"
            error={errors.description}
          >
            <input
              id="c-desc"
              className="ap-input"
              value={f.description}
              maxLength={200}
              placeholder="Fresh flame-grilled burgers made to order..."
              onChange={(e) => setF({ ...f, description: e.target.value })}
            />
          </Field>
        </div>

        <div className="full">
          <Field
            label="Image (optional)"
            id="c-img"
            error={errors.image}
            hint="JPG, PNG or WebP, up to 5 MB."
          >
            <div className="ap-images">
              {f.image && (
                <div className="ap-img-item">
                  <img src={f.image.url} alt="Category" />
                  <button
                    type="button"
                    className="ap-img-rm"
                    onClick={() => setF({ ...f, image: null })}
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
              {!f.image && !uploading && (
                <label className="ap-img-add">
                  Add image
                  <input
                    id="c-img"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={pick}
                  />
                </label>
              )}
            </div>
          </Field>
        </div>
      </form>
    </Modal>
  );
}

export default function CategoriesPage() {
  const { notify, fail } = useAdmin();
  const list = useFetch(() => adminApi.categories.list(), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const items = list.data?.items || [];

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await adminApi.categories.remove(deleting._id || deleting.id);
      notify("Category deleted.");
      setDeleting(null);
      list.reload();
    } catch (err) {
      fail(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Group your dishes into menu categories (Burgers, Sides, Drinks, etc.)."
        action={<Button onClick={() => setEditing("new")}>Add category</Button>}
      />

      {list.loading && !list.data ? (
        <LoadingBlock label="Loading categories" />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : items.length === 0 ? (
        <EmptyBlock
          title="No categories yet"
          text="Create a category such as Burgers or Drinks, then add products to it."
          action={<Button onClick={() => setEditing("new")}>Add category</Button>}
        />
      ) : (
        <div className="ap-tablewrap">
          <table className="ap-table" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th className="ap-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c, i) => (
                <tr key={c._id || c.id} style={{ "--i": i }}>
                  <td>
                    <div className="ap-cell-main">
                      {c.image?.url ? (
                        <img className="ap-thumb" src={c.image.url} alt="" />
                      ) : (
                        <span className="ap-thumb-ph">{c.name.charAt(0).toUpperCase()}</span>
                      )}
                      <div>
                        <span className="ap-strong">{c.name}</span>
                        {c.description && (
                          <div className="ap-muted" style={{ fontSize: 13, marginTop: 2 }}>
                            {c.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="ap-muted">
                    <span style={{ fontWeight: 600, color: "#f4ead5" }}>
                      {c.productCount || 0}
                    </span>{" "}
                    items
                  </td>
                  <td>
                    <div className="ap-actions">
                      <Button
                        variant="ghost"
                        className="ap-btn--sm"
                        onClick={() => setEditing(c)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="ap-btn--sm"
                        onClick={() => setDeleting(c)}
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
        <CategoryForm
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            list.reload();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete category"
          busy={busy}
          message={
            deleting.productCount
              ? `"${deleting.name}" still has ${deleting.productCount} product${
                  deleting.productCount === 1 ? "" : "s"
                }. Move or delete them first; the server will refuse to delete it otherwise.`
              : `Delete "${deleting.name}"? This action cannot be undone.`
          }
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
