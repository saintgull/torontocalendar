# Toronto Calendar

A community-driven event calendar for Toronto, built with React and Node.js. This platform allows users to discover, create, and manage local events with features like recurring events, ICS import/export, and user authentication.

## 🌟 Features

- **Event Management**: Create, edit, and delete events with full recurring event support
- **Calendar Views**: Clean, intuitive calendar interface with monthly navigation
- **ICS Support**: Import/export events to/from calendar applications (Google Calendar, Outlook, etc.)
- **User Authentication**: Secure invite-based user system with bcrypt password hashing
- **Event Submission**: Public event submission form for community contributions
- **Bulk Operations**: Download multiple events as ZIP archives
- **Responsive Design**: Mobile-friendly interface that works on all devices
- **Color-Coded Events**: Visual organization with deterministic color assignment

## 🎯 Why Open Source?

I've made this code public for several reasons:

1. **Community Collaboration**: If you're interested in contributing features, bug fixes, or improvements, you're welcome to submit pull requests
2. **Transparency**: The Toronto community can see exactly how their data is handled and stored
3. **Learning Resource**: Other developers can use this as a reference for building similar community platforms
4. **Feedback Welcome**: If you spot security issues, bugs, or have suggestions for improvements, please open an issue

## 🏗️ Tech Stack

**Frontend:**
- React 18 with functional components and hooks
- React Router for navigation
- CSS custom properties for theming
- Responsive design with mobile-first approach

**Backend:**
- Node.js with Express.js
- PostgreSQL database
- JWT authentication with httpOnly cookies
- bcrypt for password hashing (12 salt rounds)
- Nodemailer for email notifications

**Features:**
- ICS/iCalendar file parsing and generation
- Recurring events with RRULE support
- File upload handling with multer
- Input validation with express-validator
- CORS configuration for cross-origin requests

## 🔐 Security

This application implements security best practices:

- **Password Security**: All passwords are hashed using bcrypt with 12 salt rounds
- **Authentication**: JWT tokens stored in secure httpOnly cookies
- **Input Validation**: All user inputs are validated and sanitized
- **Database Security**: Parameterized queries prevent SQL injection
- **Environment Variables**: Sensitive configuration stored in environment variables

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### Environment Setup

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tocalendar
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
APP_URL=http://localhost:3000

# Email Configuration (for event submissions)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/saintgull/torontocalendar.git
   cd torontocalendar
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   cd ..
   ```

4. Set up the database:
   ```bash
   # Create the database and tables
   psql -U your_db_user -d postgres -f database.sql
   
   # Run migrations
   psql -U your_db_user -d tocalendar -f migrations/add_recurring_events.sql
   psql -U your_db_user -d tocalendar -f migrations/add_event_color.sql
   psql -U your_db_user -d tocalendar -f migrations/add_event_link.sql
   psql -U your_db_user -d tocalendar -f migrations/add_user_link.sql
   ```

5. Start the development servers:
   ```bash
   # Start backend (from root directory)
   npm start
   
   # In a new terminal, start frontend
   cd client
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions and contexts
│   │   └── styles/        # CSS and styling
├── routes/                # Express.js API routes
├── middleware/            # Custom middleware functions  
├── utils/                 # Backend utility functions
├── migrations/            # Database migration scripts
└── server.js             # Main server file
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Bug Reports**: Open an issue describing the bug with steps to reproduce
2. **Feature Requests**: Suggest new features by opening an issue
3. **Pull Requests**: 
   - Fork the repository
   - Create a feature branch (`git checkout -b feature/amazing-feature`)
   - Commit your changes (`git commit -m 'Add amazing feature'`)
   - Push to the branch (`git push origin feature/amazing-feature`)
   - Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new features when possible
- Update documentation for significant changes
- Ensure all tests pass before submitting PR

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Created By

**Erin Saint Gull** - [curate.beauty](https://curate.beauty)

---

*Built with ❤️ for the Toronto community*