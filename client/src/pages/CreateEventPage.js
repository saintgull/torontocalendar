import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import DateTimePicker from '../components/DateTimePicker';
import config from '../config';
import './CreateEventPage.css';

const CreateEventPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    event_date: '',
    start_time: '13:00', // Default to 1:00 PM
    end_time: '14:00', // Default to 2:00 PM
    end_date: '',
    location: '',
    description: '',
    link: '',
    is_recurring: false,
    recurrence_type: 'weekly', // daily, weekly, monthly
    recurrence_end_date: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

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
    setLoading(true);

    // Clean up form data - only send recurrence fields if is_recurring is true
    const dataToSend = {
      title: formData.title,
      event_date: formData.event_date,
      start_time: formData.start_time,
      end_time: formData.end_time || undefined,
      end_date: formData.end_date || undefined,
      location: formData.location,
      description: formData.description || undefined,
      link: formData.link || undefined,
      is_recurring: formData.is_recurring
    };
    
    // Only include recurrence fields if event is recurring
    if (formData.is_recurring) {
      dataToSend.recurrence_type = formData.recurrence_type;
      dataToSend.recurrence_end_date = formData.recurrence_end_date;
    }
    
    console.log('Form data being sent:', dataToSend);

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/');
      } else {
        console.error('Backend error:', data);
        // Show error with suggestion if provided
        const errorMessage = data.suggestion 
          ? `${data.error}\n\nSuggestion: ${data.suggestion}`
          : (data.error || data.errors?.[0]?.msg || 'Failed to add event');
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Network error:', error);
      setError(`Network error: ${error.message}. Please check if the server is running.`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="create-event-page">
      <div className="create-event-container">
        <div className="create-event-header">
          <h2>Add Event</h2>
          <p>Add a new event to the Toronto calendar</p>
        </div>

        <form onSubmit={handleSubmit} className="create-event-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="title">Event Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={loading}
              maxLength="255"
            />
          </div>

          <DateTimePicker
            dateValue={formData.event_date}
            timeValue={formData.start_time}
            onDateChange={(date) => setFormData(prev => ({ 
              ...prev, 
              event_date: date,
              // Default end_date to start date if not already set
              end_date: prev.end_date || date 
            }))}
            onTimeChange={(time) => setFormData(prev => ({ ...prev, start_time: time }))}
            label="Event Start"
            required={true}
            disabled={loading}
          />

          <DateTimePicker
            dateValue={formData.end_date}
            timeValue={formData.end_time}
            onDateChange={(date) => setFormData(prev => ({ ...prev, end_date: date }))}
            onTimeChange={(time) => setFormData(prev => ({ ...prev, end_time: time }))}
            label="Event End Time"
            required={true}
            disabled={loading}
          />

          <div className="form-group">
            <label htmlFor="location">Location in Toronto *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              disabled={loading}
              maxLength="255"
              placeholder="e.g. CN Tower, 290 Bremner Blvd"
            />
          </div>

          <div className="form-group">
            <label htmlFor="link">Event Link</label>
            <input
              type="url"
              id="link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              disabled={loading}
              maxLength="500"
              placeholder="https://example.com/event"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              maxLength="2000"
              rows="4"
              placeholder="Optional event description..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="is_recurring" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="is_recurring"
                name="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                disabled={loading}
                style={{ marginRight: '8px', width: 'auto', minWidth: 'auto' }}
              />
              Make this a recurring event
            </label>
          </div>

          {formData.is_recurring && (
            <>
              <div className="form-group">
                <label htmlFor="recurrence_type">Repeat</label>
                <select
                  id="recurrence_type"
                  name="recurrence_type"
                  value={formData.recurrence_type}
                  onChange={handleChange}
                  disabled={loading}
                  required={formData.is_recurring}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="recurrence_end_date">End Recurring On</label>
                <input
                  type="date"
                  id="recurrence_end_date"
                  name="recurrence_end_date"
                  value={formData.recurrence_end_date}
                  onChange={handleChange}
                  disabled={loading}
                  min={formData.event_date}
                  required={formData.is_recurring}
                />
                <small>The last date this event will occur</small>
              </div>
            </>
          )}

          <div className="form-actions">
            <Link to="/" className="btn btn-secondary">Cancel</Link>
            <button 
              type="submit" 
              className="btn btn-create-event"
              disabled={loading}
            >
              {loading ? 'Adding Event...' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;