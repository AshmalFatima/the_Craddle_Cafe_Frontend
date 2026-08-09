import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";

import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  FolderOpen,
  AlertCircle,
  Check,
} from "lucide-react";

import SidebarLayout from "../components/SidebarLayout";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_BASE = "http://localhost:5000/api/categories";

function getAuthHeaders() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatDate(iso) {
  if (!iso) return "";

  const d = new Date(iso);

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------
function useToasts() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, tone = "default") => {
    const id = Math.random().toString(36).slice(2);

    setToasts((current) => [
      ...current,
      {
        id,
        message,
        tone,
      },
    ]);

    setTimeout(() => {
      setToasts((current) =>
        current.filter((toast) => toast.id !== id)
      );
    }, 3200);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }, []);

  return {
    toasts,
    push,
    dismiss,
  };
}

function ToastStack({ toasts, dismiss }) {
  return (
    <div className="cat-toast-stack">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`cat-toast cat-toast--${toast.tone}`}
        >
          {toast.tone === "error" ? (
            <AlertCircle size={15} />
          ) : (
            <Check size={15} />
          )}

          <span>{toast.message}</span>

          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismiss(toast.id)}
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
function CategoryModal({
  open,
  initial,
  onClose,
  onSubmit,
  submitting,
  serverError,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);

  const nameRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    setName(initial?.name || "");
    setDescription(initial?.description || "");
    setTouched(false);

    const timer = setTimeout(() => {
      nameRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, submitting]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const nameError =
    touched && !name.trim()
      ? "Name is required."
      : "";

  const isEdit = Boolean(initial);

  return (
    <div
      className="cat-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitting
        ) {
          onClose();
        }
      }}
    >
      <div
        className="cat-modal"
        role="dialog"
        aria-modal="true"
        aria-label={
          isEdit ? "Edit category" : "Add category"
        }
      >
        <div className="cat-modal-head">
          <div>
            <h2>
              {isEdit
                ? "Edit category"
                : "Add category"}
            </h2>

            <p>
              {isEdit
                ? "Update the category details."
                : "Create a new product category."}
            </p>
          </div>

          <button
            type="button"
            className="cat-icon-btn"
            aria-label="Close"
            onClick={onClose}
            disabled={submitting}
          >
            <X size={17} />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();

            setTouched(true);

            if (!name.trim()) return;

            onSubmit({
              name: name.trim(),
              description: description.trim(),
            });
          }}
        >
          <label className="cat-field">
            <span>Name</span>

            <input
              ref={nameRef}
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              onBlur={() => setTouched(true)}
              placeholder="e.g. Outdoor lighting"
              maxLength={80}
              disabled={submitting}
            />

            {nameError && (
              <em className="cat-field-error">
                {nameError}
              </em>
            )}
          </label>

          <label className="cat-field">
            <span>
              Description{" "}
              <em className="cat-field-optional">
                optional
              </em>
            </span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="What belongs under this category?"
              rows={4}
              maxLength={400}
              disabled={submitting}
            />
          </label>

          {serverError && (
            <div className="cat-form-error">
              <AlertCircle size={15} />

              <span>{serverError}</span>
            </div>
          )}

          <div className="cat-modal-actions">
            <button
              type="button"
              className="cat-btn cat-btn--ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="cat-btn cat-btn--primary"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : isEdit
                ? "Save changes"
                : "Add category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category row
// ---------------------------------------------------------------------------
function CategoryRow({
  category,
  onEdit,
  onDelete,
  deleting,
}) {
  const [confirming, setConfirming] =
    useState(false);

  return (
    <div className="cat-row">
      <div className="cat-row-main">
        <p className="cat-row-name">
          {category.name}
        </p>

        <p
          className={`cat-row-desc ${
            category.description
              ? ""
              : "cat-row-desc--empty"
          }`}
        >
          {category.description ||
            "No description"}
        </p>
      </div>

      <span className="cat-row-date">
        {formatDate(category.createdAt)}
      </span>

      {!confirming ? (
        <div className="cat-row-actions">
          <button
            type="button"
            className="cat-icon-btn"
            aria-label={`Edit ${category.name}`}
            onClick={() => onEdit(category)}
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            className="cat-icon-btn cat-icon-btn--danger"
            aria-label={`Delete ${category.name}`}
            onClick={() => setConfirming(true)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ) : (
        <div className="cat-row-confirm">
          <span>Delete?</span>

          <button
            type="button"
            className="cat-confirm-btn cat-confirm-btn--danger"
            onClick={() => onDelete(category)}
            disabled={deleting}
          >
            {deleting ? "..." : "Yes"}
          </button>

          <button
            type="button"
            className="cat-confirm-btn"
            onClick={() => setConfirming(false)}
            disabled={deleting}
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function RowSkeleton() {
  return (
    <div
      className="cat-row"
      aria-hidden="true"
    >
      <div className="cat-row-main">
        <div
          className="cat-skel-line"
          style={{
            width: "30%",
            height: 14,
          }}
        />

        <div
          className="cat-skel-line"
          style={{
            width: "55%",
            height: 11,
            marginTop: 8,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ hasQuery, onAdd }) {
  return (
    <div className="cat-empty">
      <FolderOpen
        size={28}
        strokeWidth={1.5}
      />

      {hasQuery ? (
        <>
          <h3>
            No categories match your search
          </h3>

          <p>
            Try a different name or clear the
            search.
          </p>
        </>
      ) : (
        <>
          <h3>No categories yet</h3>

          <p>
            Add your first category to get
            started.
          </p>

          <button
            type="button"
            className="cat-btn cat-btn--primary"
            onClick={onAdd}
          >
            <Plus size={16} />
            Add category
          </button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function Category() {
  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState(null);

  const {
    toasts,
    push,
    dismiss,
  } = useToasts();

  // -------------------------------------------------------------------------
  // Fetch categories
  // -------------------------------------------------------------------------
  const fetchCategories =
    useCallback(async () => {
      setLoading(true);
      setLoadError("");

      try {
        const res = await fetch(API_BASE, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          throw new Error(
            "Failed to load categories"
          );
        }

        const data = await res.json();

        setCategories(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        setLoadError(
          error.message ||
            "Something went wrong loading categories."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = !q
      ? categories
      : categories.filter((category) =>
          category.name
            ?.toLowerCase()
            .includes(q)
        );

    return [...list].sort((a, b) =>
      (a.name || "").localeCompare(
        b.name || ""
      )
    );
  }, [categories, query]);

  // -------------------------------------------------------------------------
  // Modal
  // -------------------------------------------------------------------------
  const openAdd = () => {
    setEditing(null);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setModalOpen(false);
    setFormError("");
  };

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  const handleSubmit = async ({
    name,
    description,
  }) => {
    setSubmitting(true);
    setFormError("");

    const isEdit = Boolean(editing);

    const url = isEdit
      ? `${API_BASE}/${editing._id}`
      : API_BASE;

    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          description,
        }),
      });

      const data =
        await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormError(
          data.message ||
            "Could not save this category."
        );
        return;
      }

      push(
        isEdit
          ? "Category updated"
          : "Category added"
      );

      setModalOpen(false);
      setEditing(null);

      await fetchCategories();
    } catch (error) {
      setFormError(
        "Network error. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  const handleDelete = async (category) => {
    setDeletingId(category._id);

    try {
      const res = await fetch(
        `${API_BASE}/${category._id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const data =
        await res.json().catch(() => ({}));

      if (!res.ok) {
        push(
          data.message ||
            "Could not delete this category.",
          "error"
        );

        return;
      }

      setCategories((previous) =>
        previous.filter(
          (item) =>
            item._id !== category._id
        )
      );

      push("Category deleted");
    } catch (error) {
      push(
        "Network error while deleting.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // -------------------------------------------------------------------------
  // Sidebar
  // -------------------------------------------------------------------------
  const handleNavigate = (item) => {
    if (!item?.href) return;

    window.location.href = item.href;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/signin";
  };

  return (
    <>
      <style>{`
        .cat-page {
          --bg: #F7F8FA;
          --surface: #FFFFFF;
          --border: #E5E7EB;
          --border-strong: #D1D5DB;
          --text: #111827;
          --text-secondary: #6B7280;
          --text-muted: #9CA3AF;
          --accent: #2563EB;
          --accent-hover: #1D4ED8;
          --accent-bg: #EFF4FF;
          --danger: #DC2626;
          --danger-hover: #B91C1C;
          --danger-bg: #FEF2F2;
          --success: #16A34A;

          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Inter,
            Roboto,
            sans-serif;

          background: var(--bg);
          color: var(--text);

          width: 100%;

          padding: 0 0 40px;

          box-sizing: border-box;
        }

        .cat-page *,
        .cat-page *::before,
        .cat-page *::after {
          box-sizing: border-box;
        }

        .cat-shell {
          width: 100%;
          max-width: 920px;
          margin: 0 auto;
        }

        /* ---------------------------------------------------------
           Header
        --------------------------------------------------------- */

        .cat-header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;

          margin-bottom: 20px;
        }

        .cat-header h1 {
          margin: 0 0 4px;

          font-size: 22px;
          line-height: 1.2;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .cat-header p {
          margin: 0;

          color: var(--text-secondary);

          font-size: 13.5px;
        }

        .cat-header-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* ---------------------------------------------------------
           Search
        --------------------------------------------------------- */

        .cat-search {
          position: relative;

          display: flex;
          align-items: center;
        }

        .cat-search svg {
          position: absolute;
          left: 10px;

          color: var(--text-muted);

          pointer-events: none;
        }

        .cat-search input {
          width: 220px;

          background: var(--surface);

          border: 1px solid var(--border);
          border-radius: 7px;

          color: var(--text);

          font-family: inherit;
          font-size: 13.5px;

          padding: 9px 11px 9px 32px;

          outline: none;

          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .cat-search input::placeholder {
          color: var(--text-muted);
        }

        .cat-search input:focus {
          border-color: var(--accent);

          box-shadow:
            0 0 0 3px var(--accent-bg);
        }

        /* ---------------------------------------------------------
           Buttons
        --------------------------------------------------------- */

        .cat-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;

          min-height: 38px;

          border: 1px solid transparent;
          border-radius: 7px;

          padding: 8px 14px;

          font-family: inherit;
          font-size: 13.5px;
          font-weight: 500;

          cursor: pointer;

          white-space: nowrap;

          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            color 0.15s ease;
        }

        .cat-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cat-btn--primary {
          background: var(--accent);
          color: #fff;
        }

        .cat-btn--primary:hover:not(:disabled) {
          background: var(--accent-hover);
        }

        .cat-btn--ghost {
          background: var(--surface);
          color: var(--text-secondary);
          border-color: var(--border);
        }

        .cat-btn--ghost:hover:not(:disabled) {
          background: #F3F4F6;
          color: var(--text);
        }

        /* ---------------------------------------------------------
           Icon buttons
        --------------------------------------------------------- */

        .cat-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          width: 32px;
          height: 32px;

          border: 1px solid transparent;
          border-radius: 6px;

          background: transparent;
          color: var(--text-secondary);

          cursor: pointer;

          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .cat-icon-btn:hover:not(:disabled) {
          background: #F3F4F6;
          color: var(--text);
        }

        .cat-icon-btn--danger:hover:not(:disabled) {
          background: var(--danger-bg);
          color: var(--danger);
        }

        .cat-icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ---------------------------------------------------------
           List
        --------------------------------------------------------- */

        .cat-list {
          width: 100%;

          background: var(--surface);

          border: 1px solid var(--border);
          border-radius: 10px;

          overflow: hidden;
        }

        .cat-row {
          display: flex;
          align-items: center;

          gap: 16px;

          min-width: 0;

          padding: 14px 16px;

          border-bottom: 1px solid var(--border);

          transition: background 0.15s ease;
        }

        .cat-list .cat-row:last-child {
          border-bottom: none;
        }

        .cat-row:hover {
          background: #FAFAFA;
        }

        .cat-row-main {
          flex: 1;
          min-width: 0;
        }

        .cat-row-name {
          margin: 0 0 3px;

          color: var(--text);

          font-size: 14.5px;
          font-weight: 500;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .cat-row-desc {
          margin: 0;

          color: var(--text-secondary);

          font-size: 12.5px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .cat-row-desc--empty {
          color: var(--text-muted);
          font-style: italic;
        }

        .cat-row-date {
          flex-shrink: 0;

          color: var(--text-muted);

          font-size: 12px;

          white-space: nowrap;
        }

        .cat-row-actions {
          display: flex;
          align-items: center;
          gap: 3px;

          flex-shrink: 0;
        }

        .cat-row-confirm {
          display: flex;
          align-items: center;
          gap: 6px;

          flex-shrink: 0;

          color: var(--text-secondary);

          font-size: 12.5px;

          white-space: nowrap;
        }

        .cat-confirm-btn {
          border: 1px solid var(--border);
          border-radius: 6px;

          background: var(--surface);
          color: var(--text-secondary);

          padding: 5px 10px;

          font-family: inherit;
          font-size: 12px;

          cursor: pointer;
        }

        .cat-confirm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cat-confirm-btn--danger {
          background: var(--danger);
          border-color: var(--danger);

          color: #fff;
          font-weight: 500;
        }

        .cat-confirm-btn--danger:hover:not(:disabled) {
          background: var(--danger-hover);
        }

        /* ---------------------------------------------------------
           Skeleton
        --------------------------------------------------------- */

        .cat-skel-line {
          border-radius: 4px;

          background: #EEF0F2;

          animation:
            cat-pulse 1.4s ease-in-out infinite;
        }

        @keyframes cat-pulse {
          0%,
          100% {
            opacity: 0.6;
          }

          50% {
            opacity: 1;
          }
        }

        /* ---------------------------------------------------------
           Empty
        --------------------------------------------------------- */

        .cat-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          min-height: 260px;

          padding: 40px 20px;

          text-align: center;

          background: var(--surface);

          border: 1px dashed var(--border-strong);
          border-radius: 10px;

          color: var(--text-secondary);
        }

        .cat-empty svg {
          color: var(--text-muted);

          margin-bottom: 12px;
        }

        .cat-empty h3 {
          margin: 0 0 5px;

          color: var(--text);

          font-size: 15.5px;
          font-weight: 600;
        }

        .cat-empty p {
          margin: 0 0 16px;

          font-size: 13px;
        }

        /* ---------------------------------------------------------
           Error
        --------------------------------------------------------- */

        .cat-load-error {
          display: flex;
          align-items: center;
          gap: 10px;

          margin-bottom: 16px;

          padding: 11px 13px;

          background: var(--danger-bg);

          border: 1px solid #FCA5A5;
          border-radius: 8px;

          color: #991B1B;

          font-size: 13.5px;
        }

        .cat-load-error span {
          min-width: 0;
          flex: 1;
        }

        .cat-load-error button {
          flex-shrink: 0;

          background: var(--surface);

          border: 1px solid #FCA5A5;
          border-radius: 6px;

          color: #991B1B;

          padding: 5px 10px;

          font-family: inherit;
          font-size: 12.5px;

          cursor: pointer;
        }

        /* ---------------------------------------------------------
           Modal
        --------------------------------------------------------- */

        .cat-modal-overlay {
          position: fixed;
          inset: 0;

          z-index: 100;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          background: rgba(17, 24, 39, 0.45);
        }

        .cat-modal {
          width: 100%;
          max-width: 430px;

          max-height: calc(100vh - 40px);

          overflow-y: auto;

          background: var(--surface);

          border: 1px solid var(--border);
          border-radius: 12px;

          padding: 20px;

          box-shadow:
            0 12px 32px rgba(17, 24, 39, 0.14);

          animation:
            cat-modal-in 0.15s ease-out;
        }

        @keyframes cat-modal-in {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .cat-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 12px;

          margin-bottom: 18px;
        }

        .cat-modal-head h2 {
          margin: 0 0 3px;

          font-size: 17px;
          font-weight: 600;
        }

        .cat-modal-head p {
          margin: 0;

          color: var(--text-secondary);

          font-size: 12.5px;
        }

        .cat-field {
          display: block;

          margin-bottom: 15px;
        }

        .cat-field > span {
          display: block;

          margin-bottom: 6px;

          color: var(--text-secondary);

          font-size: 12.5px;
          font-weight: 500;
        }

        .cat-field-optional {
          color: var(--text-muted);

          font-size: 11.5px;
          font-style: italic;
          font-weight: 400;
        }

        .cat-field input,
        .cat-field textarea {
          width: 100%;

          background: var(--surface);

          border: 1px solid var(--border);
          border-radius: 7px;

          color: var(--text);

          font-family: inherit;
          font-size: 13.5px;

          padding: 10px 11px;

          outline: none;

          resize: vertical;

          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .cat-field input:disabled,
        .cat-field textarea:disabled {
          background: #F9FAFB;
          cursor: not-allowed;
        }

        .cat-field input::placeholder,
        .cat-field textarea::placeholder {
          color: var(--text-muted);
        }

        .cat-field input:focus,
        .cat-field textarea:focus {
          border-color: var(--accent);

          box-shadow:
            0 0 0 3px var(--accent-bg);
        }

        .cat-field-error {
          display: block;

          margin-top: 5px;

          color: var(--danger);

          font-size: 12px;
          font-style: normal;
        }

        .cat-form-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;

          margin-bottom: 14px;

          padding: 9px 11px;

          background: var(--danger-bg);

          border: 1px solid #FCA5A5;
          border-radius: 7px;

          color: #991B1B;

          font-size: 12.5px;
        }

        .cat-form-error svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .cat-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;

          margin-top: 18px;

          padding-top: 14px;

          border-top: 1px solid var(--border);
        }

        /* ---------------------------------------------------------
           Toasts
        --------------------------------------------------------- */

        .cat-toast-stack {
          position: fixed;

          right: 18px;
          bottom: 18px;

          z-index: 120;

          display: flex;
          flex-direction: column;
          align-items: flex-end;

          gap: 8px;

          pointer-events: none;
        }

        .cat-toast {
          display: flex;
          align-items: center;
          gap: 8px;

          min-width: 220px;
          max-width: 360px;

          padding: 10px 12px;

          background: var(--surface);

          border: 1px solid var(--border);
          border-radius: 8px;

          color: var(--text);

          font-size: 13px;

          box-shadow:
            0 8px 20px rgba(17, 24, 39, 0.12);

          animation:
            cat-toast-in 0.18s ease-out;

          pointer-events: auto;
        }

        .cat-toast--error {
          border-color: #FCA5A5;
        }

        .cat-toast--error svg {
          color: var(--danger);
        }

        .cat-toast:not(.cat-toast--error) svg {
          color: var(--success);
        }

        .cat-toast span {
          flex: 1;
        }

        .cat-toast button {
          display: flex;

          margin-left: auto;

          padding: 2px;

          background: transparent;

          border: none;

          color: var(--text-muted);

          cursor: pointer;
        }

        @keyframes cat-toast-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* =========================================================
           MOBILE
        ========================================================= */

        @media (max-width: 767px) {
          .cat-page {
            padding: 6px 0 32px;
          }

          .cat-shell {
            max-width: none;
          }

          .cat-header {
            display: block;

            margin-bottom: 16px;
          }

          .cat-header h1 {
            font-size: 20px;
          }

          .cat-header p {
            font-size: 13px;
          }

          .cat-header-controls {
            display: flex;
            flex-direction: column;

            align-items: stretch;

            width: 100%;

            margin-top: 14px;

            gap: 9px;
          }

          .cat-search {
            width: 100%;
          }

          .cat-search input {
            width: 100%;

            height: 42px;
          }

          .cat-header-controls .cat-btn {
            width: 100%;

            min-height: 42px;
          }

          /* -------------------------------------------------------
             Mobile list rows
          ------------------------------------------------------- */

          .cat-list {
            border-radius: 9px;
          }

          .cat-row {
            display: grid;

            grid-template-columns: minmax(0, 1fr) auto;

            grid-template-areas:
              "main actions"
              "date actions";

            column-gap: 10px;
            row-gap: 7px;

            align-items: center;

            padding: 13px 12px;
          }

          .cat-row-main {
            grid-area: main;

            width: 100%;
          }

          .cat-row-name {
            font-size: 14px;
          }

          .cat-row-desc {
            font-size: 12px;
          }

          .cat-row-date {
            grid-area: date;

            width: auto;

            font-size: 11.5px;
          }

          .cat-row-actions {
            grid-area: actions;

            align-self: center;
          }

          .cat-row-confirm {
            grid-area: actions;

            align-self: center;

            gap: 4px;
          }

          .cat-row-confirm span {
            display: none;
          }

          .cat-confirm-btn {
            padding: 5px 9px;
          }

          /* -------------------------------------------------------
             Mobile empty
          ------------------------------------------------------- */

          .cat-empty {
            min-height: 240px;

            padding: 32px 16px;
          }

          .cat-empty h3 {
            font-size: 15px;
          }

          .cat-empty p {
            max-width: 280px;

            font-size: 12.5px;
          }

          /* -------------------------------------------------------
             Mobile error
          ------------------------------------------------------- */

          .cat-load-error {
            align-items: flex-start;

            padding: 10px 11px;

            font-size: 12.5px;
          }

          .cat-load-error button {
            padding: 5px 8px;
          }

          /* -------------------------------------------------------
             Mobile modal
          ------------------------------------------------------- */

          .cat-modal-overlay {
            align-items: flex-end;

            padding: 0;
          }

          .cat-modal {
            width: 100%;
            max-width: none;

            max-height: 90vh;

            border-radius: 15px 15px 0 0;

            padding:
              18px
              16px
              calc(18px + env(safe-area-inset-bottom));
          }

          .cat-modal-head {
            margin-bottom: 16px;
          }

          .cat-modal-head h2 {
            font-size: 16px;
          }

          .cat-modal-head p {
            font-size: 12px;
          }

          .cat-field input,
          .cat-field textarea {
            font-size: 16px;
          }

          .cat-modal-actions {
            display: grid;

            grid-template-columns: 1fr 1fr;

            gap: 8px;
          }

          .cat-modal-actions .cat-btn {
            width: 100%;
          }

          /* -------------------------------------------------------
             Mobile toast
          ------------------------------------------------------- */

          .cat-toast-stack {
            left: 12px;
            right: 12px;

            bottom:
              calc(12px + env(safe-area-inset-bottom));

            align-items: stretch;
          }

          .cat-toast {
            width: 100%;
            min-width: 0;
            max-width: none;
          }
        }

        /* =========================================================
           VERY SMALL MOBILE
        ========================================================= */

        @media (max-width: 380px) {
          .cat-page {
            padding-left: 0;
            padding-right: 0;
          }

          .cat-row {
            padding: 12px 10px;
          }

          .cat-row-actions .cat-icon-btn {
            width: 30px;
            height: 30px;
          }

          .cat-modal {
            padding-left: 14px;
            padding-right: 14px;
          }
        }
      `}</style>

      {/* =========================================================
          SidebarLayout owns the sidebar + responsive shell now.
          Everything below is just this page's content.
      ========================================================== */}
      <SidebarLayout
        activeKey="categories"
        onNavigate={handleNavigate}
        user={{
          name: "Admin user",
          contact: "admin@example.com",
        }}
        onLogout={handleLogout}
      >
        <div className="cat-page">
          <div className="cat-shell">

            {/* =================================================
                HEADER
            ================================================== */}
            <div className="cat-header">
              <div>
                <h1>Categories</h1>

                <p>
                  {loading
                    ? "Loading..."
                    : `${categories.length} ${
                        categories.length === 1
                          ? "category"
                          : "categories"
                      }`}
                </p>
              </div>

              <div className="cat-header-controls">
                <div className="cat-search">
                  <Search size={15} />

                  <input
                    value={query}
                    onChange={(event) =>
                      setQuery(event.target.value)
                    }
                    placeholder="Search categories"
                    aria-label="Search categories"
                  />
                </div>

                <button
                  type="button"
                  className="cat-btn cat-btn--primary"
                  onClick={openAdd}
                >
                  <Plus size={16} />
                  Add category
                </button>
              </div>
            </div>

            {/* =================================================
                ERROR
            ================================================== */}
            {loadError && (
              <div className="cat-load-error">
                <AlertCircle size={16} />

                <span>{loadError}</span>

                <button
                  type="button"
                  onClick={fetchCategories}
                >
                  Retry
                </button>
              </div>
            )}

            {/* =================================================
                CONTENT
            ================================================== */}
            {loading ? (
              <div className="cat-list">
                {Array.from({
                  length: 5,
                }).map((_, index) => (
                  <RowSkeleton
                    key={index}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                hasQuery={Boolean(
                  query.trim()
                )}
                onAdd={openAdd}
              />
            ) : (
              <div className="cat-list">
                {filtered.map((category) => (
                  <CategoryRow
                    key={category._id}
                    category={category}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    deleting={
                      deletingId ===
                      category._id
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* ===================================================
              MODAL
          ==================================================== */}
          <CategoryModal
            open={modalOpen}
            initial={editing}
            onClose={closeModal}
            onSubmit={handleSubmit}
            submitting={submitting}
            serverError={formError}
          />

          {/* ===================================================
              TOASTS
          ==================================================== */}
          <ToastStack
            toasts={toasts}
            dismiss={dismiss}
          />
        </div>
      </SidebarLayout>
    </>
  );
}