import axios from 'axios';

// Create a configured instance of Axios
// Concept: Pre-configuration. We set the rules once.
const api = axios.create({
  // We don't set a baseURL because Vite Proxy handles the domain.
  // We just ask for "/health", and Vite forwards it to localhost:8000/health
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;