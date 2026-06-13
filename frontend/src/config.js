export const config = {
  // Set to true to use real backend, false to use Demo Mode (mock services)
  USE_BACKEND: true,
  
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5002',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5002',
  
  // Hyderabad central fallback
  DEFAULT_LOCATION: {
    latitude: 17.4483,
    longitude: 78.3915,
  }
}
