import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import * as Icons from 'lucide-react';

export default function TransactionRow({ transaction, onDelete, showActions = true }) {
  const { categories, accounts } = useApp();
  const category = categories.find((c) => c.id === transaction.category);
  const account = accounts.find((a) => a.id === transaction.accountId);

  const IconComponent = category?.icon ? Icons[category.icon] : Icons.MoreHorizontal;

  return (
    <div className="transaction-row">
      <div
        className="transaction-icon"
        style={{
          background: category ? `${category.color}20` : 'var(--bg-glass)',
          color: category?.color || 'var(--text-muted)',
        }}
      >
        {IconComponent && <IconComponent size={20} />}
      </div>

      <div className="transaction-info">
        <div className="transaction-description">{transaction.description}</div>
        <div className="transaction-meta">
          <span className="transaction-category">
            {category?.name || 'Uncategorized'}
          </span>
          <span className="transaction-dot" />
          <span className="transaction-date">
            {format(new Date(transaction.date), 'dd MMM yyyy')}
          </span>
          {account && (
            <>
              <span className="transaction-dot" />
              <span className="transaction-date">{account.nickname}</span>
            </>
          )}
        </div>
      </div>

      <span className={`transaction-payment-badge ${transaction.paymentType}`}>
        {transaction.paymentType}
      </span>

      <span className="transaction-amount expense">
        - {formatCurrency(transaction.amount)}
      </span>

      {showActions && (
        <div className="transaction-actions">
          <button
            className="transaction-action-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(transaction.id);
            }}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
