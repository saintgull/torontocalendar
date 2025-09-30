import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import './SubmissionsPage.css';

const SubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingSubmission, setApprovingSubmission] = useState(null);
  const [approvalForm, setApprovalForm] = useState({
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    link: ''
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only allow Erin Saint Gull
    if (!user || user.email !== 'saintgull94@gmail.com') {
      navigate('/');
      return;
    }
    fetchSubmissions();
  }, [user, navigate]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/admin/submissions`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        setError('Failed to load submissions');
      }
    } catch (error) {
      setError('Network error loading submissions');
    } finally {
      setLoading(false);
    }
  };

  const markAsProcessed = async (id) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/admin/submissions/${id}/processed`, {
        method: 'PATCH',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Update local state
        setSubmissions(submissions.map(sub => 
          sub.id === id ? { ...sub, processed: true } : sub
        ));
      } else {
        alert('Failed to update submission');
      }
    } catch (error) {
      alert('Network error updating submission');
    }
  };

  const startApproval = (submission) => {
    setApprovingSubmission(submission);
    // Pre-fill link if available
    setApprovalForm({
      event_date: '',
      start_time: '',
      end_time: '',
      location: '',
      link: submission.event_link || ''
    });
  };

  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/admin/submissions/${approvingSubmission.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(approvalForm)
      });
      
      if (response.ok) {
        // Remove from submissions list
        setSubmissions(submissions.filter(sub => sub.id !== approvingSubmission.id));
        setApprovingSubmission(null);
        setApprovalForm({
          event_date: '',
          start_time: '',
          end_time: '',
          location: '',
          link: ''
        });
        alert('Event created successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve submission');
      }
    } catch (error) {
      alert('Network error approving submission');
    }
  };

  const cancelApproval = () => {
    setApprovingSubmission(null);
    setApprovalForm({
      event_date: '',
      start_time: '',
      end_time: '',
      location: '',
      link: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="submissions-page">
        <div className="submissions-container">
          <div className="loading">Loading submissions...</div>
        </div>
      </div>
    );
  }

  if (!user || user.email !== 'saintgull94@gmail.com') {
    return null;
  }

  return (
    <div className="submissions-page">
      <div className="submissions-container">
        <h1>Event Submissions</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        {submissions.length === 0 ? (
          <div className="no-submissions">No submissions yet</div>
        ) : (
          <div className="submissions-list">
            {submissions.map(submission => (
              <div 
                key={submission.id} 
                className={`submission-card ${submission.processed ? 'processed' : ''}`}
              >
                <div className="submission-header">
                  <h3>{submission.event_name}</h3>
                  <span className={`status ${submission.processed ? 'status-processed' : 'status-pending'}`}>
                    {submission.processed ? 'Processed' : 'Pending'}
                  </span>
                </div>
                
                <div className="submission-details">
                  <p><strong>Submitted by:</strong> {submission.submitter_name}</p>
                  {submission.submitter_email && (
                    <p><strong>Email:</strong> <a href={`mailto:${submission.submitter_email}`}>{submission.submitter_email}</a></p>
                  )}
                  {submission.event_link && (
                    <p><strong>Link:</strong> <a href={submission.event_link} target="_blank" rel="noopener noreferrer">{submission.event_link}</a></p>
                  )}
                  <p><strong>Description:</strong></p>
                  <p className="description">{submission.event_description}</p>
                  <p className="submission-date"><strong>Submitted:</strong> {formatDate(submission.created_at)}</p>
                </div>
                
                {!submission.processed && (
                  <div className="submission-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => startApproval(submission)}
                    >
                      Approve & Create Event
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => markAsProcessed(submission.id)}
                    >
                      Mark as Processed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {approvingSubmission && (
          <div className="modal-overlay" onClick={cancelApproval}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Approve Event: {approvingSubmission.event_name}</h2>
                <button className="close-button" onClick={cancelApproval}>×</button>
              </div>
              
              <div className="modal-body">
                <p><strong>Submitted by:</strong> {approvingSubmission.submitter_name}</p>
                <p><strong>Description:</strong> {approvingSubmission.event_description}</p>
                {approvingSubmission.event_link && (
                  <p><strong>Link:</strong> <a href={approvingSubmission.event_link} target="_blank" rel="noopener noreferrer">{approvingSubmission.event_link}</a></p>
                )}
                
                <form onSubmit={handleApprovalSubmit}>
                  <div className="form-group">
                    <label htmlFor="event_date">Event Date *</label>
                    <input
                      type="date"
                      id="event_date"
                      value={approvalForm.event_date}
                      onChange={(e) => setApprovalForm({...approvalForm, event_date: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="start_time">Start Time *</label>
                      <input
                        type="time"
                        id="start_time"
                        value={approvalForm.start_time}
                        onChange={(e) => setApprovalForm({...approvalForm, start_time: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="end_time">End Time</label>
                      <input
                        type="time"
                        id="end_time"
                        value={approvalForm.end_time}
                        onChange={(e) => setApprovalForm({...approvalForm, end_time: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="location">Location *</label>
                    <input
                      type="text"
                      id="location"
                      value={approvalForm.location}
                      onChange={(e) => setApprovalForm({...approvalForm, location: e.target.value})}
                      placeholder="Enter event location"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="link">Event Link</label>
                    <input
                      type="url"
                      id="link"
                      value={approvalForm.link}
                      onChange={(e) => setApprovalForm({...approvalForm, link: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={cancelApproval}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Create Event & Remove Submission
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionsPage;