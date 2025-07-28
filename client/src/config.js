// API Configuration
const config = {
  development: {
    API_BASE_URL: '', // Uses proxy in development
  },
  production: {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'https://torontocalendar-production.up.railway.app',
  }
};

const currentConfig = config[process.env.NODE_ENV] || config.development;

export default currentConfig;