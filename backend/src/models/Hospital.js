import mongoose from "mongoose";
const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
    // Node ID in the city graph
  },
  address: {
    type: String,
    required: true
  },
  capacity: {
    total: {
      type: Number,
      required: true,
      default: 100
    },
    available: {
      type: Number,
      required: true,
      default: 100
    },
    icu: {
      type: Number,
      default: 20
    },
    emergency: {
      type: Number,
      default: 30
    }
  },
  specializations: {
    type: [String],
    default: ['General', 'Emergency', 'Trauma']
  },
  contact: {
    phone: String,
    email: String,
    emergencyHotline: String
  },
  operatingHours: {
    type: String,
    default: '24/7'
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Hospital = mongoose.model('Hospital', hospitalSchema);
