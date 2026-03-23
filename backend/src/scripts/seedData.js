import { Hospital } from '../models/Hospital.js';
import { Ambulance } from '../models/Ambulance.js';
import { CityGraph } from '../models/CityGraph.js';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb url';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Hospital.deleteMany({});
    await Ambulance.deleteMany({});
    await CityGraph.deleteMany({});

    console.log('🧹 Cleared existing data');

    // ========== HALDWANI HOSPITALS ==========
    const hospitals = await Hospital.create([
      {
        name: 'Dr. Sushila Tiwari Government Hospital',
        location: 'B',
        address: 'Rampur Road, Haldwani, Uttarakhand',
        capacity: {
          total: 500,
          available: 380,
          icu: 80,
          emergency: 120
        },
        specializations: ['Emergency', 'Trauma', 'Cardiology', 'General'],
        contact: {
          phone: '+91-5946-234567',
          email: 'info@stghaldwani.in',
          emergencyHotline: '108'
        },
        coordinates: { lat: 29.2183, lng: 79.5130 }
      },
      {
        name: 'Krishna Hospital Haldwani',
        location: 'H',
        address: 'Kaladhungi Road, Haldwani, Uttarakhand',
        capacity: {
          total: 200,
          available: 140,
          icu: 40,
          emergency: 50
        },
        specializations: ['Emergency', 'Orthopedics', 'Neurology'],
        contact: {
          phone: '+91-5946-222333',
          email: 'contact@krishnahospital.com',
          emergencyHotline: '108'
        },
        coordinates: { lat: 29.2198, lng: 79.5202 }
      }
    ]);

    console.log(`🏥 Created ${hospitals.length} hospitals`);

    // ========== HALDWANI AMBULANCES ==========
    const ambulances = await Ambulance.create([
      {
        ambulanceNumber: 'UK04-AMB-001',
        currentLocation: 'B',
        status: 'AVAILABLE',
        hospitalId: hospitals[0]._id,
        driver: {
          name: 'Ramesh Kumar',
          phone: '+91-9876543210'
        },
        equipment: ['Oxygen', 'Stretcher', 'Defibrillator', 'ECG Monitor']
      },
      {
        ambulanceNumber: 'UK04-AMB-002',
        currentLocation: 'H',
        status: 'AVAILABLE',
        hospitalId: hospitals[1]._id,
        driver: {
          name: 'Amit Singh',
          phone: '+91-9876543222'
        },
        equipment: ['Oxygen', 'Stretcher', 'Defibrillator']
      },
      {
        ambulanceNumber: 'UK04-AMB-003',
        currentLocation: 'A',
        status: 'AVAILABLE',
        hospitalId: hospitals[0]._id,
        driver: {
          name: 'Deepak Rawat',
          phone: '+91-9876543233'
        },
        equipment: ['Oxygen', 'Stretcher', 'Ventilator']
      }
    ]);

    console.log(`🚑 Created ${ambulances.length} ambulances`);

    // ========== HALDWANI CITY GRAPH ==========
    // EXACTLY matching dispatchService.js default graph
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
      edges,
      metadata: {
        description: 'Haldwani City Road Network',
        lastUpdated: new Date(),
        totalNodes: nodes.size,
        totalEdges: Array.from(edges.values()).reduce((sum, arr) => sum + arr.length, 0)
      }
    });

    console.log('🗺️ Created Haldwani city graph');
    console.log(`   - Nodes: ${nodes.size}`);
    console.log(`   - Edges: ${Array.from(edges.values()).reduce((sum, arr) => sum + arr.length, 0)}`);

    // ========== SUMMARY ==========
    console.log('\n✅ Database seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   - City: Haldwani`);
    console.log(`   - Hospitals: ${hospitals.length} (B, H)`);
    console.log(`   - Ambulances: ${ambulances.length} (A, B, H)`);
    console.log(`   - Graph Nodes: ${nodes.size}`);
    console.log(`   - Road Connections: ${Array.from(edges.values()).reduce((sum, arr) => sum + arr.length, 0)}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedData();
