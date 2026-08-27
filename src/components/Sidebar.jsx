import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Tag,
  Clock,
  Menu,
  X,
  Wallet,
  PiggyBank,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/accounts', icon: Landmark, label: 'Accounts' },
  { to: '/savings', icon: PiggyBank, label: 'Savings' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/history', icon: Clock, label: 'History' },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { currentUser, logout } = useApp();

  return (
    <>
      <button className="mobile-toggle" onClick={() => setIsOpen(true)}>
        <Menu size={20} />
      </button>

      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Wallet size={20} />
            </div>
            <span className="sidebar-logo-text">HostelPay</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setIsOpen(false)}
              end={item.to === '/'}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {currentUser && (
            <div className="sidebar-user">
              <div className="user-avatar">
                {currentUser.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name" title={currentUser}>{currentUser}</span>
                <button className="logout-btn" onClick={logout} title="Log Out">
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
          <p className="sidebar-footer-text">
            HostelPay v1.0 • Made for students
          </p>
        </div>
      </aside>
    </>
  );
}
