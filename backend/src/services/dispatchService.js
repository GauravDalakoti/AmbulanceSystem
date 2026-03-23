import PriorityQueue from '../algorithms/PriorityQueue.js';
import Dijkstra from '../algorithms/Dijkstra.js';
import Graph from '../algorithms/Graph.js';
import HashMap from '../algorithms/HashMap.js';

import { Ambulance } from '../models/Ambulance.js';
import { CityGraph } from '../models/CityGraph.js';
import { EmergencyRequest } from '../models/EmergencyRequest.js';

class DispatchService {
  constructor() {
    this.graph = new Graph();
    this.emergencyQueue = new PriorityQueue();
    this.ambulanceCache = new HashMap();
    this.isInitialized = false;
  }

  /**
   * Initialize the dispatch service with city graph data
   */
  async initialize() {
    try {
      // FIXED: Changed from 'MainCity' to 'Haldwani'
      const cityGraphData = await CityGraph.findOne({ cityName: 'Haldwani' });

      if (!cityGraphData) {
        console.log('⚠️ No Haldwani city graph found, creating default...');
        await this.createDefaultCityGraph();
        return this.initialize();
      }

      // Load graph into memory
      const graphData = {};
      cityGraphData.edges.forEach((edges, node) => {
        graphData[node] = edges;
      });

      this.graph.loadGraph(graphData);
      this.isInitialized = true;

      console.log('✅ Dispatch service initialized successfully');
      console.log(`📊 Graph loaded with ${this.graph.getAllNodes().length} nodes`);
    } catch (error) {
      console.error('❌ Error initializing dispatch service:', error);
      throw error;
    }
  }

  /**
   * Create default Haldwani city graph
   */
  async createDefaultCityGraph() {
    const nodes = new Map([
      ["A", { name: "Kathgodam", type: "junction", coordinates: { lat: 29.2692, lng: 79.5318 } }],
      ["B", { name: "Sushila Tiwari Hospital Area", type: "hospital", coordinates: { lat: 29.2183, lng: 79.5130 } }],
      ["C", { name: "Mukhani", type: "residential", coordinates: { lat: 29.2305, lng: 79.4976 } }],
      ["D", { name: "Ranibagh", type: "residential", coordinates: { lat: 29.2825, lng: 79.5480 } }],
      ["E", { name: "Bhotia Padao", type: "junction", coordinates: { lat: 29.2209, lng: 79.5055 } }],
      ["F", { name: "Heera Nagar", type: "residential", coordinates: { lat: 29.2158, lng: 79.5191 } }],
      ["G", { name: "Gas Godown Road", type: "residential", coordinates: { lat: 29.2226, lng: 79.5283 } }],
      ["H", { name: "Krishna Hospital Area", type: "hospital", coordinates: { lat: 29.2198, lng: 79.5202 } }],
      ["I", { name: "Bus Stand Haldwani", type: "junction", coordinates: { lat: 29.2220, lng: 79.5147 } }],
      ["J", { name: "Industrial Area", type: "junction", coordinates: { lat: 29.2070, lng: 79.4938 } }]
    ]);

    const edges = new Map([
      ["A", [{ node: "B", weight: 5.1 }, { node: "D", weight: 6.4 }]],
      ["B", [{ node: "A", weight: 5.1 }, { node: "C", weight: 2.8 }, { node: "E", weight: 1.9 }, { node: "H", weight: 3.0 }]],
      ["C", [{ node: "B", weight: 2.8 }, { node: "F", weight: 2.1 }, { node: "I", weight: 3.6 }]],
      ["D", [{ node: "A", weight: 6.4 }]],
      ["E", [{ node: "B", weight: 1.9 }, { node: "F", weight: 1.6 }, { node: "G", weight: 2.3 }]],
      ["F", [{ node: "C", weight: 2.1 }, { node: "E", weight: 1.6 }, { node: "I", weight: 2.9 }]],
      ["G", [{ node: "E", weight: 2.3 }, { node: "H", weight: 1.8 }]],
      ["H", [{ node: "B", weight: 3.0 }, { node: "G", weight: 1.8 }]],
      ["I", [{ node: "C", weight: 3.6 }, { node: "F", weight: 2.9 }]],
      ["J", [{ node: "A", weight: 4.7 }]]
    ]);

    await CityGraph.create({
      cityName: 'Haldwani',
      nodes,
      edges
    });

    console.log('🗺️ Default Haldwani city graph created');
  }

  /**
   * Process emergency request and assign nearest available ambulance
   */
  async processEmergency(emergencyData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Create emergency request
      const emergency = new EmergencyRequest(emergencyData);
      await emergency.save();

      console.log(`🆘 New emergency created: ${emergency._id} at ${emergency.patientLocation}`);

      // Add to priority queue
      this.emergencyQueue.enqueue(emergency);

      // Find and assign ambulance
      const assignment = await this.assignAmbulance(emergency);

      if (assignment) {
        console.log(`✅ Ambulance ${assignment.ambulance.ambulanceNumber} assigned`);
        console.log(`📍 Route: ${assignment.route.join(' → ')}`);
        console.log(`📏 Distance: ${assignment.distance.toFixed(1)} km`);

        return {
          success: true,
          emergency,
          ambulance: assignment.ambulance,
          route: assignment.route,
          distance: assignment.distance,
          estimatedTime: assignment.estimatedTime
        };
      } else {
        console.log('⚠️ No available ambulances');
        return {
          success: false,
          emergency,
          message: 'No available ambulances at the moment'
        };
      }
    } catch (error) {
      console.error('❌ Error processing emergency:', error);
      throw error;
    }
  }

  /**
   * Find and assign the nearest available ambulance
   */
  async assignAmbulance(emergency) {
    // Get all available ambulances with hospital data
    const availableAmbulances = await Ambulance.find({ status: 'AVAILABLE' }).populate('hospitalId');

    if (availableAmbulances.length === 0) {
      console.log('⚠️ No available ambulances found');
      return null;
    }

    console.log(`🔍 Found ${availableAmbulances.length} available ambulances`);

    let bestAmbulance = null;
    let shortestDistance = Infinity;
    let bestRoute = null;

    const dijkstra = new Dijkstra(this.graph);

    // Calculate shortest path from each ambulance to emergency location
    for (let ambulance of availableAmbulances) {
      console.log(`  Checking ${ambulance.ambulanceNumber} at ${ambulance.currentLocation}`);

      const result = dijkstra.findShortestPath(
        ambulance.currentLocation,
        emergency.patientLocation
      );

      console.log(`    Distance: ${result.distance?.toFixed(1) || 'N/A'} km`);
      console.log(`    Route: ${result.path ? result.path.join(' → ') : 'No path'}`);

      if (result.distance !== null && result.distance < shortestDistance) {
        shortestDistance = result.distance;
        bestRoute = result.path;
        bestAmbulance = ambulance;
      }
    }

    if (bestAmbulance) {
      // Update ambulance status
      bestAmbulance.status = 'BUSY';
      await bestAmbulance.save();

      // Update emergency request with ALL details
      emergency.assignedAmbulanceId = bestAmbulance._id;
      emergency.status = 'ASSIGNED';
      emergency.route = bestRoute;  // This is ambulance→patient path
      emergency.distance = shortestDistance;
      emergency.estimatedArrival = Math.ceil(shortestDistance * 3); // 3 min per km
      await emergency.save();

      console.log(`✅ Assigned ${bestAmbulance.ambulanceNumber}`);
      console.log(`   From: ${bestAmbulance.currentLocation}`);
      console.log(`   To: ${emergency.patientLocation}`);
      console.log(`   Route: ${bestRoute.join(' → ')}`);

      return {
        ambulance: bestAmbulance,
        route: bestRoute,
        distance: shortestDistance,
        estimatedTime: emergency.estimatedArrival
      };
    }

    return null;
  }

  /**
   * Update ambulance location (for real-time tracking)
   */
  async updateAmbulanceLocation(ambulanceId, newLocation) {
    const ambulance = await Ambulance.findById(ambulanceId);
    if (ambulance) {
      const oldLocation = ambulance.currentLocation;
      ambulance.currentLocation = newLocation;
      await ambulance.save();

      console.log(`🚑 Ambulance ${ambulance.ambulanceNumber} moved: ${oldLocation} → ${newLocation}`);

      return ambulance;
    }
    return null;
  }

    /**
   * assigned pending emergency (for real-time tracking)
   */
  async assignPendingEmergency() {

    const pendingEmergency = await EmergencyRequest.findOne({
      status: "PENDING"
    }).sort({ createdAt: 1 });

    if (!pendingEmergency) {
      console.log("No pending emergencies");
      return null;
    }

    console.log("🔄 Trying to assign ambulance to pending emergency");

    const assignment = await this.assignAmbulance(pendingEmergency);

    if (assignment) {
      console.log("✅ Pending emergency assigned");

      return {
        emergency: pendingEmergency,
        ambulance: assignment.ambulance
      };
    }

    return null;
  }

  /**
   * Complete emergency and free ambulance
   */
  async completeEmergency(emergencyId) {
    const emergency = await EmergencyRequest.findById(emergencyId);

    if (emergency && emergency.assignedAmbulanceId) {
      // Update emergency
      emergency.status = 'COMPLETED';
      emergency.completedAt = new Date();
      await emergency.save();

      // Free ambulance
      const ambulance = await Ambulance.findById(emergency.assignedAmbulanceId);
      if (ambulance) {
        ambulance.status = 'AVAILABLE';
        await ambulance.save();

        console.log(`✅ Emergency ${emergencyId} completed`);
        console.log(`🚑 Ambulance ${ambulance.ambulanceNumber} now available`);
      }

      return { emergency, ambulance };
    }

    return null;
  }

  /**
   * Get all pending emergencies
   */
  getPendingEmergencies() {
    return this.emergencyQueue.toArray();
  }

  /**
   * Get system statistics
   */
  async getStatistics() {
    const totalAmbulances = await Ambulance.countDocuments();
    const availableAmbulances = await Ambulance.countDocuments({ status: 'AVAILABLE' });
    const busyAmbulances = await Ambulance.countDocuments({ status: 'BUSY' });
    const pendingEmergencies = await EmergencyRequest.countDocuments({ status: 'PENDING' });
    const activeEmergencies = await EmergencyRequest.countDocuments({
      status: { $in: ['ASSIGNED', 'IN_TRANSIT', 'REACHED'] }
    });
    const completedToday = await EmergencyRequest.countDocuments({
      status: 'COMPLETED',
      completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    return {
      totalAmbulances,
      availableAmbulances,
      busyAmbulances,
      pendingEmergencies,
      activeEmergencies,
      completedToday
    };
  }
}

// Singleton instance
const dispatchService = new DispatchService();

export default dispatchService;