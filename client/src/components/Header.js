import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import ServerStatus from './ServerStatus';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1>Toronto Event Calendar</h1>
          </Link>
          
          <div className="header-actions">
            {user ? (
              <div className="user-menu">
                <span className="user-name">Hello, {user.display_name}</span>
                <Link to="/create-event" className="btn btn-add-event">
                  Add Event
                </Link>
                <div className="menu-dropdown" ref={dropdownRef}>
                  <button 
                    className="menu-icon-button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    aria-label="Menu"
                  >
                    <span className="menu-icon">
                      <span className="menu-line"></span>
                      <span className="menu-line"></span>
                      <span className="menu-line"></span>
                    </span>
                  </button>
                  {showDropdown && (
                    <div className="dropdown-menu">
                      <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                        Profile
                      </Link>
                      <Link to="/your-events" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                        Your Events
                      </Link>
                      <hr className="dropdown-divider" />
                      <button onClick={handleLogout} className="dropdown-item">
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="guest-actions">
                <Link 
                  to="/submit-event"
                  className="btn btn-submit-event"
                >
                  Submit an Event
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Only show ServerStatus for admin users (you can customize the email) */}
      {user && user.email === 'admin@tocalendar.com' && <ServerStatus />}
    </>
  );
};

export default Header;