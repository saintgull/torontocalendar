import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import ProfileSidePanel from './ProfileSidePanel';
// eslint-disable-next-line no-unused-vars
import { formatDateDDMMYYYY, formatDateForDisplay } from '../utils/dateFormat';
import config from '../config';
import './EventModal.css';

const EventModal = ({ event, onClose, onEventDeleted }) => {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  
  const handleDownloadICS = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/ics/event/${event.id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to download calendar file');
        return;
      }
      
      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `${event.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}.ics`;
      
      // Convert response to blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('ICS download error:', error);
      alert('Failed to download calendar file. Please try again.');
    }
  };

  const handleDelete = async (deleteAll = false) => {
    setDeleting(true);
    let hasChildrenFlag = false;
    
    try {
      const url = deleteAll ? `${config.API_BASE_URL}/api/events/${event.id}/series` : `${config.API_BASE_URL}/api/events/${event.id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      hasChildrenFlag = data.hasChildren;
      
      if (response.ok) {
        // Check if this is a parent recurring event with children
        if (data.hasChildren && !deleteAll) {
          setDeleting(false);
          // Show confirmation dialog for deleting all occurrences
          const deleteAllConfirm = window.confirm(
            `${data.message}\n\nClick OK to delete all ${data.childCount + 1} occurrences, or Cancel to delete only this event.`
          );
          
          if (deleteAllConfirm) {
            // Recursively call to delete all
            handleDelete(true);
          } else {
            // Just delete the single event
            const singleResponse = await fetch(`${config.API_BASE_URL}/api/events/${event.id}`, {
              method: 'DELETE',
              credentials: 'include',
              headers: {
                'X-Force-Single': 'true'
              }
            });
            
            if (singleResponse.ok) {
              onEventDeleted(event.id, false);
              onClose();
            } else {
              const singleData = await singleResponse.json();
              alert(singleData.error || 'Failed to delete event');
            }
          }
        } else {
          // Normal deletion succeeded
          onEventDeleted(event.id, deleteAll);
          onClose();
        }
      } else {
        alert(data.error || 'Failed to delete event');
      }
    } catch (error) {
      alert('Network error. Failed to delete event.');
    } finally {
      if (!hasChildrenFlag) {
        setDeleting(false);
      }
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event.title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="event-details">
            {event.is_all_day ? (
              <div className="detail-item">
                <strong>Date:</strong> {formatDate(event.event_date)}
                {event.end_date && event.end_date !== event.event_date && ` - ${formatDate(event.end_date)}`}
                {' '}(All day)
              </div>
            ) : (
              <>
                <div className="detail-item">
                  <strong>Start:</strong> {formatDate(event.event_date)} at {formatTime(event.start_time)}
                </div>
                
                {event.end_date && event.end_time && (
                  <div className="detail-item">
                    <strong>End:</strong> {formatDate(event.end_date)} at {formatTime(event.end_time)}
                  </div>
                )}
                
                {!event.end_date && event.end_time && (
                  <div className="detail-item">
                    <strong>End:</strong> {formatTime(event.end_time)} (same day)
                  </div>
                )}
              </>
            )}
            
            <div className="detail-item">
              <strong>Location:</strong>{' '}
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--auburn)', textDecoration: 'none' }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                {event.location}
              </a>
            </div>
            
            {event.link && (
              <div className="detail-item">
                <strong>Link:</strong> <a href={event.link} target="_blank" rel="noopener noreferrer">{event.link}</a>
              </div>
            )}
            
            {event.is_recurring && (
              <div className="detail-item">
                <strong>Recurring:</strong> {event.recurrence_rule?.replace('FREQ=', '')} 
                {event.recurrence_end_date && ` until ${formatDate(event.recurrence_end_date)}`}
              </div>
            )}
            
            <div className="detail-item">
              <strong>Added by:</strong> 
              <button 
                className="creator-link"
                onClick={() => setShowProfilePanel(true)}
              >
                {event.creator_name}
              </button>
            </div>
            
            {event.description && (
              <div className="detail-item">
                <strong>Description:</strong>
                <p>{event.description}</p>
              </div>
            )}
          </div>
          
          <div className="modal-actions">
            <button
              className="btn btn-calendar"
              onClick={handleDownloadICS}
            >
              Add to Calendar
            </button>
            {user && user.id === event.created_by && (
              <>
                <button
                  className="btn btn-edit"
                  onClick={() => {
                    // Navigate to edit page
                    window.location.href = `/edit-event/${event.id}`;
                  }}
                >
                  Edit Event
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this event?')) {
                      handleDelete();
                    }
                  }}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Event'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {showProfilePanel && (
        <ProfileSidePanel
          userId={event.created_by}
          onClose={() => setShowProfilePanel(false)}
        />
      )}
    </div>
  );
};

export default EventModal;