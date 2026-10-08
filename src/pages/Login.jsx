import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, User, Wallet, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, register } = useApp();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLoginTab) {
        await login(username, password);
      } else {
        await register(username, password);
        setSuccess('Account created. Logging you in...');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-glow-1"></div>
      <div className="login-glow-2"></div>
      
      <div className="login-card animate-fade-in">
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">
              <Wallet size={24} />
            </div>
            <span className="login-logo-text">HostelPay</span>
          </div>
          <p className="login-subtitle">Smart expense tracker & wallet for students</p>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${isLoginTab ? 'active' : ''}`}
            onClick={() => {
              setIsLoginTab(true);
              setError('');
              setSuccess('');
            }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`login-tab ${!isLoginTab ? 'active' : ''}`}
            onClick={() => {
              setIsLoginTab(false);
              setError('');
              setSuccess('');
            }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="login-error animate-shake">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="login-success">
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-icon-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder={isLoginTab ? 'Enter password' : 'At least 6 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLoginTab ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          <button type="submit" className="login-btn-submit" disabled={loading}>
            {loading ? 'Please wait...' : isLoginTab ? 'Sign In' : 'Create Account'}
          </button>
        </form>

      </div>
    </div>
  );
}
