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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isLoginTab) {
        login(username, password);
      } else {
        register(username, password);
        setSuccess('Account created successfully! Logging you in...');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
  };

  const handleDemoLogin = () => {
    setError('');
    setSuccess('');
    try {
      login('student', '123');
    } catch (err) {
      setError(err.message || 'Something went wrong');
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
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="login-btn-submit">
            {isLoginTab ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {isLoginTab && (
          <div className="login-divider-container">
            <div className="login-divider-line"></div>
            <span className="login-divider-text">Or Use Demo Credentials</span>
            <div className="login-divider-line"></div>
          </div>
        )}

        {isLoginTab && (
          <button
            type="button"
            className="login-btn-demo"
            onClick={handleDemoLogin}
          >
            Demo Log In (student / 123)
          </button>
        )}
      </div>
    </div>
  );
}
