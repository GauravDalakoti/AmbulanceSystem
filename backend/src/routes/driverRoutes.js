
// const Ambulance = require('../models/Ambulance');
// const Emergency = require('../models/Emergency');
// const verifyJWT = require('../middleware/verifyJWT');

import { EmergencyRequest } from "../models/EmergencyRequest.js";
import { Ambulance } from "../models/Ambulance.js"
import { Router } from 'express';
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

/**
 * GET /api/driver/ambulance
 * Get ambulance details by driver username
 */
router.get('/ambulance', verifyJWT, async (req, res) => {
  try {
    const { username } = req.user;

    // Find ambulance assigned to this driver
    const ambulance = await Ambulance.findOne({
      'driver.name': username
    }).populate('currentLocation');

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'No ambulance assigned to this driver'
      });
    }

    res.json({
      success: true,
      data: ambulance
    });
  } catch (error) {
    console.error('Error fetching driver ambulance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * GET /api/driver/active-emergency
 * Get active emergency assigned to driver's ambulance
 */
router.get('/active-emergency', verifyJWT, async (req, res) => {
  try {
    const { username } = req.user;

    // Find driver's ambulance
    const ambulance = await Ambulance.findOne({
      'driver.name': username
    });

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'No ambulance assigned'
      });
    }

    // Find active emergency for this ambulance
    const emergency = await EmergencyRequest.findOne({
      assignedAmbulanceId: ambulance._id,
      status: { $in: ['ASSIGNED', 'IN_TRANSIT', 'REACHED'] }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: emergency
    });
  } catch (error) {
    console.error('Error fetching active emergency:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * PUT /api/driver/emergency/:id/status
 * Update emergency status by driver
 */
router.put('/emergency/:id/status', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { username } = req.user;

    // Validate status
    const validStatuses = ['IN_TRANSIT', 'REACHED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Find driver's ambulance
    const ambulance = await Ambulance.findOne({
      'driver.name': username
    });

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'No ambulance assigned'
      });
    }

    // Find emergency
    const emergency = await EmergencyRequest.findById(id);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    // Check if this emergency is assigned to driver's ambulance
    if (String(emergency.assignedAmbulanceId) !== String(ambulance._id)) {
      return res.status(403).json({
        success: false,
        message: 'This emergency is not assigned to you'
      });
    }

    // Update emergency status
    emergency.status = status;

    // If completed, update ambulance status and completion time
    if (status === 'COMPLETED') {
      emergency.completedAt = new Date();
      ambulance.status = 'AVAILABLE';
      await ambulance.save();
    }

    await emergency.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('emergencyUpdated', {
        emergency,
        message: `Emergency status updated to ${status}`
      });

      if (status === 'COMPLETED') {
        io.emit('emergencyCompleted', {
          emergencyId: emergency._id,
          ambulanceId: ambulance._id
        });
      }
    }

    res.json({
      success: true,
      data: emergency,
      message: `Emergency status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating emergency status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * GET /api/driver/stats
 * Get driver statistics
 */
router.get('/stats', verifyJWT, async (req, res) => {
  try {
    const { username } = req.user;

    // Find driver's ambulance
    const ambulance = await Ambulance.findOne({
      'driver.name': username
    });

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'No ambulance assigned'
      });
    }

    // Get completed emergencies for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEmergencies = await EmergencyRequest.countDocuments({
      assignedAmbulanceId: ambulance._id,
      status: 'COMPLETED',
      completedAt: { $gte: today }
    });

    // Get all completed emergencies
    const totalEmergencies = await EmergencyRequest.countDocuments({
      assignedAmbulanceId: ambulance._id,
      status: 'COMPLETED'
    });

    // Calculate average response time
    const completedEmergencies = await EmergencyRequest.find({
      assignedAmbulanceId: ambulance._id,
      status: 'COMPLETED',
      completedAt: { $exists: true }
    }).limit(10);

    let avgResponseTime = 0;
    if (completedEmergencies.length > 0) {
      const totalTime = completedEmergencies.reduce((sum, emg) => {
        const responseTime = (new Date(emg.completedAt) - new Date(emg.createdAt)) / 1000 / 60; // in minutes
        return sum + responseTime;
      }, 0);
      avgResponseTime = Math.round(totalTime / completedEmergencies.length);
    }

    res.json({
      success: true,
      data: {
        todayTrips: todayEmergencies,
        totalTrips: totalEmergencies,
        avgResponseTime: avgResponseTime,
        status: ambulance.status
      }
    });
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * PUT /api/driver/location
 * Update driver's current location
 */
router.put('/location', verifyJWT, async (req, res) => {
  try {
    const { username } = req.user;
    const { location } = req.body;

    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    const ambulance = await Ambulance.findOneAndUpdate(
      { 'driver.name': username },
      { currentLocation: location },
      { new: true }
    );

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'No ambulance assigned'
      });
    }

    // Emit location update
    const io = req.app.get('io');
    if (io) {
      io.emit('ambulanceLocationUpdated', {
        ambulanceId: ambulance._id,
        location: location
      });
    }

    res.json({
      success: true,
      data: ambulance,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router