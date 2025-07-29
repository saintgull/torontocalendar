import React from 'react';
import './DateTimePicker.css';

const DateTimePicker = ({ 
  dateValue, 
  timeValue, 
  onDateChange, 
  onTimeChange, 
  label, 
  required = false,
  disabled = false,
  hideTime = false 
}) => {
  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];
  
  // Default time to 1:00 PM if not provided
  const defaultTime = timeValue || '13:00';

  return (
    <div className="datetime-picker">
      <label className="datetime-label">
        {label} {required && <span className="required">*</span>}
      </label>
      
      <div className="datetime-inputs">
        <div className="date-input-wrapper">
          <input
            type="date"
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            required={required}
            disabled={disabled}
            className="date-input"
            min={today}
          />
        </div>
        
        {!hideTime && (
          <div className="time-input-wrapper">
            <input
              type="time"
              value={defaultTime}
              onChange={(e) => onTimeChange(e.target.value)}
              required={required}
              disabled={disabled}
              className="time-input"
              step="900" // 15-minute increments
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimePicker;