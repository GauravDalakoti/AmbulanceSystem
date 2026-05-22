import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// User API

export const userApi = {

  register: async (data) => {

    const response = await api.post("/user/register", data)
    console.log(response);

    return response.data;
  },
  login: async (data) => {

    const response = await api.post("/user/login", data)
    console.log(response);

    return response
  },

  logout: async () => {
    const response = await api.get("/user/logout");
    return response.data;
  },

  getProfile: (userId) => api.get(`/user/profile/${userId}`),
  updateProfile: (userId, data) => api.put(`/user/profile/${userId}`, data),

  // Emergencies
  getEmergencies: (userId) => api.get(`/user/emergencies/${userId}`),
  getActiveEmergency: (userId) => api.get(`/user/emergencies/${userId}/active`),
  getEmergency: (emergencyId) => api.get(`/user/emergency/${emergencyId}`),
  cancelEmergency: (emergencyId) =>
    api.patch(`/user/emergency/${emergencyId}/cancel`),

  // Ambulance Tracking
  getAmbulanceLocation: (ambulanceId) =>
    api.get(`/user/ambulance/${ambulanceId._id}/location`),
  
  // get by direct Ambulance id
  getAmbulanceLocationById: (ambulanceId) =>
    api.get(`/user/ambulance/${ambulanceId}/location`),

  // Statistics
  getStats: (userId) => api.get(`/user/stats/${userId}`),

  // Graph/Map
  getGraph: () => api.get('/user/graph'),

  // Feedback
  submitFeedback: (emergencyId, userId, rating, comment) =>
    api.post(`/user/emergency/${emergencyId}/feedback`, {
      userId,
      rating,
      comment
    }),

  // Notifications
  getNotifications: (userId) => api.get(`/user/notifications/${userId}`)

}

// Emergency API
export const emergencyAPI = {
  create: (data) => api.post('/emergencies', data),
  getDriverEmergencies: (username) => api.post('/driver-emergencies/username', { username }),
  getAll: (status) => api.get('/emergencies', { params: { status } }),
  getById: (id) => api.get(`/emergencies/${id}`),
  updateStatus: (id, status) => api.patch(`/emergencies/${id}/status`, { status }),
  complete: (id) => api.post(`/emergencies/${id}/complete`),
  getActive: () => api.get('/emergencies/active/list'),

};

// Ambulance API
export const ambulanceAPI = {
  getAll: (status) => api.get('/ambulances', { params: { status } }),
  getById: (id) => api.get(`/ambulances/${id}`),
  create: (data) => api.post('/ambulances', data),
  updateLocation: (id, location) => api.patch(`/ambulances/${id}/location`, { currentLocation: location }),
  updateStatus: (id, status) => api.patch(`/ambulances/${id}/status`, { status }),
  update: (id, data) => api.put(`/ambulances/${id}`, data),
  delete: (id) => api.delete(`/ambulances/${id}`),
  getAvailable: () => api.get('/ambulances/available/list'),
  // Get ambulance by driver username
  getByDriver: (username) => api.get(`/ambulances/driver-emergencies/${username}`),

};

// Hospital API
export const hospitalAPI = {
  getAll: () => api.get('/hospitals'),
  getById: (id) => api.get(`/hospitals/${id}`),
  create: (data) => api.post('/hospitals', data),
  update: (id, data) => api.put(`/hospitals/${id}`, data),
  updateCapacity: (id, capacity) => api.patch(`/hospitals/${id}/capacity`, capacity),
  delete: (id) => api.delete(`/hospitals/${id}`)
};

// Graph API
export const graphAPI = {
  get: () => api.get('/graph'),
  addNode: (data) => api.post('/graph/nodes', data),
  addEdge: (data) => api.post('/graph/edges', data),
  removeEdge: (data) => api.delete('/graph/edges', { data }),
  getStats: () => api.get('/graph/stats')
};

// driver apis
// export const driverApi = {
//   getDriverDashboardData: (driverId) => api.get(`/driver-dashboard/${driverId}`),

// };

// ============ DRIVER API ============
export const driverAPI = {
  // Get driver's ambulance
  getAmbulance: () => api.get('/driver/ambulance'),

  // Get driver's active emergency
  getActiveEmergency: () => api.get('/driver/active-emergency'),

  // Update emergency status
  updateEmergencyStatus: (emergencyId, status) =>
    api.put(`/driver/emergency/${emergencyId}/status`, { status }),

  // Get driver statistics
  getStats: () => api.get('/driver/stats'),

  // Update driver location
  updateLocation: (location) => api.put('/driver/location', { location })
};

export default api;