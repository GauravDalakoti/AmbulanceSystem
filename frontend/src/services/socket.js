import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }

    this.socket.on(event, callback);

    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Unsubscribe from events
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }

    // Remove from listeners map
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit events
  emit(event, data) {
    if (!this.socket) {
      this.connect();
    }

    this.socket.emit(event, data);
  }

  // Join emergency room
  joinEmergency(emergencyId) {
    this.emit('joinEmergency', emergencyId);
  }

  // Leave emergency room
  leaveEmergency(emergencyId) {
    this.emit('leaveEmergency', emergencyId);
  }

  // Update ambulance location
  updateAmbulanceLocation(ambulanceId, location) {
    this.emit('updateAmbulanceLocation', { ambulanceId, location });
  }

  // Update emergency status
  updateEmergencyStatus(emergencyId, status) {
    this.emit('updateEmergencyStatus', { emergencyId, status });
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
    this.listeners.delete(event);
  }

  // Listen for ambulance location updates
  onAmbulanceLocationUpdate(callback) {
    this.on('ambulanceLocationUpdate', callback);
  }

  // Listen for emergency status updates (DB version)
  onEmergencyStatusUpdate(callback) {
    this.on('emergencyStatusUpdate', callback);
  }

  // Listen for driver location updates (simple version)
  onLocationUpdated(callback) {
    this.on('locationUpdated', callback);
  }

  // Listen for simple emergency updates
  onEmergencyUpdated(callback) {
    this.on('emergencyUpdated', callback);
  }

  // Clean up all listeners
  cleanup() {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.off(event, callback);
      });
    });
    this.listeners.clear();
  }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;
