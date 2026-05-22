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

    console.log(' Connected to MongoDB');

    // Clear existing data
    await Hospital.deleteMany({});
    await Ambulance.deleteMany({});
    await CityGraph.deleteMany({});

    console.log(' Cleared existing data');

    // ========== HALDWANI HOSPITALS ==========
    // const hospitals = await Hospital.create([
    //   {
    //     name: 'Dr. Sushila Tiwari Government Hospital',
    //     location: 'B',
    //     address: 'Rampur Road, Haldwani, Uttarakhand',
    //     capacity: {
    //       total: 500,
    //       available: 380,
    //       icu: 80,
    //       emergency: 120
    //     },
    //     specializations: ['Emergency', 'Trauma', 'Cardiology', 'General'],
    //     contact: {
    //       phone: '+91-5946-234567',
    //       email: 'info@stghaldwani.in',
    //       emergencyHotline: '108'
    //     },
    //     coordinates: { lat: 29.2183, lng: 79.5130 }
    //   },
    //   {
    //     name: 'Krishna Hospital Haldwani',
    //     location: 'H',
    //     address: 'Kaladhungi Road, Haldwani, Uttarakhand',
    //     capacity: {
    //       total: 200,
    //       available: 140,
    //       icu: 40,
    //       emergency: 50
    //     },
    //     specializations: ['Emergency', 'Orthopedics', 'Neurology'],
    //     contact: {
    //       phone: '+91-5946-222333',
    //       email: 'contact@krishnahospital.com',
    //       emergencyHotline: '108'
    //     },
    //     coordinates: { lat: 29.2198, lng: 79.5202 }
    //   }
    // ]);

    // ========== EXPANDED HALDWANI HOSPITALS ==========

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
    specializations: [
      'Emergency',
      'Trauma',
      'Cardiology',
      'General'
    ],
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
    specializations: [
      'Emergency',
      'Orthopedics',
      'Neurology'
    ],
    contact: {
      phone: '+91-5946-222333',
      email: 'contact@krishnahospital.com',
      emergencyHotline: '108'
    },
    coordinates: { lat: 29.2198, lng: 79.5202 }
  },

  // NEW HOSPITALS

  {
    name: 'AIIMS Satellite Center Haldwani',
    location: 'Y',
    address: 'Nainital Road, Haldwani, Uttarakhand',
    capacity: {
      total: 350,
      available: 260,
      icu: 60,
      emergency: 90
    },
    specializations: [
      'Cardiology',
      'Neurology',
      'ICU',
      'Emergency'
    ],
    contact: {
      phone: '+91-5946-240001',
      email: 'support@aiimshaldwani.in',
      emergencyHotline: '108'
    },
    coordinates: { lat: 29.2355, lng: 79.5148 }
  },

  {
    name: 'City Multispeciality Hospital',
    location: 'K',
    address: 'Nainital Road, Haldwani, Uttarakhand',
    capacity: {
      total: 180,
      available: 120,
      icu: 35,
      emergency: 45
    },
    specializations: [
      'Emergency',
      'Pediatrics',
      'General Surgery'
    ],
    contact: {
      phone: '+91-5946-240002',
      email: 'info@citymultispeciality.in',
      emergencyHotline: '102'
    },
    coordinates: { lat: 29.2330, lng: 79.5100 }
  },

  {
    name: 'Gaulapar Trauma Center',
    location: 'O',
    address: 'Gaulapar, Haldwani, Uttarakhand',
    capacity: {
      total: 150,
      available: 95,
      icu: 25,
      emergency: 40
    },
    specializations: [
      'Trauma',
      'Emergency',
      'Orthopedics'
    ],
    contact: {
      phone: '+91-5946-240003',
      email: 'help@gaulapartrauma.in',
      emergencyHotline: '108'
    },
    coordinates: { lat: 29.2015, lng: 79.5485 }
  },

  {
    name: 'Kathgodam Emergency Care',
    location: 'A',
    address: 'Kathgodam Railway Area, Haldwani, Uttarakhand',
    capacity: {
      total: 120,
      available: 75,
      icu: 20,
      emergency: 30
    },
    specializations: [
      'Emergency',
      'Cardiac Support',
      'General'
    ],
    contact: {
      phone: '+91-5946-240004',
      email: 'care@kathgodamemergency.in',
      emergencyHotline: '108'
    },
    coordinates: { lat: 29.2692, lng: 79.5318 }
  },

  {
    name: 'Teenpani Critical Care Hospital',
    location: 'Q',
    address: 'Teenpani, Bareilly Road, Haldwani',
    capacity: {
      total: 220,
      available: 150,
      icu: 50,
      emergency: 70
    },
    specializations: [
      'Critical Care',
      'ICU',
      'Emergency',
      'Pulmonology'
    ],
    contact: {
      phone: '+91-5946-240005',
      email: 'contact@teenpanicare.in',
      emergencyHotline: '108'
    },
    coordinates: { lat: 29.1958, lng: 79.5008 }
  }
]);

    console.log(`🏥 Created ${hospitals.length} hospitals`);

    // ========== HALDWANI AMBULANCES ==========
    // const ambulances = await Ambulance.create([
    //   {
    //     ambulanceNumber: 'UK04-AMB-001',
    //     currentLocation: 'B',
    //     status: 'AVAILABLE',
    //     hospitalId: hospitals[0]._id,
    //     driver: {
    //       name: 'Ramesh Kumar',
    //       phone: '+91-9876543210'
    //     },
    //     equipment: ['Oxygen', 'Stretcher', 'Defibrillator', 'ECG Monitor']
    //   },
    //   {
    //     ambulanceNumber: 'UK04-AMB-002',
    //     currentLocation: 'H',
    //     status: 'AVAILABLE',
    //     hospitalId: hospitals[1]._id,
    //     driver: {
    //       name: 'Amit Singh',
    //       phone: '+91-9876543222'
    //     },
    //     equipment: ['Oxygen', 'Stretcher', 'Defibrillator']
    //   },
    //   {
    //     ambulanceNumber: 'UK04-AMB-003',
    //     currentLocation: 'A',
    //     status: 'AVAILABLE',
    //     hospitalId: hospitals[0]._id,
    //     driver: {
    //       name: 'Deepak Rawat',
    //       phone: '+91-9876543233'
    //     },
    //     equipment: ['Oxygen', 'Stretcher', 'Ventilator']
    //   }
    // ]);

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
    equipment: ['Oxygen', 'Stretcher', 'Defibrillator']
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
    equipment: ['Oxygen', 'Ventilator']
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
    equipment: ['ICU Kit', 'Oxygen']
  },

  // NEW AMBULANCES

  {
    ambulanceNumber: 'UK04-AMB-004',
    currentLocation: 'K',
    status: 'AVAILABLE',
    hospitalId: hospitals[0]._id,
    driver: {
      name: 'Mohit Joshi',
      phone: '+91-9876543244'
    },
    equipment: ['Defibrillator', 'Ventilator']
  },

  {
    ambulanceNumber: 'UK04-AMB-005',
    currentLocation: 'Q',
    status: 'AVAILABLE',
    hospitalId: hospitals[1]._id,
    driver: {
      name: 'Rahul Bisht',
      phone: '+91-9876543255'
    },
    equipment: ['Oxygen', 'Stretcher']
  },

  {
    ambulanceNumber: 'UK04-AMB-006',
    currentLocation: 'O',
    status: 'AVAILABLE',
    hospitalId: hospitals[0]._id,
    driver: {
      name: 'Sandeep Bora',
      phone: '+91-9876543266'
    },
    equipment: ['Ventilator', 'ICU Support']
  },

  {
    ambulanceNumber: 'UK04-AMB-007',
    currentLocation: 'Y',
    status: 'AVAILABLE',
    hospitalId: hospitals[0]._id,
    driver: {
      name: 'Kamal Mehra',
      phone: '+91-9876543277'
    },
    equipment: ['Advanced Cardiac Life Support']
  },

  {
    ambulanceNumber: 'UK04-AMB-008',
    currentLocation: 'P',
    status: 'AVAILABLE',
    hospitalId: hospitals[1]._id,
    driver: {
      name: 'Nitin Verma',
      phone: '+91-9876543288'
    },
    equipment: ['Trauma Kit', 'Oxygen']
  }
]);

    console.log(`🚑 Created ${ambulances.length} ambulances`);

    // ========== HALDWANI CITY GRAPH ==========
    // EXACTLY matching dispatchService.js default graph
    // const nodes = new Map([
    //   ["A", { name: "Kathgodam", type: "junction", coordinates: { lat: 29.2692, lng: 79.5318 } }],
    //   ["B", { name: "Sushila Tiwari Hospital Area", type: "hospital", coordinates: { lat: 29.2183, lng: 79.5130 } }],
    //   ["C", { name: "Mukhani", type: "residential", coordinates: { lat: 29.2305, lng: 79.4976 } }],
    //   ["D", { name: "Ranibagh", type: "residential", coordinates: { lat: 29.2825, lng: 79.5480 } }],
    //   ["E", { name: "Bhotia Padao", type: "junction", coordinates: { lat: 29.2209, lng: 79.5055 } }],
    //   ["F", { name: "Heera Nagar", type: "residential", coordinates: { lat: 29.2158, lng: 79.5191 } }],
    //   ["G", { name: "Gas Godown Road", type: "residential", coordinates: { lat: 29.2226, lng: 79.5283 } }],
    //   ["H", { name: "Krishna Hospital Area", type: "hospital", coordinates: { lat: 29.2198, lng: 79.5202 } }],
    //   ["I", { name: "Bus Stand Haldwani", type: "junction", coordinates: { lat: 29.2220, lng: 79.5147 } }],
    //   ["J", { name: "Industrial Area", type: "junction", coordinates: { lat: 29.2070, lng: 79.4938 } }]
    // ]);

    // const edges = new Map([
    //   ["A", [{ node: "B", weight: 5.1 }, { node: "D", weight: 6.4 }]],
    //   ["B", [{ node: "A", weight: 5.1 }, { node: "C", weight: 2.8 }, { node: "E", weight: 1.9 }, { node: "H", weight: 3.0 }]],
    //   ["C", [{ node: "B", weight: 2.8 }, { node: "F", weight: 2.1 }, { node: "I", weight: 3.6 }]],
    //   ["D", [{ node: "A", weight: 6.4 }]],
    //   ["E", [{ node: "B", weight: 1.9 }, { node: "F", weight: 1.6 }, { node: "G", weight: 2.3 }]],
    //   ["F", [{ node: "C", weight: 2.1 }, { node: "E", weight: 1.6 }, { node: "I", weight: 2.9 }]],
    //   ["G", [{ node: "E", weight: 2.3 }, { node: "H", weight: 1.8 }]],
    //   ["H", [{ node: "B", weight: 3.0 }, { node: "G", weight: 1.8 }]],
    //   ["I", [{ node: "C", weight: 3.6 }, { node: "F", weight: 2.9 }]],
    //   ["J", [{ node: "A", weight: 4.7 }]]
    // ]);

    // ========== EXPANDED HALDWANI CITY GRAPH ==========

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

  // NEW NODES
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
