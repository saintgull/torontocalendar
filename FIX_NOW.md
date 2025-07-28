# CRITICAL ISSUES TO FIX IMMEDIATELY

## 🚨 CURRENT STATE: Backend crashes when creating events

### ERROR SYMPTOMS:
```
Form data being sent: Object
Specifically - Date: 2025-07-20 Start Time: 13:00
Failed to load resource: net::ERR_CONNECTION_REFUSED
Network error: TypeError: Failed to fetch
```

## 1. BACKEND CRASHING ON EVENT CREATION

**DIAGNOSIS NEEDED:**
1. Backend server starts fine but crashes when POST /api/events is called
2. No error logs visible - need better error handling
3. Possible causes:
   - Database connection failing
   - Missing required fields in request
   - Date/time format mismatch
   - Authentication middleware failing

**IMMEDIATE ACTIONS:**
```bash
# 1. Check if PostgreSQL is running
brew services list | grep postgresql

# 2. Test database connection directly
psql -h localhost -p 5432 -U tocalendar_user -d tocalendar -c "SELECT 1;"

# 3. Run backend with detailed logging
NODE_ENV=development DEBUG=* node server.js
```

**ADD THIS DEBUGGING TO server.js:**
```javascript
// Add at the top after imports
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});
```

## 2. FRONTEND-BACKEND CONNECTION ISSUES

**CURRENT SETUP:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Proxy configured in client/package.json: `"proxy": "http://localhost:3001"`

**POTENTIAL ISSUES:**
1. React proxy might not be working with latest create-react-app
2. CORS configuration might be blocking requests
3. Authentication cookies not being sent

**FIX ATTEMPTS:**
```javascript
// In CreateEventPage.js, try absolute URL:
const response = await fetch('http://localhost:3001/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(formData),
  credentials: 'include'
});
```

## 3. DATE/TIME FORMAT ISSUES

**CURRENT IMPLEMENTATION:**
- Using native HTML5 inputs: `<input type="date">` and `<input type="time">`
- Backend expects: 
  - `event_date`: ISO date (YYYY-MM-DD)
  - `start_time`: 24-hour format (HH:MM)

**WHAT'S BEING SENT:**
```
Date: 2025-07-20
Start Time: 13:00
```

**CHECK BACKEND VALIDATION:**
Look at `/routes/events.js` line 89-91:
- Regex for start_time: `/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/`
- This should match "13:00" but verify

## 4. UI/UX ISSUES NOT FIXED

### A. WHITE-ON-WHITE CONTRAST PROBLEMS
**User complaint:** "do not put white on white ANYWHERE"

**LOCATIONS TO CHECK:**
1. Calendar cells with white background on mindaro background
2. Button text visibility
3. Form input text on white backgrounds
4. Event cards text contrast

**FIX:**
```css
/* Ensure all white elements have borders or shadows */
.calendar-cell-bg: rgba(255, 255, 255, 0.9); /* Add border */
.calendar-cell-border: rgba(197, 213, 228, 0.5); /* Not enough contrast */
```

### B. BUTTON SIZING INCONSISTENCY
**User complaint:** "all the buttons should be the same size"

**CURRENT ISSUE:**
- Header buttons have different sizes
- "Add Event" button is too big compared to others

**FIX NEEDED:**
```css
/* In Header.css */
.user-menu .btn {
  min-width: 90px; /* Reduce further */
  max-width: 90px; /* Add max-width constraint */
  padding: 6px 10px; /* Smaller padding */
  font-size: 0.8rem; /* Even smaller */
}
```

## 5. AUTHENTICATION STATE ISSUES

**SYMPTOMS:**
- User might not be properly authenticated
- req.user might be undefined in backend

**CHECK:**
1. Is JWT token being set in cookie?
2. Is cookie being sent with requests?
3. Is requireAuth middleware working?

**DEBUG:**
```javascript
// In routes/events.js, add before line 96:
console.log('User from request:', req.user);
console.log('Cookies:', req.cookies);
```

## 6. DATABASE SCHEMA MISMATCH

**POTENTIAL ISSUE:**
Events table might not have all required columns

**CHECK:**
```sql
-- Connect to database and check schema
\d events;
```

**REQUIRED COLUMNS:**
- id, title, event_date, start_time, end_time, end_date
- location, description, created_by, creator_name
- created_at, updated_at

## EFFICIENT PROMPTS FOR NEXT CLAUDE:

1. **"The backend crashes when creating events. Add comprehensive error logging to server.js and routes/events.js, then try creating an event to see the actual error."**

2. **"Check if PostgreSQL is running and the database connection works. The connection details are in .env file."**

3. **"Fix the white-on-white contrast issues in Calendar.css by adding proper borders and background colors to all white elements."**

4. **"Make all header buttons exactly 90px wide with consistent padding in Header.css"**

5. **"If the proxy isn't working, temporarily use absolute URLs (http://localhost:3001) for API calls to diagnose the issue."**

## PRIORITY ORDER:
1. Fix backend crash (can't do anything until this works)
2. Fix button sizing (quick CSS fix)
3. Fix white-on-white contrast (CSS fixes)
4. Optimize the rest

## DON'T WASTE TIME ON:
- WebSocket errors (just hot reload, not critical)
- React Router warnings (future version stuff)
- ESLint warnings (not breaking anything)

## TEST SEQUENCE:
1. Start both servers: `npm run dev:full`
2. Open browser console
3. Try to create event
4. Check BOTH browser console AND terminal for errors
5. If backend crashes, check the terminal output immediately

The user is frustrated because previous attempts were inefficient and didn't address the real issues. BE DIRECT, FIX THE ACTUAL PROBLEMS, TEST EVERYTHING.