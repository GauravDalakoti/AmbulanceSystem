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
      const cityGraphData = await CityGraph.findOne({ cityName: 'Haldwani' });

      if (!cityGraphData) {
        console.log(' No Haldwani city graph found, creating default...');
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

      console.log(' Dispatch service initialized successfully');
      console.log(` Graph loaded with ${this.graph.getAllNodes().length} nodes`);
    } catch (error) {
      console.error(' Error initializing dispatch service:', error);
      throw error;
    }
  }

  /**
   * Create default Haldwani city graph
   */
  async createDefaultCityGraph() {
    

    const nodes = new Map([
    ["A", { name: "Kathgodam", type: "junction", coordinates: { lat: 29.2692, lng: 79.5318 } }],
    ["B", { name: "Sushila Tiwari Hospital", type: "hospital", coordinates: { lat: 29.2183, lng: 79.5130 } }],
    ["C", { name: "Mukhani", type: "residential", coordinates: { lat: 29.2305, lng: 79.4976 } }],
    ["D", { name: "Ranibagh", type: "residential", coordinates: { lat: 29.2825, lng: 79.5480 } }],
    ["E", { name: "Bhotia Padao", type: "junction", coordinates: { lat: 29.2209, lng: 79.5055 } }],
    ["F", { name: "Heera Nagar", type: "residential", coordinates: { lat: 29.2158, lng: 79.5191 } }],
    ["G", { name: "Gas Godown Road", type: "residential", coordinates: { lat: 29.2226, lng: 79.5283 } }],
    ["H", { name: "Krishna Hospital", type: "hospital", coordinates: { lat: 29.2198, lng: 79.5202 } }],
    ["I", { name: "Bus Stand Haldwani", type: "junction", coordinates: { lat: 29.2220, lng: 79.5147 } }],
    ["J", { name: "Industrial Area", type: "industrial", coordinates: { lat: 29.2070, lng: 79.4938 } }],
    ["K", { name: "Nainital Road", type: "highway", coordinates: { lat: 29.2330, lng: 79.5100 } }],
    ["L", { name: "Tikonia Chauraha", type: "junction", coordinates: { lat: 29.2188, lng: 79.5075 } }],
    ["M", { name: "Pilikothi", type: "residential", coordinates: { lat: 29.2270, lng: 79.5165 } }],
    ["N", { name: "Damuadhunga", type: "residential", coordinates: { lat: 29.2402, lng: 79.4895 } }],
    ["O", { name: "Gaulapar", type: "residential", coordinates: { lat: 29.2015, lng: 79.5485 } }],
    ["P", { name: "Transport Nagar", type: "industrial", coordinates: { lat: 29.2140, lng: 79.4820 } }],
    ["Q", { name: "Teenpani", type: "junction", coordinates: { lat: 29.1958, lng: 79.5008 } }],
    ["R", { name: "MBPG College", type: "landmark", coordinates: { lat: 29.2189, lng: 79.5162 } }],
    ["S", { name: "Railway Bazaar", type: "market", coordinates: { lat: 29.2665, lng: 79.5242 } }],
    ["T", { name: "Panchakki", type: "residential", coordinates: { lat: 29.2252, lng: 79.4950 } }],
    ["U", { name: "Nawabi Road", type: "residential", coordinates: { lat: 29.2290, lng: 79.5205 } }],
    ["V", { name: "Kusumkhera", type: "residential", coordinates: { lat: 29.2388, lng: 79.5011 } }],
    ["W", { name: "Unchapul", type: "junction", coordinates: { lat: 29.2149, lng: 79.5098 } }],
    ["X", { name: "Laldanth", type: "outskirts", coordinates: { lat: 29.1880, lng: 79.4705 } }],
    ["Y", { name: "AIIMS Satellite Center", type: "hospital", coordinates: { lat: 29.2355, lng: 79.5148 } }],
    ["Z", { name: "Bareilly Road", type: "highway", coordinates: { lat: 29.2030, lng: 79.4995 } }]
  ]);

    

    const edges = new Map([
    ["A", [{ node: "B", weight: 5.1 }, { node: "D", weight: 6.4 }, { node: "S", weight: 2.1 }]],

    ["B", [
      { node: "A", weight: 5.1 },
      { node: "C", weight: 2.8 },
      { node: "E", weight: 1.9 },
      { node: "H", weight: 3.0 },
      { node: "L", weight: 1.0 },
      { node: "R", weight: 1.5 }
    ]],

    ["C", [
      { node: "B", weight: 2.8 },
      { node: "F", weight: 2.1 },
      { node: "I", weight: 3.6 },
      { node: "T", weight: 1.4 },
      { node: "V", weight: 2.0 }
    ]],

    ["D", [
      { node: "A", weight: 6.4 },
      { node: "S", weight: 3.2 }
    ]],

    ["E", [
      { node: "B", weight: 1.9 },
      { node: "F", weight: 1.6 },
      { node: "G", weight: 2.3 },
      { node: "L", weight: 1.2 }
    ]],

    ["F", [
      { node: "C", weight: 2.1 },
      { node: "E", weight: 1.6 },
      { node: "I", weight: 2.9 },
      { node: "W", weight: 1.7 }
    ]],

    ["G", [
      { node: "E", weight: 2.3 },
      { node: "H", weight: 1.8 },
      { node: "U", weight: 2.0 }
    ]],

    ["H", [
      { node: "B", weight: 3.0 },
      { node: "G", weight: 1.8 },
      { node: "R", weight: 1.3 }
    ]],

    ["I", [
      { node: "C", weight: 3.6 },
      { node: "F", weight: 2.9 },
      { node: "R", weight: 1.0 },
      { node: "K", weight: 2.2 }
    ]],

    ["J", [
      { node: "P", weight: 2.5 },
      { node: "Q", weight: 3.0 },
      { node: "Z", weight: 2.0 }
    ]],

    ["K", [
      { node: "I", weight: 2.2 },
      { node: "M", weight: 1.4 },
      { node: "Y", weight: 2.0 }
    ]],

    ["L", [
      { node: "B", weight: 1.0 },
      { node: "E", weight: 1.2 },
      { node: "W", weight: 1.5 }
    ]],

    ["M", [
      { node: "K", weight: 1.4 },
      { node: "U", weight: 1.8 }
    ]],

    ["N", [
      { node: "V", weight: 2.3 },
      { node: "T", weight: 3.0 }
    ]],

    ["O", [
      { node: "Q", weight: 5.0 },
      { node: "W", weight: 4.5 }
    ]],

    ["P", [
      { node: "J", weight: 2.5 },
      { node: "X", weight: 4.8 }
    ]],

    ["Q", [
      { node: "J", weight: 3.0 },
      { node: "O", weight: 5.0 },
      { node: "Z", weight: 1.7 }
    ]],

    ["R", [
      { node: "B", weight: 1.5 },
      { node: "H", weight: 1.3 },
      { node: "I", weight: 1.0 }
    ]],

    ["S", [
      { node: "A", weight: 2.1 },
      { node: "D", weight: 3.2 }
    ]],

    ["T", [
      { node: "C", weight: 1.4 },
      { node: "N", weight: 3.0 }
    ]],

    ["U", [
      { node: "G", weight: 2.0 },
      { node: "M", weight: 1.8 }
    ]],

    ["V", [
      { node: "C", weight: 2.0 },
      { node: "N", weight: 2.3 }
    ]],

    ["W", [
      { node: "F", weight: 1.7 },
      { node: "L", weight: 1.5 },
      { node: "O", weight: 4.5 }
    ]],

    ["X", [
      { node: "P", weight: 4.8 }
    ]],

    ["Y", [
      { node: "K", weight: 2.0 },
      { node: "M", weight: 2.2 }
    ]],

    ["Z", [
      { node: "J", weight: 2.0 },
      { node: "Q", weight: 1.7 }
    ]]
  ]);

    await CityGraph.create({
      cityName: 'Haldwani',
      nodes,
      edges
    });

    console.log(' Default Haldwani city graph created');
  }

  /**
   * Process emergency request and assign nearest available ambulance
   */
  async processEmergency(emergencyData, userId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Create emergency request

      const emergency = new EmergencyRequest(emergencyData);
      emergency.userId = userId
      await emergency.save();

      console.log(` New emergency created: ${emergency._id} at ${emergency.patientLocation}`);

      // Add to priority queue
      this.emergencyQueue.enqueue(emergency);

      const assignment = await this.assignAmbulance(emergency);

      if (assignment) {
        console.log(` Ambulance ${assignment.ambulance.ambulanceNumber} assigned`);
        console.log(` Route: ${assignment.route.join(' → ')}`);
        console.log(` Distance: ${assignment.distance.toFixed(1)} km`);

        return {
          success: true,
          emergency,
          ambulance: assignment.ambulance,
          route: assignment.route,
          distance: assignment.distance,
          estimatedTime: assignment.estimatedTime
        };
      } else {
        console.log(' No available ambulances');
        return {
          success: false,
          emergency,
          message: 'No available ambulances at the moment'
        };
      }
    } catch (error) {
      console.error(' Error processing emergency:', error);
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
      console.log(' No available ambulances found');
      return null;
    }

    console.log(` Found ${availableAmbulances.length} available ambulances`);

    let bestAmbulance = null;
    let shortestDistance = Infinity;
    let bestRoute = null;

    const dijkstra = new Dijkstra(this.graph);
    console.log("LOCATION AMBULANCE", emergency.patientLocation);

    // Calculate shortest path from each ambulance to emergency location
    for (let ambulance of availableAmbulances) {
      console.log(`  Checking ${ambulance.ambulanceNumber} at ${ambulance.currentLocation}`);

      const result = dijkstra.findShortestPath(
        ambulance.currentLocation,
        emergency.patientLocation
      );
      console.log("RESULT:", result);
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

      console.log(` Assigned ${bestAmbulance.ambulanceNumber}`);
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

      console.log(` Ambulance ${ambulance.ambulanceNumber} moved: ${oldLocation} → ${newLocation}`);

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
    console.log("pending emergency:", pendingEmergency);
    console.log(" Trying to assign ambulance to pending emergency");

    const assignment = await this.assignAmbulance(pendingEmergency);
    console.log(" emergency:", assignment);


    if (assignment) {
      console.log(" Pending emergency assigned");

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

        console.log(` Emergency ${emergencyId} completed`);
        console.log(` Ambulance ${ambulance.ambulanceNumber} now available`);
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