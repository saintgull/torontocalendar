import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { formatDateDDMMYYYY } from '../utils/dateFormat';
import config from '../config';
import './ProfilePage.css';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    link: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/profiles/me`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setFormData({
          display_name: data.user.display_name,
          bio: data.user.bio || '',
          link: data.user.link || ''
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      setError('Network error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/profiles/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.user);
        setSuccess('Profile updated successfully!');
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h2>Profile Settings</h2>
          <p>Manage your profile information and preferences</p>
        </div>

        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="profile-info">
              <h3>{profile?.display_name}</h3>
              <p className="profile-email">{profile?.email}</p>
              
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-number">{profile?.events_count || 0}</span>
                  <span className="stat-label">Events Created</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {profile?.member_since 
                      ? formatDateDDMMYYYY(profile.member_since)
                      : 'N/A'
                    }
                  </span>
                  <span className="stat-label">Member Since</span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-main">
            <form onSubmit={handleSubmit} className="profile-form">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <div className="form-group">
                <label htmlFor="display_name">Display Name *</label>
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  maxLength="100"
                />
              </div>


              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={saving}
                  maxLength="500"
                  rows="4"
                  placeholder="Tell others about yourself..."
                />
                <small className="form-help">
                  {formData.bio.length}/500 characters
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="link">Public Link</label>
                <input
                  type="url"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="https://example.com"
                />
                <small className="form-help">
                  Add a link to your website, social media, or portfolio
                </small>
              </div>

              <div className="form-actions">
                <Link to="/" className="btn btn-secondary">Back to Calendar</Link>
                <Link to="/your-events" className="btn btn-secondary">Your Events</Link>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;