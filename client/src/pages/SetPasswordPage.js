import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import './SetPasswordPage.css';

const SetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [validToken, setValidToken] = useState(false);
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('No invite token provided');
      return;
    }
    
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/invite/verify/${token}`);
      const data = await response.json();

      if (response.ok) {
        setUserInfo(data);
        setValidToken(true);
      } else {
        setError(data.error || 'Invalid or expired invite token');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/invite/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Password set successfully! You can now sign in.');
        navigate('/login');
      } else {
        setError(data.error || 'Failed to set password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="set-password-page">
        <div className="set-password-container">
          <div className="error-message">No invite token provided</div>
          <Link to="/" className="back-link">← Back to Calendar</Link>
        </div>
      </div>
    );
  }

  if (!validToken && !error) {
    return (
      <div className="set-password-page">
        <div className="set-password-container">
          <div className="loading">Verifying invite token...</div>
        </div>
      </div>
    );
  }

  if (error && !validToken) {
    return (
      <div className="set-password-page">
        <div className="set-password-container">
          <div className="error-message">{error}</div>
          <Link to="/" className="back-link">← Back to Calendar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="set-password-page">
      <div className="set-password-container">
        <div className="set-password-header">
          <h2>Set Your Password</h2>
          {userInfo && (
            <p>Welcome, {userInfo.display_name}! Please set your password to complete your account setup.</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="set-password-form">
          {error && <div className="error-message">{error}</div>}
          
          {userInfo && (
            <div className="user-info">
              <strong>Email:</strong> {userInfo.email}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength="8"
              placeholder="At least 8 characters"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength="8"
              placeholder="Confirm your password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Setting Password...' : 'Set Password'}
          </button>
        </form>

        <div className="set-password-footer">
          <Link to="/" className="back-link">← Back to Calendar</Link>
        </div>
      </div>
    </div>
  );
};

export default SetPasswordPage;