import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from "dotenv"
import cookieParser from "cookie-parser";

import emergencyRoutes from "./src/routes/emergencyRoutes.js"
import ambulanceRoutes from "./src/routes/ambulanceRoutes.js"
import hospitalRoutes from "./src/routes/hospitalRoutes.js"
import graphRoutes from "./src/routes/graphRoutes.js"
import userRoutes from "./src/routes/userRoutes.js"
import driverRoutes from "./src/routes/driverRoutes.js"
import dispatchService from "./src/services/dispatchService.js"

dotenv.config({ path: "./.env" })

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.io = io;
  next();
});

const MONGODB_URI = process.env.MONGODB_URI 

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log(' Connected to MongoDB');
    // Initialize dispatch service
    return dispatchService.initialize();
  })
  .then(() => {
    console.log(' Dispatch service initialized');
  })
  .catch(err => {
    console.error(' MongoDB connection error:', err);
  });

// Routes
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/graph', graphRoutes);
app.use("/api/user", userRoutes)
app.use('/api/driver', driverRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('updateAmbulanceLocation', async (data) => {
    try {
      const { ambulanceId, location } = data;
      await dispatchService.updateAmbulanceLocation(ambulanceId, location);

      io.emit('ambulanceLocationUpdate', {
        ambulanceId,
        location
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('updateEmergencyStatus', async (data) => {
    try {
      const { emergencyId, status } = data;
      const Emergency = require('./src/models/EmergencyRequest.js');

      const emergency = await Emergency.findById(emergencyId);
      if (emergency) {
        emergency.status = status;
        await emergency.save();

        io.emit('emergencyStatusUpdate', emergency);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('joinEmergency', (emergencyId) => {
    socket.join(`emergency-${emergencyId}`);
    console.log(`Socket ${socket.id} joined emergency-${emergencyId}`);
  });

  socket.on('leaveEmergency', (emergencyId) => {
    socket.leave(`emergency-${emergencyId}`);
    console.log(`Socket ${socket.id} left emergency-${emergencyId}`);
  });

  socket.on('updateLocation', (data) => {
    console.log('Location update:', data);
    io.emit('locationUpdated', data);
  });

  socket.on('emergencyStatusUpdate', (data) => {
    console.log(' Emergency status update:', data);
    io.emit('emergencyUpdated', data);
  });

  socket.on('disconnect', () => {
    console.log(' Client disconnected:', socket.id);
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Socket.IO enabled`);
});

export { app, io };