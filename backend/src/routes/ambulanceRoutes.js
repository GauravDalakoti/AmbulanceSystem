import dispatchService from "../services/dispatchService.js";
import { Ambulance } from "../models/Ambulance.js"
import { Router } from 'express';
import { EmergencyRequest } from "../models/EmergencyRequest.js";

const router = Router()

// Get all ambulances
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const ambulances = await Ambulance.find(query).populate('hospitalId');
    res.json(ambulances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ambulance by ID
router.get('/:id', async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id).populate('hospitalId');

    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    res.json(ambulance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new ambulance
router.post('/', async (req, res) => {
  try {
    const ambulance = new Ambulance(req.body);
    await ambulance.save();

    // Emit socket event
    if (req.io) {
      req.io.emit('ambulanceAdded', ambulance);
    }

    res.status(201).json(ambulance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ambulance location
router.patch('/:id/location', async (req, res) => {
  try {
    const { currentLocation } = req.body;
    const ambulance = await dispatchService.updateAmbulanceLocation(
      req.params.id,
      currentLocation
    );

    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    // Emit socket event for real-time tracking
    if (req.io) {
      req.io.emit('ambulanceLocationUpdate', {
        ambulanceId: ambulance._id,
        location: currentLocation
      });
    }

    res.json(ambulance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ambulance status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const ambulance = await Ambulance.findById(req.params.id);

    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    ambulance.status = status;
    await ambulance.save();

    // Emit socket event
    if (req.io) {
      req.io.emit('ambulanceStatusUpdate', ambulance);
    }

    res.json(ambulance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ambulance details
router.put('/:id', async (req, res) => {
  try {
    const ambulance = await Ambulance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('hospitalId');

    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    res.json(ambulance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete ambulance
router.delete('/:id', async (req, res) => {
  try {
    const ambulance = await Ambulance.findByIdAndDelete(req.params.id);

    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    res.json({ message: 'Ambulance deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available ambulances
router.get('/available/list', async (req, res) => {
  try {
    const ambulances = await Ambulance.find({ status: 'AVAILABLE' })
      .populate('hospitalId');
    res.json(ambulances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Get Driver Emergency
router.get('/driver-emergencies/:username', async (req, res) => {

  try {

    const { username } = req.params;


    console.log("hgfhfhf", username);

    const driverDetails = await Ambulance.findOne({ "driver.name": username })

    if (!driverDetails) {

      return res.status(404).json({ error: 'Ambulance not found' });
    }
    console.log("fgfh fghhf fhgf", driverDetails._id);

    const emergency = await EmergencyRequest.find({ assignedAmbulanceId: driverDetails._id })
    console.log("kjhjhj",emergency);

    res.json(emergency)

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

})

export default router;