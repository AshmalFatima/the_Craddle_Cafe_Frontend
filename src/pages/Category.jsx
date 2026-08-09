
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  FolderOpen,
  AlertCircle,
  Check,
} from 'lucide-react';

import Sidebar from '../components/Sidebar';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_BASE = 'http://localhost:5000/api/categories';

function getAuthHeaders() {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatDate(iso) {
  if (!iso) return '';

  const d = new Date(iso);

  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------
function useToasts() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, tone = 'default') => {
    const id = Math.random().toString(36).slice(2);

    setToasts((t) => [
      ...t,
      {
        id,
        message,
        tone,
      },
    ]);

    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
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
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`cat-toast cat-toast--${t.tone}`}
        >
          {t.tone === 'error' ? (
            <AlertCircle size={15} />
          ) : (
            <Check size={15} />
          )}

          <span>{t.message}</span>

          <button
            aria-label="Dismiss"
            onClick={() => dismiss(t.id)}
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal form
// ---------------------------------------------------------------------------
function CategoryModal({
  open,
  initial,
  onClose,
  onSubmit,
  submitting,
  serverError,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);

  const nameRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setDescription(initial?.description || '');
      setTouched(false);

      setTimeout(() => {
        nameRef.current?.focus();
      }, 40);
    }
  }, [open, initial]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    }

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const nameError =
    touched && !name.trim()
      ? 'Name is required.'
      : '';

  const isEdit = Boolean(initial);

  return (
    <div
      className="cat-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="cat-modal"
        role="dialog"
        aria-modal="true"
        aria-label={
          isEdit
            ? 'Edit category'
            : 'Add category'
        }
      >
        <div className="cat-modal-head">
          <h2>
            {isEdit
              ? 'Edit category'
              : 'Add category'}
          </h2>

          <button
            className="cat-icon-btn"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();

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
              onChange={(e) =>
                setName(e.target.value)
              }
              onBlur={() => setTouched(true)}
              placeholder="e.g. Outdoor lighting"
              maxLength={80}
            />

            {nameError && (
              <em className="cat-field-error">
                {nameError}
              </em>
            )}
          </label>

          <label className="cat-field">
            <span>
              Description{' '}
              <em className="cat-field-optional">
                optional
              </em>
            </span>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="What belongs under this category?"
              rows={3}
              maxLength={400}
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
                ? 'Saving…'
                : isEdit
                ? 'Save changes'
                : 'Add category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row
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
              ? ''
              : 'cat-row-desc--empty'
          }`}
        >
          {category.description ||
            'No description'}
        </p>
      </div>

      <span className="cat-row-date">
        {formatDate(category.createdAt)}
      </span>

      {!confirming ? (
        <div className="cat-row-actions">
          <button
            className="cat-icon-btn"
            aria-label={`Edit ${category.name}`}
            onClick={() => onEdit(category)}
          >
            <Pencil size={15} />
          </button>

          <button
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
            className="cat-confirm-btn cat-confirm-btn--danger"
            onClick={() => onDelete(category)}
            disabled={deleting}
          >
            {deleting ? '…' : 'Yes'}
          </button>

          <button
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
            width: '30%',
            height: 14,
          }}
        />

        <div
          className="cat-skel-line"
          style={{
            width: '55%',
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
function EmptyState({
  hasQuery,
  onAdd,
}) {
  return (
    <div className="cat-empty">
      <FolderOpen
        size={26}
        strokeWidth={1.5}
      />

      {hasQuery ? (
        <>
          <h3>
            No categories match your search
          </h3>

          <p>
            Try a different name, or clear the
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
    useState('');

  const [query, setQuery] =
    useState('');

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState('');

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
      setLoadError('');

      try {
        const res = await fetch(API_BASE, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          throw new Error(
            'Failed to load categories'
          );
        }

        const data = await res.json();

        setCategories(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        setLoadError(
          err.message ||
            'Something went wrong loading categories.'
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
      : categories.filter((c) =>
          c.name
            .toLowerCase()
            .includes(q)
        );

    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [categories, query]);

  // -------------------------------------------------------------------------
  // Modal controls
  // -------------------------------------------------------------------------
  const openAdd = () => {
    setEditing(null);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setModalOpen(false);
    setFormError('');
  };

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  const handleSubmit = async ({
    name,
    description,
  }) => {
    setSubmitting(true);
    setFormError('');

    const isEdit = Boolean(editing);

    const url = isEdit
      ? `${API_BASE}/${editing._id}`
      : API_BASE;

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
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
            'Could not save this category.'
        );

        return;
      }

      push(
        isEdit
          ? 'Category updated'
          : 'Category added'
      );

      setModalOpen(false);

      fetchCategories();
    } catch (err) {
      setFormError(
        'Network error. Check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  const handleDelete = async (
    category
  ) => {
    setDeletingId(category._id);

    try {
      const res = await fetch(
        `${API_BASE}/${category._id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      const data =
        await res.json().catch(() => ({}));

      if (!res.ok) {
        push(
          data.message ||
            'Could not delete this category.',
          'error'
        );

        return;
      }

      setCategories((prev) =>
        prev.filter(
          (c) => c._id !== category._id
        )
      );

      push('Category deleted');
    } catch (err) {
      push(
        'Network error while deleting.',
        'error'
      );
    } finally {
      setDeletingId(null);
    }
  };

  // -------------------------------------------------------------------------
  // Sidebar navigation
  // -------------------------------------------------------------------------
  const handleNavigate = (item) => {
    if (!item?.href) return;

    window.location.href = item.href;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');

    // If you store user information separately,
    // remove it here as well.
    localStorage.removeItem('user');

    window.location.href = '/signin';
  };

  return (
    /*
     * IMPORTANT:
     *
     * Sidebar and page content are SIBLINGS.
     *
     * Desktop:
     *   Sidebar | Category page
     *
     * Mobile:
     *   Sidebar mobile top bar
     *   Category page
     */
    <div className="flex min-h-screen w-full bg-[#F7F8FA]">
      
      {/* =========================================================
          SIDEBAR
      ========================================================== */}
      <Sidebar
        activeKey="categories"
        onNavigate={handleNavigate}
        user={{
          name: 'Admin user',
          email: 'admin@example.com',
        }}
        onLogout={handleLogout}
      />

      {/* =========================================================
          PAGE CONTENT
      ========================================================== */}
      <main className="min-w-0 flex-1">
        <div className="cat-page">
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
                'Segoe UI',
                Inter,
                Roboto,
                sans-serif;

              background: var(--bg);
              color: var(--text);
              min-height: 100vh;
              width: 100%;
              padding: 28px 20px 56px;
              box-sizing: border-box;
            }

            .cat-page * {
              box-sizing: border-box;
            }

            .cat-shell {
              width: 100%;
              max-width: 860px;
              margin: 0 auto;
            }

            .cat-header {
              display: flex;
              flex-wrap: wrap;
              gap: 14px;
              align-items: flex-end;
              justify-content: space-between;
              margin-bottom: 20px;
            }

            .cat-header h1 {
              font-size: 22px;
              font-weight: 600;
              margin: 0 0 3px;
              letter-spacing: -0.01em;
            }

            .cat-header p {
              margin: 0;
              font-size: 13.5px;
              color: var(--text-secondary);
            }

            .cat-header-controls {
              display: flex;
              gap: 10px;
            }

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
              width: 200px;
              background: var(--surface);
              border: 1px solid var(--border);
              border-radius: 7px;
              color: var(--text);
              font-size: 13.5px;
              padding: 8px 11px 8px 32px;
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

            .cat-btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              font-family: inherit;
              font-size: 13.5px;
              font-weight: 500;
              border-radius: 7px;
              padding: 8px 14px;
              cursor: pointer;
              border: 1px solid transparent;
              transition:
                background 0.15s ease,
                border-color 0.15s ease;
              white-space: nowrap;
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

            .cat-icon-btn {
              background: transparent;
              border: 1px solid transparent;
              color: var(--text-secondary);
              border-radius: 6px;
              width: 30px;
              height: 30px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition:
                background 0.15s ease,
                color 0.15s ease;
            }

            .cat-icon-btn:hover {
              background: #F3F4F6;
              color: var(--text);
            }

            .cat-icon-btn--danger:hover {
              background: var(--danger-bg);
              color: var(--danger);
            }

            .cat-list {
              background: var(--surface);
              border: 1px solid var(--border);
              border-radius: 10px;
              overflow: hidden;
            }

            .cat-row {
              display: flex;
              align-items: center;
              gap: 16px;
              padding: 13px 16px;
              border-bottom: 1px solid var(--border);
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
              font-size: 14.5px;
              font-weight: 500;
              margin: 0 0 2px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .cat-row-desc {
              font-size: 12.5px;
              color: var(--text-secondary);
              margin: 0;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .cat-row-desc--empty {
              color: var(--text-muted);
              font-style: italic;
            }

            .cat-row-date {
              font-size: 12px;
              color: var(--text-muted);
              white-space: nowrap;
              flex-shrink: 0;
            }

            .cat-row-actions {
              display: flex;
              gap: 4px;
              flex-shrink: 0;
            }

            .cat-row-confirm {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 12.5px;
              color: var(--text-secondary);
              white-space: nowrap;
              flex-shrink: 0;
            }

            .cat-confirm-btn {
              border: 1px solid var(--border);
              background: var(--surface);
              color: var(--text-secondary);
              border-radius: 6px;
              font-size: 12px;
              padding: 4px 10px;
              cursor: pointer;
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

            .cat-empty {
              text-align: center;
              color: var(--text-secondary);
              padding: 48px 20px;
              background: var(--surface);
              border: 1px dashed var(--border-strong);
              border-radius: 10px;
            }

            .cat-empty svg {
              color: var(--text-muted);
              margin-bottom: 10px;
            }

            .cat-empty h3 {
              font-size: 15.5px;
              font-weight: 600;
              color: var(--text);
              margin: 0 0 4px;
            }

            .cat-empty p {
              font-size: 13px;
              margin: 0 0 16px;
            }

            .cat-empty .cat-btn {
              margin: 0 auto;
            }

            .cat-load-error {
              display: flex;
              align-items: center;
              gap: 10px;
              background: var(--danger-bg);
              border: 1px solid #FCA5A5;
              color: #991B1B;
              border-radius: 8px;
              padding: 11px 13px;
              font-size: 13.5px;
              margin-bottom: 16px;
            }

            .cat-load-error button {
              margin-left: auto;
              background: var(--surface);
              border: 1px solid #FCA5A5;
              color: #991B1B;
              border-radius: 6px;
              padding: 5px 10px;
              font-size: 12.5px;
              cursor: pointer;
            }

            .cat-modal-overlay {
              position: fixed;
              inset: 0;
              background: rgba(17, 24, 39, 0.45);
              display: flex;
              align-items: flex-start;
              justify-content: center;
              padding: 12vh 16px 16px;
              z-index: 100;
            }

            .cat-modal {
              width: 100%;
              max-width: 420px;
              background: var(--surface);
              border-radius: 12px;
              border: 1px solid var(--border);
              box-shadow:
                0 12px 32px rgba(17, 24, 39, 0.14);
              padding: 20px 20px 18px;
              animation: cat-modal-in 0.15s ease-out;
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
              align-items: center;
              justify-content: space-between;
              margin-bottom: 16px;
            }

            .cat-modal-head h2 {
              font-size: 16.5px;
              font-weight: 600;
              margin: 0;
            }

            .cat-field {
              display: block;
              margin-bottom: 14px;
            }

            .cat-field span {
              display: block;
              font-size: 12.5px;
              font-weight: 500;
              color: var(--text-secondary);
              margin-bottom: 5px;
            }

            .cat-field-optional {
              font-weight: 400;
              font-style: italic;
              color: var(--text-muted);
              font-size: 11.5px;
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
              padding: 9px 11px;
              outline: none;
              resize: vertical;
              transition:
                border-color 0.15s ease,
                box-shadow 0.15s ease;
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
              font-size: 12px;
              color: var(--danger);
              font-style: normal;
            }

            .cat-form-error {
              display: flex;
              gap: 8px;
              align-items: flex-start;
              background: var(--danger-bg);
              border: 1px solid #FCA5A5;
              color: #991B1B;
              border-radius: 7px;
              padding: 9px 11px;
              font-size: 12.5px;
              margin-bottom: 14px;
            }

            .cat-modal-actions {
              display: flex;
              justify-content: flex-end;
              gap: 8px;
              margin-top: 6px;
              border-top: 1px solid var(--border);
              padding-top: 14px;
            }

            .cat-toast-stack {
              position: fixed;
              bottom: 18px;
              right: 18px;
              display: flex;
              flex-direction: column;
              gap: 8px;
              z-index: 120;
            }

            .cat-toast {
              display: flex;
              align-items: center;
              gap: 8px;
              background: var(--surface);
              border: 1px solid var(--border);
              color: var(--text);
              border-radius: 8px;
              padding: 10px 12px;
              font-size: 13px;
              min-width: 220px;
              box-shadow:
                0 8px 20px rgba(17, 24, 39, 0.12);
              animation:
                cat-toast-in 0.18s ease-out;
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

            .cat-toast--error {
              border-color: #FCA5A5;
            }

            .cat-toast--error svg {
              color: var(--danger);
            }

            .cat-toast:not(.cat-toast--error) svg {
              color: var(--success);
            }

            .cat-toast button {
              margin-left: auto;
              background: transparent;
              border: none;
              color: var(--text-muted);
              cursor: pointer;
              display: flex;
            }

            /*
             * Mobile category page.
             *
             * Sidebar itself provides the mobile top bar.
             * Therefore we DON'T add any extra margin or sidebar
             * positioning here.
             */
            @media (max-width: 767px) {
              .cat-page {
                padding: 18px 12px 40px;
                min-height: calc(100vh - 61px);
              }

              .cat-header {
                flex-direction: column;
                align-items: stretch;
              }

              .cat-header-controls {
                flex-direction: column;
                align-items: stretch;
              }

              .cat-search input {
                width: 100%;
              }

              .cat-row {
                flex-wrap: wrap;
              }

              .cat-row-date {
                order: 3;
                width: 100%;
              }

              .cat-row-actions,
              .cat-row-confirm {
                order: 2;
              }

              .cat-modal-overlay {
                padding: 0;
                align-items: flex-end;
              }

              .cat-modal {
                max-width: 100%;
                border-radius: 14px 14px 0 0;
              }

              .cat-toast-stack {
                left: 12px;
                right: 12px;
                bottom: 12px;
              }

              .cat-toast {
                min-width: 0;
              }
            }

            /*
             * Extra protection for very small screens.
             */
            @media (max-width: 480px) {
              .cat-header h1 {
                font-size: 20px;
              }

              .cat-row {
                padding: 13px 12px;
                gap: 10px;
              }

              .cat-row-name {
                font-size: 14px;
              }

              .cat-row-desc {
                font-size: 12px;
              }
            }
          `}</style>

          <div className="cat-shell">
            {/* =====================================================
                HEADER
            ====================================================== */}
            <div className="cat-header">
              <div>
                <h1>Categories</h1>

                <p>
                  {loading
                    ? 'Loading…'
                    : `${categories.length} ${
                        categories.length === 1
                          ? 'category'
                          : 'categories'
                      }`}
                </p>
              </div>

              <div className="cat-header-controls">
                <div className="cat-search">
                  <Search size={15} />

                  <input
                    value={query}
                    onChange={(e) =>
                      setQuery(e.target.value)
                    }
                    placeholder="Search categories"
                    aria-label="Search categories"
                  />
                </div>

                <button
                  className="cat-btn cat-btn--primary"
                  onClick={openAdd}
                >
                  <Plus size={16} />
                  Add category
                </button>
              </div>
            </div>

            {/* =====================================================
                ERROR
            ====================================================== */}
            {loadError && (
              <div className="cat-load-error">
                <AlertCircle size={16} />

                <span>{loadError}</span>

                <button
                  onClick={fetchCategories}
                >
                  Retry
                </button>
              </div>
            )}

            {/* =====================================================
                CONTENT
            ====================================================== */}
            {loading ? (
              <div className="cat-list">
                {Array.from({ length: 5 }).map(
                  (_, i) => (
                    <RowSkeleton key={i} />
                  )
                )}
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
                {filtered.map((c) => (
                  <CategoryRow
                    key={c._id}
                    category={c}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    deleting={
                      deletingId === c._id
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* =====================================================
              MODAL
          ====================================================== */}
          <CategoryModal
            open={modalOpen}
            initial={editing}
            onClose={closeModal}
            onSubmit={handleSubmit}
            submitting={submitting}
            serverError={formError}
          />

          {/* =====================================================
              TOASTS
          ====================================================== */}
          <ToastStack
            toasts={toasts}
            dismiss={dismiss}
          />
        </div>
      </main>
    </div>
  );
}

