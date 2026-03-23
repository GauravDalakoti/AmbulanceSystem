import mongoose from "mongoose";
const emergencyRequestSchema = new mongoose.Schema({
  patientLocation: {
    type: String,
    required: true
    // Node ID in the city graph
  },
  patientInfo: {
    name: String,
    age: Number,
    gender: String,
    phone: String
  },
  severity: {
    type: Number,
    required: true,
    min: 1,
    max: 5
    // 1 = Minor, 5 = Critical
  },
  description: {
    type: String,
    required: true
  },
  symptoms: {
    type: [String],
    default: []
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  assignedAmbulanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ambulance',
    default: null
  },
  status: {
    type: String,
    enum: ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'REACHED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  responseTime: {
    type: Number
    // Time in seconds to assign ambulance
  },
  estimatedArrival: {
    type: Number
    // Estimated time in minutes
  },
  actualArrival: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  route: {
    type: [String]
    // Array of node IDs representing the path
  },
  distance: {
    type: Number
    // Total distance in km
  },
  coordinates: {
    lat: Number,
    lng: Number
  }
});

// Calculate response time before saving
emergencyRequestSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'ASSIGNED' && !this.responseTime) {
    this.responseTime = Math.floor((Date.now() - this.timestamp) / 1000);
  }
  next();
});

export const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);