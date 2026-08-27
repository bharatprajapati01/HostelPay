export default function StatCard({ icon, label, value, change, changeType, color }) {
  return (
    <div className="stat-card animate-slide-up">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div
          className="stat-card-icon"
          style={{ background: color ? `${color}20` : 'var(--accent-teal-dim)', color: color || 'var(--accent-teal)' }}
        >
          {icon}
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      {change && (
        <span className={`stat-card-change ${changeType || ''}`}>{change}</span>
      )}
    </div>
  );
}
