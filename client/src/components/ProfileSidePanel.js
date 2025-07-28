import React, { useState, useEffect, useCallback } from 'react';
import { formatDateDDMMYYYY } from '../utils/dateFormat';
import './ProfileSidePanel.css';

const ProfileSidePanel = ({ userId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch(`/api/profiles/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      setError('Network error loading profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId, fetchProfile]);

  const formatDate = (dateString) => {
    return formatDateDDMMYYYY(dateString);
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="profile-sidepanel-overlay" onClick={onClose}>
      <div className="profile-sidepanel" onClick={e => e.stopPropagation()}>
        <div className="sidepanel-header">
          <h3>User Profile</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="sidepanel-content">
          {loading ? (
            <div className="loading">Loading profile...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : profile ? (
            <>
              <div className="profile-info">
                <h4>{profile.user.display_name}</h4>
                
                {profile.user.bio && (
                  <p className="profile-bio">{profile.user.bio}</p>
                )}
                
                {profile.user.link && (
                  <div className="profile-link">
                    <a href={profile.user.link} target="_blank" rel="noopener noreferrer">
                      {profile.user.link}
                    </a>
                  </div>
                )}
                
                <div className="profile-stats">
                  <div className="stat-item">
                    <span className="stat-number">{profile.user.events_count}</span>
                    <span className="stat-label">Events Created</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">
                      {formatDate(profile.user.member_since)}
                    </span>
                    <span className="stat-label">Member Since</span>
                  </div>
                </div>
              </div>
              
              {profile.recent_events && profile.recent_events.length > 0 && (
                <div className="recent-events">
                  <h5>Recent Events</h5>
                  <div className="events-list">
                    {profile.recent_events.map(event => (
                      <div key={event.id} className="event-item">
                        <div className="event-date">
                          <span className="date-full">{formatDate(event.event_date)}</span>
                        </div>
                        <div className="event-info">
                          <div className="event-title">{event.title}</div>
                          <div className="event-details">
                            <span className="event-time">{formatTime(event.start_time)}</span>
                            <span className="event-location">{event.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="error-message">Profile not found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSidePanel;