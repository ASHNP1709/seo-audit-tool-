// ==============================================
// API Helper - Connects frontend to our NestJS backend
// Like: axios config in a Laravel Vue/React frontend
//
// This file:
// 1. Sets the base URL for all API calls (port 4000)
// 2. Automatically attaches JWT token to every request
// 3. Handles token expiry (redirects to login)
// ==============================================

import axios from 'axios';
// axios = HTTP client (like fetch but better error handling)
// Like: Http::withToken($token)->get('/api/...') in Laravel

import Cookies from 'js-cookie';
// Cookies = read/write browser cookies
// We store JWT token in cookies so it persists across page refreshes

// Create axios instance with base URL pointing to our NestJS backend
// All API calls use this: api.get('/auth/me'), api.post('/auth/login', data)
// Like: Http::baseUrl('http://localhost:4000/api') in Laravel
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  // NEXT_PUBLIC_ prefix = makes env var available in browser
  // Like: MIX_ prefix in Laravel Mix or VITE_ prefix in Vite
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR - runs BEFORE every API call
// Automatically attaches JWT token from cookie to every request
// Like: adding Authorization header in Laravel HTTP client globally
// Like: middleware that adds Bearer token to every outgoing request
api.interceptors.request.use(
  (config) => {
    // Read token from browser cookie
    const token = Cookies.get('accessToken');
    // If we have a token, add it to the request header
    // Like: $request->withHeader('Authorization', 'Bearer '.$token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// RESPONSE INTERCEPTOR - runs AFTER every API response
// If we get 401 (Unauthorized), token is expired -> redirect to login
// Like: middleware that catches AuthenticationException in Laravel
api.interceptors.response.use(
  // Success - just return the response as-is
  (response) => response,
  // Error - check if 401
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear cookies and redirect to login
      // Like: Auth::logout() then redirect('/login')
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      // Only redirect if in browser (not during server-side rendering)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
