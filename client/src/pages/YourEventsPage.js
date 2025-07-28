import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getContrastTextColor } from '../utils/colorContrast';
import { formatDateDDMMYYYY } from '../utils/dateFormat';
import './YourEventsPage.css';

const YourEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    fetchEvents();
  }, [user, authLoading, navigate]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/profiles/me/events', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        setError('Failed to load events');
      }
    } catch (error) {
      setError('Network error loading events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      return;
    }
    
    setDeleting(eventId);
    
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setEvents(events.filter(event => event.id !== eventId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete event');
      }
    } catch (error) {
      setError('Network error. Failed to delete event.');
    } finally {
      setDeleting(null);
    }
  };

  const handleICSUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setUploadResult(null);

    const formData = new FormData();
    formData.append('icsFile', file);

    try {
      const response = await fetch('/api/events/upload-ics', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResult(data);
        // Refresh events list
        fetchEvents();
      } else {
        setError(data.error || 'Failed to upload ICS file');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
      // Clear file input
      event.target.value = '';
    }
  };

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

  const isUpcoming = (eventDate, startTime) => {
    // Extract just the date part (YYYY-MM-DD) from the database date
    const dateOnly = eventDate.split('T')[0];
    const eventDateTime = new Date(`${dateOnly}T${startTime}`);
    return eventDateTime > new Date();
  };

  const upcomingEvents = events.filter(event => isUpcoming(event.event_date, event.start_time));
  const pastEvents = events.filter(event => !isUpcoming(event.event_date, event.start_time));

  if (authLoading || loading) {
    return (
      <div className="your-events-page">
        <div className="events-container">
          <div className="loading">Loading your events...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="your-events-page">
      <div className="events-container">
        <div className="events-header">
          <h2>Your Events</h2>
          <p>Manage all the events you've created</p>
          <div className="header-actions">
            <Link to="/create-event" className="btn btn-primary">Add Event</Link>
            <div className="upload-section">
              <input
                type="file"
                id="ics-upload"
                accept=".ics"
                onChange={handleICSUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <label htmlFor="ics-upload" className={`btn btn-outline ${uploading ? 'disabled' : ''}`}>
                {uploading ? 'Uploading...' : 'Upload ICS File'}
              </label>
            </div>
            <Link to="/profile" className="btn btn-secondary">Profile Settings</Link>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {uploadResult && (
          <div className="upload-result">
            <h4>ICS Upload Results</h4>
            <div className="upload-stats">
              <span className="stat-success">{uploadResult.imported} events imported</span>
              {uploadResult.duplicates > 0 && (
                <span className="stat-warning">{uploadResult.duplicates} duplicates skipped</span>
              )}
              {uploadResult.errors > 0 && (
                <span className="stat-error">{uploadResult.errors} errors</span>
              )}
            </div>
            {uploadResult.details && (
              <div className="upload-details">
                {uploadResult.details.imported_events.length > 0 && (
                  <div>
                    <strong>Imported:</strong>
                    <ul>
                      {uploadResult.details.imported_events.map((event, index) => (
                        <li key={index}>{event.title} - {event.date}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {uploadResult.details.duplicate_events.length > 0 && (
                  <div>
                    <strong>Duplicates skipped:</strong> {uploadResult.details.duplicate_events.join(', ')}
                  </div>
                )}
                {uploadResult.details.error_events.length > 0 && (
                  <div>
                    <strong>Errors:</strong> {uploadResult.details.error_events.join(', ')}
                  </div>
                )}
              </div>
            )}
            <button 
              onClick={() => setUploadResult(null)} 
              className="btn btn-sm btn-secondary"
              style={{ marginTop: '10px' }}
            >
              Close
            </button>
          </div>
        )}

        <div className="events-content">
          {/* Upcoming Events */}
          <div className="events-section">
            <h3>Upcoming Events ({upcomingEvents.length})</h3>
            {upcomingEvents.length === 0 ? (
              <div className="no-events">
                <p>No upcoming events</p>
                <Link to="/create-event" className="btn btn-primary">Add Event</Link>
              </div>
            ) : (
              <div className="events-grid">
                {upcomingEvents.map(event => {
                  const eventColor = event.color || '#470063';
                  const badgeTextColor = getContrastTextColor(eventColor);
                  
                  return (
                    <div 
                      key={event.id} 
                      className="event-card upcoming"
                      style={{ 
                        backgroundColor: '#ffffff',
                        borderColor: eventColor,
                        borderWidth: '3px',
                        borderStyle: 'solid'
                      }}
                    >
                      <div className="event-date-badge" style={{ 
                        backgroundColor: eventColor,
                        color: badgeTextColor
                      }}>
                        <span className="date-full">{formatDate(event.event_date)}</span>
                      </div>
                    
                    <div className="event-details">
                      <h4 style={{ color: eventColor }}>
                        {event.title}
                        {event.is_recurring && (
                          <span className="recurring-badge" title="Recurring event">🔁</span>
                        )}
                      </h4>
                      <div className="event-meta">
                        <div className="meta-item">
                          <strong>Date:</strong> {formatDate(event.event_date)}
                        </div>
                        <div className="meta-item">
                          <strong>Time:</strong> {formatTime(event.start_time)}
                          {event.end_time && ` - ${formatTime(event.end_time)}`}
                          {event.end_date && ` (until ${formatDate(event.end_date)})`}
                        </div>
                        <div className="meta-item">
                          <strong>Location:</strong> {event.location}
                        </div>
                        {event.description && (
                          <div className="meta-item">
                            <strong>Description:</strong> {event.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="event-actions">
                      <Link to={`/edit-event/${event.id}`} className="btn btn-sm btn-primary">Edit</Link>
                      <button
                        onClick={() => handleDelete(event.id, event.title)}
                        disabled={deleting === event.id}
                        className="btn btn-sm btn-danger"
                      >
                        {deleting === event.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div className="events-section">
              <h3>Past Events ({pastEvents.length})</h3>
              <div className="events-grid">
                {pastEvents.map(event => {
                  const eventColor = event.color || '#470063';
                  const badgeTextColor = getContrastTextColor(eventColor);
                  
                  return (
                    <div 
                      key={event.id} 
                      className="event-card past"
                      style={{ 
                        backgroundColor: '#ffffff',
                        borderColor: eventColor,
                        borderWidth: '3px',
                        borderStyle: 'solid',
                        opacity: 0.8
                      }}
                    >
                      <div className="event-date-badge past" style={{ 
                        backgroundColor: eventColor,
                        color: badgeTextColor,
                        opacity: 0.8
                      }}>
                        <span className="date-full">{formatDate(event.event_date)}</span>
                      </div>
                    
                    <div className="event-details">
                      <h4 style={{ color: eventColor }}>
                        {event.title}
                        {event.is_recurring && (
                          <span className="recurring-badge" title="Recurring event">🔁</span>
                        )}
                      </h4>
                      <div className="event-meta">
                        <div className="meta-item">
                          <strong>Date:</strong> {formatDate(event.event_date)}
                        </div>
                        <div className="meta-item">
                          <strong>Location:</strong> {event.location}
                        </div>
                      </div>
                    </div>
                    
                    <div className="event-actions">
                      <button
                        onClick={() => handleDelete(event.id, event.title)}
                        disabled={deleting === event.id}
                        className="btn btn-sm btn-danger"
                      >
                        {deleting === event.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YourEventsPage;