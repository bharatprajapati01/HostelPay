import { useState, useMemo } from 'react';
import { Plus, X, Pencil, Trash2, PiggyBank, ArrowDownRight, ArrowUpRight, Landmark, Banknote } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateId, formatCurrency } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Savings() {
  const {
    savingsGoals,
    savingsTransfers,
    accounts,
    cashWallet,
    addSavingsGoal,
    editSavingsGoal,
    removeSavingsGoal,
    depositToGoal,
    withdrawFromGoal,
  } = useApp();

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferType, setTransferType] = useState('deposit'); // deposit or withdrawal
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [deleteGoalId, setDeleteGoalId] = useState(null);

  // Goal Form State
  const [goalForm, setGoalForm] = useState({ name: '', targetAmount: '' });
  // Transfer Form State
  const [transferForm, setTransferForm] = useState({
    amount: '',
    sourceType: 'online',
    accountId: accounts[0]?.id || '',
  });

  const totalSaved = useMemo(() => {
    return savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  }, [savingsGoals]);

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    if (!goalForm.name || !goalForm.targetAmount) return;

    if (editingGoalId) {
      editSavingsGoal(editingGoalId, {
        name: goalForm.name,
        targetAmount: Number(goalForm.targetAmount),
      });
    } else {
      addSavingsGoal({
        id: generateId('goal'),
        name: goalForm.name,
        targetAmount: Number(goalForm.targetAmount),
        currentAmount: 0,
        createdAt: new Date().toISOString(),
      });
    }
    setGoalForm({ name: '', targetAmount: '' });
    setEditingGoalId(null);
    setShowAddGoal(false);
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    const amount = Number(transferForm.amount);
    if (!amount || amount <= 0 || !selectedGoal) return;

    if (transferType === 'deposit') {
      // Validate source balance
      if (transferForm.sourceType === 'online') {
        const acc = accounts.find((a) => a.id === transferForm.accountId);
        if (!acc || acc.balance < amount) {
          alert('Insufficient balance in selected bank account.');
          return;
        }
      } else {
        if (cashWallet.balance < amount) {
          alert('Insufficient cash in wallet.');
          return;
        }
      }

      depositToGoal(
        selectedGoal.id,
        amount,
        transferForm.sourceType,
        transferForm.sourceType === 'online' ? transferForm.accountId : null
      );
    } else {
      // Validate withdrawal limit
      if (selectedGoal.currentAmount < amount) {
        alert('Cannot withdraw more than current savings amount.');
        return;
      }

      withdrawFromGoal(
        selectedGoal.id,
        amount,
        transferForm.sourceType, // Acts as destinationType here
        transferForm.sourceType === 'online' ? transferForm.accountId : null
      );
    }

    setTransferForm({
      amount: '',
      sourceType: 'online',
      accountId: accounts[0]?.id || '',
    });
    setSelectedGoal(null);
    setShowTransfer(false);
  };

  const openAddGoal = () => {
    setGoalForm({ name: '', targetAmount: '' });
    setEditingGoalId(null);
    setShowAddGoal(true);
  };

  const openEditGoal = (goal) => {
    setGoalForm({ name: goal.name, targetAmount: String(goal.targetAmount) });
    setEditingGoalId(goal.id);
    setShowAddGoal(true);
  };

  const openTransfer = (type, goal) => {
    setTransferType(type);
    setSelectedGoal(goal);
    setTransferForm({
      amount: '',
      sourceType: 'online',
      accountId: accounts[0]?.id || '',
    });
    setShowTransfer(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="page-subtitle">Put money aside for custom savings goals</p>
        </div>
        <button className="btn btn-primary" onClick={openAddGoal}>
          <Plus size={16} /> Create Goal
        </button>
      </div>

      {/* Overview Stat */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card animate-slide-up">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Saved Balance</span>
            <div className="stat-card-icon" style={{ background: 'var(--accent-teal-dim)', color: 'var(--accent-teal)' }}>
              <PiggyBank size={20} />
            </div>
          </div>
          <div className="stat-card-value">{formatCurrency(totalSaved)}</div>
          <span className="stat-card-change" style={{ color: 'var(--text-secondary)' }}>
            Across {savingsGoals.length} savings goals
          </span>
        </div>
      </div>

      {/* Goals Grid */}
      {savingsGoals.length > 0 ? (
        <div className="savings-grid stagger-children">
          {savingsGoals.map((goal) => {
            const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) || 0;
            return (
              <div key={goal.id} className="savings-card animate-slide-up">
                <div className="savings-card-header">
                  <div>
                    <h3 className="savings-card-title">{goal.name}</h3>
                    <span className="savings-card-meta">Created on {new Date(goal.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="transaction-action-btn" onClick={() => openEditGoal(goal)} title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button className="transaction-action-btn delete" onClick={() => setDeleteGoalId(goal.id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="savings-card-values">
                  <span className="savings-card-saved">{formatCurrency(goal.currentAmount)}</span>
                  <span className="savings-card-target">of {formatCurrency(goal.targetAmount)}</span>
                </div>

                <div className="savings-progress-container">
                  <div className="savings-progress-bar-bg">
                    <div className="savings-progress-bar" style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="savings-progress-labels">
                    <span>Progress</span>
                    <span className="savings-progress-percentage">{percentage}%</span>
                  </div>
                </div>

                <div className="account-card-actions" style={{ marginTop: 0 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => openTransfer('deposit', goal)}>
                    <ArrowUpRight size={14} style={{ color: 'var(--accent-teal)' }} /> Set Aside
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => openTransfer('withdrawal', goal)}>
                    <ArrowDownRight size={14} style={{ color: 'var(--color-warning)' }} /> Retrieve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card" style={{ marginBottom: 28 }}>
          <div className="empty-state">
            <div className="empty-state-icon">
              <PiggyBank size={28} />
            </div>
            <p className="empty-state-title">No savings goals yet</p>
            <p className="empty-state-text">Create a savings goal to start setting aside money safely.</p>
            <button className="btn btn-primary" onClick={openAddGoal}>
              <Plus size={16} /> Create Goal
            </button>
          </div>
        </div>
      )}

      {/* Transfer History logs */}
      {savingsTransfers.length > 0 && (
        <div className="glass-card animate-slide-up">
          <h3 className="section-title" style={{ marginBottom: 16 }}>Transfer History</h3>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {savingsTransfers.slice().reverse().map((transfer) => {
              const goalName = savingsGoals.find((g) => g.id === transfer.goalId)?.name || 'Deleted Goal';
              return (
                <div key={transfer.id} className="savings-transfer-row">
                  <div className="savings-transfer-info">
                    <span className={`savings-transfer-type ${transfer.type}`}>
                      {transfer.type === 'deposit' ? 'Set Aside' : 'Retrieved'} — {goalName}
                    </span>
                    <span className="savings-transfer-source">
                      {transfer.sourceType === 'online' ? '🏦 Bank Account' : '💵 Cash Wallet'} • {new Date(transfer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="savings-transfer-amount">
                    {transfer.type === 'deposit' ? '-' : '+'} {formatCurrency(transfer.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="modal-overlay" onClick={() => setShowAddGoal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingGoalId ? 'Edit Savings Goal' : 'Create Savings Goal'}</h2>
              <button className="modal-close" onClick={() => setShowAddGoal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleGoalSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Goal Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g., New Laptop, Fest Travel"
                    value={goalForm.name}
                    onChange={(e) => setGoalForm((prev) => ({ ...prev, name: e.target.value }))}
                    autoFocus
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Amount (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0.00"
                    min="1"
                    value={goalForm.targetAmount}
                    onChange={(e) => setGoalForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddGoal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingGoalId ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit / Withdraw Money Modal */}
      {showTransfer && selectedGoal && (
        <div className="modal-overlay" onClick={() => setShowTransfer(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {transferType === 'deposit' ? `Set Aside Money: ${selectedGoal.name}` : `Retrieve Money: ${selectedGoal.name}`}
              </h2>
              <button className="modal-close" onClick={() => setShowTransfer(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleTransferSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm((prev) => ({ ...prev, amount: e.target.value }))}
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {transferType === 'deposit' ? 'Source' : 'Destination'}
                  </label>
                  <div className="toggle-group" style={{ marginBottom: 16 }}>
                    <button
                      type="button"
                      className={`toggle-btn ${transferForm.sourceType === 'online' ? 'active' : ''}`}
                      onClick={() => setTransferForm((prev) => ({ ...prev, sourceType: 'online' }))}
                    >
                      💳 Bank Account
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${transferForm.sourceType === 'cash' ? 'active' : ''}`}
                      onClick={() => setTransferForm((prev) => ({ ...prev, sourceType: 'cash' }))}
                    >
                      💵 Cash Wallet
                    </button>
                  </div>
                </div>

                {transferForm.sourceType === 'online' && (
                  <div className="form-group">
                    <label className="form-label">Select Bank Account</label>
                    {accounts.length > 0 ? (
                      <select
                        className="form-select"
                        value={transferForm.accountId}
                        onChange={(e) => setTransferForm((prev) => ({ ...prev, accountId: e.target.value }))}
                      >
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.nickname} (Bal: {formatCurrency(acc.balance)})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p style={{ color: 'var(--text-danger)', fontSize: 13 }}>
                        Please add a bank account first under the Accounts tab.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransfer(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={transferForm.sourceType === 'online' && accounts.length === 0}
                >
                  {transferType === 'deposit' ? 'Confirm Deposit' : 'Confirm Retrieval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Goal Modal */}
      {deleteGoalId && (
        <ConfirmDialog
          title="Remove Goal?"
          message="This will delete this savings goal. (Note: Any accumulated savings amount will not be automatically refunded, please retrieve it first if needed.)"
          onConfirm={() => {
            removeSavingsGoal(deleteGoalId);
            setDeleteGoalId(null);
          }}
          onCancel={() => setDeleteGoalId(null)}
        />
      )}
    </div>
  );
}
