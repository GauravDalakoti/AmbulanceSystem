import dispatchService from "../services/dispatchService.js";
import { EmergencyRequest } from "../models/EmergencyRequest.js"
import { Router } from 'express';
import { Ambulance } from "../models/Ambulance.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import mongoose from "mongoose";

const router = Router()

// Create new emergency request
router.post('/', verifyJWT, async (req, res) => {
  try {
    const result = await dispatchService.processEmergency(req.body, req.user._id);

    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit('newEmergency', result);
      if (result.success) {
        req.io.emit('ambulanceAssigned', {
          emergencyId: result.emergency._id,
          ambulanceId: result.ambulance._id,
          route: result.route
        });
      }
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all emergencies
router.get('/', verifyJWT, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    const query = status ? { status } : {};
    const emergencies = await EmergencyRequest.find(query)
      .populate('assignedAmbulanceId')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get emergency by ID
router.get('/:id', verifyJWT, async (req, res) => {
  try {

    let userId = new mongoose.Types.ObjectId(req.params.id);
    console.log(userId);

    const emergency = await EmergencyRequest.find({ userId: userId })
      .populate('assignedAmbulanceId');

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found' });
    }

    res.json(emergency);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Get Driver Emergency
router.post('/driver-emergencies/username', async (req, res) => {

  try {

    const { username } = req.body;

    console.log(username);

    const ambulanceDetails = Ambulance.findOne({ "driver.name": username })
    console.log(ambulanceDetails);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

})

// Update emergency status
// router.patch('/:id/status', async (req, res) => {

//   console.log(req.body);

//   try {
//     const { status } = req.body;
//     const emergency = await EmergencyRequest.findById(req.params.id);

//     if (!emergency) {
//       return res.status(404).json({ error: 'Emergency not found' });
//     }
//     const ambulance = await Ambulance.findById(emergency.assignedAmbulanceId)

//     emergency.status = status;
//     if (status === 'COMPLETED') {

//       ambulance.status = 'AVAILABLE'
//     }

//     if (status === 'REACHED') {
//       emergency.actualArrival = new Date();
//     }

//     await emergency.save();
//     await ambulance.save();

//     // Emit socket event
//     if (req.io) {
//       req.io.emit('emergencyStatusUpdate', emergency);
//     }

//     if (req.io && ambulance) {
//       req.io.emit('ambulanceStatusUpdate', ambulance);
//     }

//     res.json(emergency);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

router.patch('/:id/status', async (req, res) => {

  try {

    const { status } = req.body;

    const emergency = await EmergencyRequest.findById(req.params.id);

    const ambulance = await Ambulance.findById(emergency.assignedAmbulanceId);

    emergency.status = status;

    if (status === 'COMPLETED') {

      ambulance.status = 'AVAILABLE';

      await ambulance.save();

      // 🔥 RUN DISPATCH AGAIN
      const assignment = await dispatchService.assignPendingEmergency();

      if (assignment && req.io) {
        req.io.emit("emergencyAssigned", assignment.emergency);
      }

    }

    await emergency.save();

    if (req.io) {
      req.io.emit('emergencyStatusUpdate', emergency);
      req.io.emit('ambulanceStatusUpdate', ambulance);
    }

    res.json(emergency);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete emergency
router.post('/:id/complete', async (req, res) => {
  try {
    const result = await dispatchService.completeEmergency(req.params.id);

    if (!result) {
      return res.status(404).json({ error: 'Emergency not found' });
    }

    // Emit socket event
    if (req.io) {
      req.io.emit('emergencyCompleted', result);
      req.io.emit('ambulanceStatusUpdate', result.ambulance);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active emergencies
router.get('/active/list', async (req, res) => {
  try {
    const emergencies = await EmergencyRequest.find({
      status: { $in: ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'REACHED'] }
    })
      .populate('assignedAmbulanceId')
      .sort({ severity: -1, timestamp: 1 });

    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
