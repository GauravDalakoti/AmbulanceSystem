import mongoose from "mongoose";

const cityGraphSchema = new mongoose.Schema({
  cityName: {
    type: String,
    required: true,
    unique: true
  },
  nodes: {
    type: Map,
    of: new mongoose.Schema({
      name: String,
      type: String, // 'junction', 'hospital', 'residential'
      coordinates: {
        lat: Number,
        lng: Number
      }
    }, { _id: false }),
    required: true
  },
  edges: {
    type: Map,
    of: [new mongoose.Schema({
      node: String,
      weight: Number // Distance in km or time in minutes
    }, { _id: false })],
    required: true
  },
  metadata: {
    totalNodes: Number,
    totalEdges: Number,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
});

// Update metadata before saving
cityGraphSchema.pre('save', function(next) {
  this.metadata.totalNodes = this.nodes.size;
  let edgeCount = 0;
  this.edges.forEach(edges => {
    edgeCount += edges.length;
  });
  this.metadata.totalEdges = edgeCount / 2; // Divide by 2 for undirected graph
  this.metadata.lastUpdated = Date.now();
  next();
});

export const CityGraph = mongoose.model('CityGraph', cityGraphSchema);
