import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import config from '../config';
import './CreateEventPage.css';

const SubmitEventPage = () => {
  const [formData, setFormData] = useState({
    eventName: '',
    submitterName: '',
    submitterEmail: '',
    eventLink: '',
    eventDescription: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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

    try {
      console.log('Submitting to:', `${config.API_BASE_URL}/api/submit-event`);
      console.log('Form data:', formData);
      console.log('User agent:', navigator.userAgent);
      
      const response = await fetch(`${config.API_BASE_URL}/api/submit-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
        cache: 'no-cache'
      });

      const data = await response.json();

      console.log('Submit response status:', response.status);
      console.log('Submit response data:', data);

      if (response.ok) {
        setSuccess(true);
        setFormData({
          eventName: '',
          submitterName: '',
          submitterEmail: '',
          eventLink: '',
          eventDescription: ''
        });
      } else {
        console.error('Submit failed with status:', response.status);
        console.error('Error details:', data);
        setError(data.error || `Failed to submit event (${response.status}). Please try again.`);
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="create-event-page">
        <div className="create-event-container">
          <div className="create-event-header">
            <h2>Event Submitted Successfully!</h2>
            <p>Thanks for your submission. We'll review your event and add it to the calendar if it's a good fit.</p>
            <p>You should see it appear within 2-3 business days if approved.</p>
          </div>
          <div className="form-actions">
            <Link to="/" className="btn btn-primary">Back to Calendar</Link>
            <button 
              onClick={() => setSuccess(false)} 
              className="btn btn-secondary"
            >
              Submit Another Event
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-event-page">
      <div className="create-event-container">
        <div className="create-event-header">
          <h2>Submit an Event</h2>
          <p>Help us discover great events happening in Toronto! Submit your event for review and potential inclusion on our calendar.</p>
        </div>

        <form onSubmit={handleSubmit} className="create-event-form">
          {error && (
            <div className="error-message">
              {error}
              {error.includes('token') && (
                <div style={{ marginTop: '10px', fontSize: '0.9rem', opacity: 0.8 }}>
                  💡 <strong>Mobile users:</strong> Try refreshing the page or using a different browser if you continue to see authentication errors.
                </div>
              )}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="eventName">Event Name *</label>
            <input
              type="text"
              id="eventName"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              required
              disabled={loading}
              maxLength="255"
              placeholder="e.g. Summer Jazz Concert in Trinity Bellwoods"
            />
          </div>

          <div className="form-group">
            <label htmlFor="submitterName">Your Name *</label>
            <input
              type="text"
              id="submitterName"
              name="submitterName"
              value={formData.submitterName}
              onChange={handleChange}
              required
              disabled={loading}
              maxLength="100"
              placeholder="First and last name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="submitterEmail">Your Email (optional)</label>
            <input
              type="email"
              id="submitterEmail"
              name="submitterEmail"
              value={formData.submitterEmail}
              onChange={handleChange}
              disabled={loading}
              maxLength="255"
              placeholder="your.email@example.com"
            />
            <small>We may contact you if we need more details about the event</small>
          </div>

          <div className="form-group">
            <label htmlFor="eventLink">Event Link (optional)</label>
            <input
              type="url"
              id="eventLink"
              name="eventLink"
              value={formData.eventLink}
              onChange={handleChange}
              disabled={loading}
              placeholder="https://..."
            />
            <small>Event website, Facebook page, Eventbrite link, etc.</small>
          </div>

          <div className="form-group">
            <label htmlFor="eventDescription">Event Description *</label>
            <textarea
              id="eventDescription"
              name="eventDescription"
              value={formData.eventDescription}
              onChange={handleChange}
              required
              disabled={loading}
              maxLength="2000"
              rows="6"
              placeholder="Include date, time, location, ticket info, and what makes this event special... The more details you provide, the easier it is for us to review and add your event."
            />
          </div>

          <div className="form-actions">
            <Link to="/" className="btn btn-secondary">Cancel</Link>
            <button 
              type="submit" 
              className="btn btn-submit-event"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitEventPage;