import { useState, useMemo } from 'react';
import { Plus, X, Trash2, Pencil } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';

const PRESET_COLORS = [
  '#00d4aa', '#7c3aed', '#f59e0b', '#3b82f6', '#ec4899',
  '#06b6d4', '#f97316', '#ef4444', '#a855f7', '#6b7280',
  '#10b981', '#e11d48', '#14b8a6', '#d946ef', '#84cc16',
];

const ICON_OPTIONS = [
  'UtensilsCrossed', 'Pizza', 'Bus', 'Shirt', 'PenTool',
  'Smartphone', 'Gamepad2', 'HeartPulse', 'ShoppingBag', 'MoreHorizontal',
  'Coffee', 'Home', 'BookOpen', 'Music', 'Gift',
  'Zap', 'Wifi', 'Dumbbell', 'Scissors', 'Stethoscope',
];

export default function Categories() {
  const { categories, transactions, addCategory, editCategory, removeCategory } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', color: PRESET_COLORS[0], icon: ICON_OPTIONS[0] });

  // Count transactions per category
  const txCounts = useMemo(() => {
    const counts = {};
    transactions.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [transactions]);

  const openAdd = () => {
    setForm({ name: '', color: PRESET_COLORS[0], icon: ICON_OPTIONS[0] });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setForm({ name: cat.name, color: cat.color, icon: cat.icon });
    setEditingId(cat.id);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingId) {
      editCategory(editingId, form);
    } else {
      addCategory({ id: generateId('cat'), ...form });
    }
    setShowModal(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Manage your expense categories</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {categories.length > 0 ? (
        <div className="categories-grid stagger-children">
          {categories.map((cat) => {
            const IconComp = Icons[cat.icon] || Icons.MoreHorizontal;
            return (
              <div key={cat.id} className="category-card animate-slide-up">
                <div
                  className="category-card-icon"
                  style={{ background: `${cat.color}20`, color: cat.color }}
                >
                  <IconComp size={22} />
                </div>
                <div className="category-card-info">
                  <div className="category-card-name">{cat.name}</div>
                  <div className="category-card-count">
                    {txCounts[cat.id] || 0} transactions
                  </div>
                </div>
                <div className="category-card-actions">
                  <button className="transaction-action-btn" onClick={() => openEdit(cat)} title="Edit" style={{ opacity: 1 }}>
                    <Pencil size={14} />
                  </button>
                  <button className="transaction-action-btn delete" onClick={() => setDeleteId(cat.id)} title="Delete" style={{ opacity: 1 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card">
          <div className="empty-state">
            <p className="empty-state-title">No categories</p>
            <p className="empty-state-text">Create categories to organize your expenses</p>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Add Category
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Edit Category' : 'Add Category'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g., Groceries"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div className="color-picker-grid">
                    {PRESET_COLORS.map((color) => (
                      <div
                        key={color}
                        className={`color-picker-swatch ${form.color === color ? 'selected' : ''}`}
                        style={{ background: color }}
                        onClick={() => setForm((p) => ({ ...p, color }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ICON_OPTIONS.map((iconName) => {
                      const Ic = Icons[iconName];
                      return (
                        <div
                          key={iconName}
                          className={`color-picker-swatch ${form.icon === iconName ? 'selected' : ''}`}
                          style={{
                            background: form.icon === iconName ? `${form.color}30` : 'var(--bg-glass)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: form.icon === iconName ? form.color : 'var(--text-muted)',
                            borderColor: form.icon === iconName ? form.color : 'transparent',
                          }}
                          onClick={() => setForm((p) => ({ ...p, icon: iconName }))}
                        >
                          {Ic && <Ic size={16} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmDialog
          title="Delete Category?"
          message="Existing transactions with this category will show as 'Uncategorized'."
          onConfirm={() => {
            removeCategory(deleteId);
            setDeleteId(null);
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
