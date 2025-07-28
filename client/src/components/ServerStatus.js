import React, { useState, useEffect } from 'react';
import './ServerStatus.css';

const ServerStatus = () => {
  const [status, setStatus] = useState('checking');
  const [healthData, setHealthData] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health', {
        credentials: 'include' // Include cookies for authentication
      });
      const data = await response.json();
      
      if (response.ok) {
        setStatus('online');
        setHealthData(data);
      } else {
        setStatus('degraded');
        setHealthData(data);
      }
      setLastChecked(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      setStatus('offline');
      setHealthData(null);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    // Initial check
    checkHealth();

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return '🟢';
      case 'degraded':
        return '🟡';
      case 'offline':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Server Online';
      case 'degraded':
        return 'Server Degraded';
      case 'offline':
        return 'Server Offline';
      default:
        return 'Checking...';
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className={`server-status ${status}`}>
      <div className="status-indicator">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
      </div>
      
      {healthData && status !== 'offline' && (
        <div className="status-details">
          <div className="detail-item">
            <span className="detail-label">Uptime:</span>
            <span className="detail-value">{formatUptime(healthData.uptime)}</span>
          </div>
          {healthData.checks?.database && (
            <div className="detail-item">
              <span className="detail-label">Database:</span>
              <span className={`detail-value ${healthData.checks.database.status === 'connected' ? 'connected' : 'error'}`}>
                {healthData.checks.database.status}
              </span>
            </div>
          )}
          {lastChecked && (
            <div className="detail-item">
              <span className="detail-label">Last Check:</span>
              <span className="detail-value">
                {lastChecked.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServerStatus;