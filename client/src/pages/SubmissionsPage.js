import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import './SubmissionsPage.css';

const SubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      </div>
    </div>
  );
};

export default SubmissionsPage;