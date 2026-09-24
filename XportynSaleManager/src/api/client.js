import axios from 'axios';

/**
 * Axios instance.
 *
 * baseURL default `/api` hai — Vite dev server isay backend
 * (http://localhost:3000) par proxy kar deta hai (vite.config.js dekhein).
 *
 * Production/alag host ke liye `.env` me set karein:
 *   VITE_API_URL=http://localhost:3000/api
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});


/* --------------------------------------------------------------- */
/* Request interceptor: har request me JWT token laga do            */
/* --------------------------------------------------------------- */
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* --------------------------------------------------------------- */
/* Response interceptor: token expire ho to login par bhej do       */
/* --------------------------------------------------------------- */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401 || status === 403) {
      // localStorage.removeItem(TOKEN_KEY);
      // localStorage.removeItem(USER_KEY);

      // Login page par already hain to dobara redirect na karein
      if (!window.location.pathname.includes('/')) {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

/** Backend error message nikalne ka helper */
export const getErrorMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message || error?.message || fallback;

export default client;
