import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Calendar from './components/Calendar';
import LoginPage from './pages/LoginPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import ProfilePage from './pages/ProfilePage';
import YourEventsPage from './pages/YourEventsPage';
import SetPasswordPage from './pages/SetPasswordPage';
import SubmitEventPage from './pages/SubmitEventPage';

// Context for authentication
import { AuthProvider } from './utils/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Calendar />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/create-event" element={<CreateEventPage />} />
              <Route path="/edit-event/:id" element={<EditEventPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/your-events" element={<YourEventsPage />} />
              <Route path="/set-password" element={<SetPasswordPage />} />
              <Route path="/submit-event" element={<SubmitEventPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
