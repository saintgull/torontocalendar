import React, { useState, useEffect } from 'react';
import EventModal from './EventModal';
// eslint-disable-next-line no-unused-vars
import { getContrastTextColor, getDarkerColor } from '../utils/colorContrast';
import './Calendar.css';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBulkDownload, setShowBulkDownload] = useState(false);
  const [downloadStartDate, setDownloadStartDate] = useState('');
  const [downloadEndDate, setDownloadEndDate] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      console.log('Fetching events from /api/events...');
      const response = await fetch('/api/events');
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Events received:', data);
        setEvents(data);
      } else {
        console.error('Failed to fetch events. Status:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
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

  const getEventsForDate = (day) => {
    if (!day) return [];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const targetDate = new Date(year, month, day);
    const targetDateString = targetDate.toISOString().split('T')[0];
    
    const dayEvents = events.filter(event => {
      const startDateString = event.event_date.split('T')[0];
      
      // For single-day events
      if (!event.end_date) {
        return startDateString === targetDateString;
      }
      
      // For multi-day events, check if target date is within range
      const endDateString = event.end_date.split('T')[0];
      return targetDateString >= startDateString && targetDateString <= endDateString;
    });
    
    return dayEvents;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleBulkDownload = async () => {
    if (!downloadStartDate || !downloadEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      const response = await fetch(`/api/ics/bulk-download?start_date=${downloadStartDate}&end_date=${downloadEndDate}`);
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to download events');
        return;
      }
      
      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `toronto-events-${downloadStartDate}-to-${downloadEndDate}.zip`;
      
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
      
      // Reset form
      setShowBulkDownload(false);
      setDownloadStartDate('');
      setDownloadEndDate('');
    } catch (error) {
      console.error('Bulk download error:', error);
      alert('Failed to download events. Please try again.');
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  return (
    <div className="calendar-wrapper">
      <div className="calendar">
        <div className="calendar-header">
          <button onClick={previousMonth} className="nav-button">&lt;</button>
          <div className="calendar-title">
            <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setShowBulkDownload(true);
              }}
              style={{ 
                fontStyle: 'italic', 
                textDecoration: 'underline',
                fontSize: '0.9rem',
                color: 'var(--calendar-header-text)',
                marginLeft: '15px',
                cursor: 'pointer',
                lineHeight: '1.5rem',
                alignSelf: 'baseline'
              }}
            >
              Download all events
            </a>
          </div>
          <button onClick={nextMonth} className="nav-button">&gt;</button>
        </div>

      <div className="calendar-grid">
        {dayNames.map(dayName => (
          <div key={dayName} className="day-header">
            {dayName}
          </div>
        ))}

        {days.map((day, index) => {
          const dayEvents = day ? getEventsForDate(day) : [];
          
          return (
            <div key={index} className={`calendar-day ${!day ? 'empty' : ''}`}>
              {day && (
                <>
                  <div className="day-number">{day}</div>
                  <div className="day-events">
                    {dayEvents.map(event => {
                      const eventColor = event.color || '#470063';
                      
                      return (
                        <div
                          key={event.id}
                          className="event-item"
                          onClick={() => setSelectedEvent(event)}
                          style={{ 
                            backgroundColor: '#ffffff',
                            borderColor: eventColor,
                            borderWidth: '2px',
                            borderStyle: 'solid'
                          }}
                        >
                          <div className="event-title" style={{ color: eventColor }}>{event.title}</div>
                          <div className="event-time" style={{ color: eventColor, opacity: 0.8 }}>{formatTime(event.start_time)}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEventDeleted={(eventId, deleteAll) => {
            if (deleteAll) {
              // If deleting all in series, remove parent and all children
              const parentId = selectedEvent.parent_event_id || selectedEvent.id;
              setEvents(events.filter(e => 
                e.id !== parentId && e.parent_event_id !== parentId
              ));
            } else {
              // Just delete the single event
              setEvents(events.filter(e => e.id !== eventId));
            }
          }}
        />
      )}
      </div>
      
      {showBulkDownload && (
        <div className="modal-overlay" onClick={() => setShowBulkDownload(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Download Events</h2>
              <button className="close-button" onClick={() => setShowBulkDownload(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <p>Select a date range to download all events as individual ICS files in a ZIP archive.</p>
              
              <div className="form-group">
                <label htmlFor="start-date">Start Date</label>
                <input
                  type="date"
                  id="start-date"
                  value={downloadStartDate}
                  onChange={(e) => setDownloadStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="end-date">End Date</label>
                <input
                  type="date"
                  id="end-date"
                  value={downloadEndDate}
                  onChange={(e) => setDownloadEndDate(e.target.value)}
                  min={downloadStartDate || new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowBulkDownload(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleBulkDownload}
                  disabled={!downloadStartDate || !downloadEndDate}
                >
                  Download ZIP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;