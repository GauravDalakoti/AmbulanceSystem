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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // default: null
  },
  status: {
    type: String,
    enum: ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'REACHED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  responseTime: {
    type: Number
    
  },
  estimatedArrival: {
    type: Number
    
  },
  actualArrival: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  route: {
    type: [String]
    
  },
  distance: {
    type: Number
  
  },
  coordinates: {
    lat: Number,
    lng: Number
  }
});


emergencyRequestSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'ASSIGNED' && !this.responseTime) {
    this.responseTime = Math.floor((Date.now() - this.timestamp) / 1000);
  }
  next();
});

export const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);