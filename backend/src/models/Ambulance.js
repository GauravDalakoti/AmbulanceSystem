import mongoose from "mongoose";

const ambulanceSchema = new mongoose.Schema({
  ambulanceNumber: {
    type: String,
    required: true,
    unique: true
  },
  currentLocation: {
    type: String,
    required: true
    // Node ID in the city graph
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'BUSY', 'MAINTENANCE'],
    default: 'AVAILABLE'
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  driver: {
    name: String,
    phone: String
  },
  equipment: {
    type: [String],
    default: ['Basic First Aid', 'Oxygen', 'Stretcher', 'Defibrillator']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Update lastUpdated on save
ambulanceSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

export const Ambulance = mongoose.model('Ambulance', ambulanceSchema);
