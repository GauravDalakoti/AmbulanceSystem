import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ambulanceAPI, emergencyAPI, graphAPI } from '../services/api';
import socketService from '../services/socket';
import 'leaflet/dist/leaflet.css';
import './LiveMap.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// CRITICAL: Route Component using DIRECT OSRM API
function RouteDisplay({ start, end, emergencyId }) {
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const map = useMap();

  useEffect(() => {
    if (!start || !end) {
      console.warn('Missing coordinates for route');
      return;
    }

    console.log(`🗺️ FETCHING ROUTE FOR EMERGENCY ${emergencyId}`);
    console.log(`  FROM (Ambulance): [${start[0]}, ${start[1]}]`);
    console.log(`  TO (Patient): [${end[0]}, ${end[1]}]`);

    // OSRM API URL - note: lon,lat format!
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    console.log(`  🌐 Calling OSRM API: ${url}`);

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log(`  📦 OSRM Response:`, data);

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];

          // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
          const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

          const distance = (route.distance / 1000).toFixed(2);
          const duration = Math.round(route.duration / 60);

          setRouteCoords(coordinates);
          setRouteInfo({ distance, duration });

          console.log(`  ✅ ROUTE SUCCESSFULLY LOADED!`);
          console.log(`     📏 Distance: ${distance} km`);
          console.log(`     ⏱️ Duration: ${duration} min`);
          console.log(`     📍 Coordinates: ${coordinates.length} points`);
          console.log(`     🎯 First point: [${coordinates[0][0]}, ${coordinates[0][1]}]`);
          console.log(`     🎯 Last point: [${coordinates[coordinates.length - 1][0]}, ${coordinates[coordinates.length - 1][1]}]`);

          // Fit map to show route
          if (coordinates.length > 0) {
            const bounds = L.latLngBounds(coordinates);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
            console.log(`  🗺️ Map fitted to route bounds`);
          }
        } else {
          console.error(`  ❌ OSRM returned no routes:`, data);
        }
      })
      .catch(error => {
        console.error(`  ❌ ERROR FETCHING ROUTE:`, error);
      });

  }, [start, end, emergencyId, map]);

  // Don't render anything if no coordinates
  if (!routeCoords || routeCoords.length === 0) {
    console.log(`  ⏳ Waiting for route coordinates...`);
    return null;
  }

  console.log(`  🎨 RENDERING BLUE ROUTE LINE with ${routeCoords.length} points`);

  return (
    <>
      {/* White outline for visibility */}
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: '#ffffff',
          weight: 10,
          opacity: 0.6,
          lineJoin: 'round',
          lineCap: 'round'
        }}
      />

      {/* Main blue route line */}
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: '#2563eb',
          weight: 6,
          opacity: 1,
          lineJoin: 'round',
          lineCap: 'round'
        }}
      >
        <Popup>
          <div style={{ padding: '8px', fontFamily: 'Arial, sans-serif' }}>
            <strong style={{ fontSize: '1.1rem', color: '#2563eb' }}>🛣️ Route</strong><br />
            <div style={{ marginTop: '8px' }}>
              <strong>Distance:</strong> {routeInfo?.distance} km<br />
              <strong>Duration:</strong> {routeInfo?.duration} min<br />
              <strong>Points:</strong> {routeCoords.length}
            </div>
          </div>
        </Popup>
      </Polyline>
    </>
  );
}

const LiveMap = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [nodeCoords, setNodeCoords] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    setupSocket();
    return () => socketService.disconnect();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📡 Loading map data...');

      const [ambRes, emgRes, graphRes] = await Promise.all([
        ambulanceAPI.getAll(),
        emergencyAPI.getActive(),
        graphAPI.get()
      ]);

      console.log('✅ Data loaded:', {
        ambulances: ambRes.data.length,
        emergencies: emgRes.data.length,
        graph: graphRes.data?.cityName
      });

      setAmbulances(ambRes.data);
      setEmergencies(emgRes.data);

      // Build coordinates map
      const coords = {};
      if (graphRes.data?.nodes) {
        Object.entries(graphRes.data.nodes).forEach(([id, node]) => {
          if (node?.coordinates) {
            coords[id] = [node.coordinates.lat, node.coordinates.lng];
            console.log(`  Node ${id}: [${node.coordinates.lat}, ${node.coordinates.lng}]`);
          }
        });
      }
      setNodeCoords(coords);
      console.log(`✅ Mapped ${Object.keys(coords).length} nodes`);

      // Debug emergencies with full details
      if (emgRes.data.length > 0) {
        console.log('\n🆘 EMERGENCIES FOUND:');
        emgRes.data.forEach(e => {
          const amb = ambRes.data.find(a => String(a._id) === String(e.assignedAmbulanceId));

          console.log(`\n  Emergency ${e._id}:`);
          console.log(`    Patient Location: ${e.patientLocation}`);
          console.log(`    Patient Coords: ${coords[e.patientLocation]}`);
          console.log(`    Assigned Ambulance: ${amb?.ambulanceNumber || 'None'}`);
          console.log(`    Ambulance Location: ${amb?.currentLocation || 'N/A'}`);
          console.log(`    Ambulance Coords: ${amb ? coords[amb.currentLocation] : 'N/A'}`);
          console.log(`    Status: ${e.status}`);
          console.log(`    WILL SHOW ROUTE: ${!!(amb && coords[amb.currentLocation] && coords[e.patientLocation])}`);
        });
      } else {
        console.log('ℹ️ No active emergencies');
      }

    } catch (err) {
      console.error('❌ Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    socketService.connect();

    socketService.on('connect', () => console.log('✅ Socket connected'));
    socketService.on('disconnect', () => console.log('⚠️ Socket disconnected'));

    socketService.on('newEmergency', (data) => {
      console.log('\n📡 NEW EMERGENCY EVENT RECEIVED:', data);
      setTimeout(() => {
        console.log('🔄 Reloading data after emergency...');
        loadData();
      }, 1000);
    });

    socketService.on('emergencyCompleted', () => {
      console.log('📡 Emergency completed');
      loadData();
    });
    socketService.on("ambulanceStatusUpdate", (updatedAmbulance) => {
     console.log('📡 ambulance available');
      loadData();
    });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '1.5rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '5px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          Loading Haldwani Emergency Map...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '15px 30px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        zIndex: 1000,
        position: 'relative'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: '700' }}>
          🚑 Haldwani Emergency Dispatch
        </h1>
        <div style={{ display: 'flex', gap: '25px', fontSize: '0.95rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px' }}>
            🚑 Total: <strong>{ambulances.length}</strong>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.3)', padding: '8px 16px', borderRadius: '20px' }}>
            ✓ Available: <strong>{ambulances.filter(a => a.status === 'AVAILABLE').length}</strong>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.3)', padding: '8px 16px', borderRadius: '20px' }}>
            ⚠ Busy: <strong>{ambulances.filter(a => a.status === 'BUSY').length}</strong>
          </div>
          <div style={{ background: 'rgba(220, 38, 38, 0.3)', padding: '8px 16px', borderRadius: '20px' }}>
            🆘 Active: <strong>{emergencies.length}</strong>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={[29.2183, 79.5130]}
        zoom={13}
        style={{ height: 'calc(100vh - 95px)', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
          maxZoom={19}
        />

        {/* Ambulances */}
        {ambulances.map((amb, idx) => {
          const pos = nodeCoords[amb.currentLocation];
          if (!pos) {
            console.warn(`⚠️ No coords for ambulance at ${amb.currentLocation}`);
            return null;
          }

          const offset = idx * 0.0008;
          const adjPos = [pos[0] + offset, pos[1] + offset];

          return (
            <Marker
              key={amb._id}
              position={adjPos}
              icon={L.icon({
                iconUrl: amb.status === 'AVAILABLE'
                  ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
                  : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>
                <div style={{ minWidth: '200px', fontFamily: 'Arial, sans-serif' }}>
                  <h3 style={{
                    margin: '0 0 10px 0',
                    color: amb.status === 'AVAILABLE' ? '#10b981' : '#ef4444',
                    fontSize: '1.1rem'
                  }}>
                    🚑 {amb.ambulanceNumber}
                  </h3>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Status:</strong> <span style={{
                      color: amb.status === 'AVAILABLE' ? '#10b981' : '#ef4444',
                      fontWeight: 'bold'
                    }}>{amb.status}</span>
                  </p>
                  <p style={{ margin: '5px 0' }}><strong>Location:</strong> {amb.currentLocation}</p>
                  <p style={{ margin: '5px 0' }}><strong>Coords:</strong> [{pos[0].toFixed(4)}, {pos[1].toFixed(4)}]</p>
                  <p style={{ margin: '5px 0' }}><strong>Driver:</strong> {amb.driver?.name}</p>
                  <p style={{ margin: '5px 0' }}><strong>Phone:</strong> {amb.driver?.phone}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Emergencies and Routes */}
        {emergencies.map(emg => {
          const patientPos = nodeCoords[emg.patientLocation];
          if (!patientPos) {
            console.warn(`⚠️ No coords for emergency at ${emg.patientLocation}`);
            return null;
          }

          // const assignedAmb = ambulances.find(a => String(a._id) === String(emg.assignedAmbulanceId));
          const assignedAmb = emg.assignedAmbulanceId;

          const ambPos = assignedAmb ? nodeCoords[assignedAmb.currentLocation] : null;

          const willShowRoute = !!(ambPos && patientPos);
          console.log("Emergency assignedAmbulanceId:", emg.assignedAmbulanceId);
          console.log("Available ambulance IDs:", ambulances.map(a => a._id));

          console.log(`\n🎨 RENDERING EMERGENCY ${emg._id}:`);
          console.log(`  Patient at: ${emg.patientLocation} ${patientPos}`);
          console.log(`  Ambulance: ${assignedAmb?.ambulanceNumber || 'None'}`);
          console.log(`  Ambulance at: ${assignedAmb?.currentLocation || 'N/A'} ${ambPos || 'No coords'}`);
          console.log(`  WILL SHOW ROUTE: ${willShowRoute ? '✅ YES' : '❌ NO'}`);

          return (
            <React.Fragment key={emg._id}>
              {/* Emergency Marker */}
              <Marker
                position={patientPos}
                icon={L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
              >
                <Popup>
                  <div style={{ minWidth: '250px', fontFamily: 'Arial, sans-serif' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#dc2626', fontSize: '1.1rem' }}>
                      🆘 Emergency
                    </h3>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Severity:</strong> <span style={{
                        color: emg.severity >= 4 ? '#dc2626' : '#f59e0b',
                        fontWeight: 'bold'
                      }}>{emg.severity}/5</span>
                    </p>
                    <p style={{ margin: '5px 0' }}><strong>Status:</strong> {emg.status}</p>
                    <p style={{ margin: '5px 0' }}><strong>Location:</strong> {emg.patientLocation}</p>
                    <p style={{ margin: '5px 0' }}><strong>Description:</strong> {emg.description}</p>
                    {emg.patientInfo?.name && (
                      <p style={{ margin: '5px 0' }}><strong>Patient:</strong> {emg.patientInfo.name}</p>
                    )}
                    {assignedAmb && (
                      <>
                        <p style={{ margin: '5px 0' }}><strong>Assigned:</strong> {assignedAmb.ambulanceNumber}</p>
                        <p style={{ margin: '5px 0' }}><strong>From:</strong> {assignedAmb.currentLocation}</p>
                      </>
                    )}
                    {emg.estimatedArrival && (
                      <p style={{ margin: '5px 0' }}><strong>ETA:</strong> {emg.estimatedArrival} min</p>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* THE ROUTE - THIS WILL SHOW THE BLUE LINE */}
              {willShowRoute && (
                <RouteDisplay
                  start={ambPos}
                  end={patientPos}
                  emergencyId={emg._id}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LiveMap;



























































// import React, { useState, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
// import L from 'leaflet';
// import { ambulanceAPI, emergencyAPI, graphAPI } from '../services/api';
// import socketService from '../services/socket';
// import 'leaflet/dist/leaflet.css';
// import './LiveMap.css';

// // Fix default marker icons
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
//   iconUrl: require('leaflet/dist/images/marker-icon.png'),
//   shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
// });

// // CUSTOM ICONS
// const createCustomIcon = (emoji, size = 40) => {
//   return L.divIcon({
//     html: `<div style="
//       font-size: ${size}px;
//       text-align: center;
//       line-height: ${size}px;
//       width: ${size}px;
//       height: ${size}px;
//       filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));
//     ">${emoji}</div>`,
//     className: 'custom-emoji-icon',
//     iconSize: [size, size],
//     iconAnchor: [size / 2, size / 2],
//     popupAnchor: [0, -size / 2]
//   });
// };

// // Custom ambulance icon
// const ambulanceIcon = (isAvailable) => {
//   return L.divIcon({
//     html: `<div style="
//       font-size: 32px;
//       text-align: center;
//       filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.4));
//       ${isAvailable ? '' : 'animation: pulse-ambulance 1.5s ease-in-out infinite;'}
//     ">🚑</div>
//     <style>
//       @keyframes pulse-ambulance {
//         0%, 100% { transform: scale(1); }
//         50% { transform: scale(1.15); }
//       }
//     </style>`,
//     className: 'ambulance-icon',
//     iconSize: [35, 35],
//     iconAnchor: [17, 17],
//     popupAnchor: [0, -17]
//   });
// };

// // Custom patient/emergency icon
// const patientIcon = L.divIcon({
//   html: `<div style="
//     font-size: 36px;
//     text-align: center;
//     animation: emergency-pulse 1s ease-in-out infinite;
//     filter: drop-shadow(0px 3px 8px rgba(239, 68, 68, 0.6));
//   ">🆘</div>
//   <style>
//     @keyframes emergency-pulse {
//       0%, 100% { transform: scale(1); opacity: 1; }
//       50% { transform: scale(1.2); opacity: 0.8; }
//     }
//   </style>`,
//   className: 'patient-icon',
//   iconSize: [40, 40],
//   iconAnchor: [20, 20],
//   popupAnchor: [0, -20]
// });

// // ROUTE COMPONENT with multiple routing options
// function RouteDisplay({ start, end, emergencyId, preference = 'balanced' }) {
//   const [routeCoords, setRouteCoords] = useState([]);
//   const [routeInfo, setRouteInfo] = useState(null);
//   const [alternativeRoutes, setAlternativeRoutes] = useState([]);
//   const map = useMap();

//   useEffect(() => {
//     if (!start || !end) {
//       console.warn('Missing coordinates for route');
//       return;
//     }

//     console.log(`🗺️ FETCHING ROUTE FOR EMERGENCY ${emergencyId}`);
//     console.log(`  FROM (Ambulance): [${start[0]}, ${start[1]}]`);
//     console.log(`  TO (Patient): [${end[0]}, ${end[1]}]`);
//     console.log(`  Preference: ${preference}`);

//     // OSRM API with routing preferences
//     // alternatives=true gives up to 3 alternative routes
//     // steps=true gives turn-by-turn instructions
//     const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&alternatives=true&steps=true`;

//     console.log(`  🌐 Calling OSRM API: ${url}`);

//     fetch(url)
//       .then(response => {
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         return response.json();
//       })
//       .then(data => {
//         console.log(`  📦 OSRM Response:`, data);

//         if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
//           // Process all routes
//           const allRoutes = data.routes.map((route, idx) => {
//             const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
//             const distance = (route.distance / 1000).toFixed(2);
//             const duration = Math.round(route.duration / 60);
            
//             return {
//               coordinates,
//               distance,
//               duration,
//               isPrimary: idx === 0
//             };
//           });

//           // Select best route based on preference
//           let selectedRoute;
//           switch (preference) {
//             case 'shortest':
//               // Shortest distance
//               selectedRoute = allRoutes.reduce((prev, curr) => 
//                 parseFloat(curr.distance) < parseFloat(prev.distance) ? curr : prev
//               );
//               break;
//             case 'fastest':
//               // Fastest time
//               selectedRoute = allRoutes.reduce((prev, curr) => 
//                 curr.duration < prev.duration ? curr : prev
//               );
//               break;
//             case 'balanced':
//             default:
//               // Primary route (OSRM's recommended)
//               selectedRoute = allRoutes[0];
//               break;
//           }

//           setRouteCoords(selectedRoute.coordinates);
//           setRouteInfo({ 
//             distance: selectedRoute.distance, 
//             duration: selectedRoute.duration,
//             totalRoutes: allRoutes.length
//           });
//           setAlternativeRoutes(allRoutes.filter((_, idx) => idx !== 0).slice(0, 2));

//           console.log(`  ✅ ROUTE SUCCESSFULLY LOADED!`);
//           console.log(`     📏 Distance: ${selectedRoute.distance} km`);
//           console.log(`     ⏱️ Duration: ${selectedRoute.duration} min`);
//           console.log(`     📍 Coordinates: ${selectedRoute.coordinates.length} points`);
//           console.log(`     🛣️ Alternative routes: ${allRoutes.length - 1}`);

//           // Fit map to show route
//           if (selectedRoute.coordinates.length > 0) {
//             const bounds = L.latLngBounds(selectedRoute.coordinates);
//             map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
//           }
//         } else {
//           console.error(`  ❌ OSRM returned no routes:`, data);
//         }
//       })
//       .catch(error => {
//         console.error(`  ❌ ERROR FETCHING ROUTE:`, error);
//       });

//   }, [start, end, emergencyId, preference, map]);

//   if (!routeCoords || routeCoords.length === 0) {
//     return null;
//   }

//   return (
//     <>
//       {/* Alternative routes (gray dashed) */}
//       {alternativeRoutes.map((altRoute, idx) => (
//         <Polyline
//           key={`alt-${idx}`}
//           positions={altRoute.coordinates}
//           pathOptions={{
//             color: '#94a3b8',
//             weight: 4,
//             opacity: 0.4,
//             dashArray: '10, 10',
//             lineJoin: 'round',
//             lineCap: 'round'
//           }}
//         >
//           <Popup>
//             <div style={{ padding: '8px', fontFamily: 'Arial, sans-serif' }}>
//               <strong style={{ fontSize: '1rem', color: '#64748b' }}>
//                 🛣️ Alternative Route {idx + 1}
//               </strong><br />
//               <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
//                 <strong>Distance:</strong> {altRoute.distance} km<br />
//                 <strong>Duration:</strong> {altRoute.duration} min
//               </div>
//             </div>
//           </Popup>
//         </Polyline>
//       ))}

//       {/* Main route - White outline */}
//       <Polyline
//         positions={routeCoords}
//         pathOptions={{
//           color: '#ffffff',
//           weight: 12,
//           opacity: 0.7,
//           lineJoin: 'round',
//           lineCap: 'round'
//         }}
//       />

//       {/* Main route - Blue line */}
//       <Polyline
//         positions={routeCoords}
//         pathOptions={{
//           color: '#2563eb',
//           weight: 7,
//           opacity: 1,
//           lineJoin: 'round',
//           lineCap: 'round'
//         }}
//       >
//         <Popup>
//           <div style={{ padding: '10px', fontFamily: 'Arial, sans-serif' }}>
//             <strong style={{ fontSize: '1.1rem', color: '#2563eb' }}>
//               🛣️ Primary Route (Recommended)
//             </strong><br />
//             <div style={{ marginTop: '10px', fontSize: '0.95rem' }}>
//               <strong>Distance:</strong> {routeInfo?.distance} km<br />
//               <strong>Duration:</strong> {routeInfo?.duration} min<br />
//               <strong>Route Points:</strong> {routeCoords.length}<br />
//               {routeInfo?.totalRoutes > 1 && (
//                 <><strong>Alternatives:</strong> {routeInfo.totalRoutes - 1} available</>
//               )}
//             </div>
//           </div>
//         </Popup>
//       </Polyline>

//       {/* Start and end markers */}
//       <Circle
//         center={routeCoords[0]}
//         radius={30}
//         pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.4 }}
//       />
//       <Circle
//         center={routeCoords[routeCoords.length - 1]}
//         radius={30}
//         pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.4 }}
//       />
//     </>
//   );
// }

// const LiveMap = () => {
//   const [ambulances, setAmbulances] = useState([]);
//   const [emergencies, setEmergencies] = useState([]);
//   const [nodeCoords, setNodeCoords] = useState({});
//   const [graphNodes, setGraphNodes] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [showAllNodes, setShowAllNodes] = useState(true);
//   const [routePreference, setRoutePreference] = useState('balanced');

//   useEffect(() => {
//     loadData();
//     setupSocket();
//     return () => socketService.disconnect();
//   }, []);

//   const loadData = async () => {
//     try {
//       setLoading(true);
//       console.log('📡 Loading map data...');

//       const [ambRes, emgRes, graphRes] = await Promise.all([
//         ambulanceAPI.getAll(),
//         emergencyAPI.getActive(),
//         graphAPI.get()
//       ]);

//       console.log('✅ Data loaded:', {
//         ambulances: ambRes.data.length,
//         emergencies: emgRes.data.length,
//         graph: graphRes.data?.cityName
//       });

//       setAmbulances(ambRes.data);
//       setEmergencies(emgRes.data);

//       // Build coordinates map and store full node data
//       const coords = {};
//       const nodes = {};
//       if (graphRes.data?.nodes) {
//         Object.entries(graphRes.data.nodes).forEach(([id, node]) => {
//           if (node?.coordinates) {
//             coords[id] = [node.coordinates.lat, node.coordinates.lng];
//             nodes[id] = node;
//             console.log(`  Node ${id} (${node.name}): [${node.coordinates.lat}, ${node.coordinates.lng}]`);
//           }
//         });
//       }
//       setNodeCoords(coords);
//       setGraphNodes(nodes);
//       console.log(`✅ Mapped ${Object.keys(coords).length} nodes`);

//       // Debug emergencies
//       if (emgRes.data.length > 0) {
//         console.log('\n🆘 EMERGENCIES FOUND:');
//         emgRes.data.forEach(e => {
//           const amb = ambRes.data.find(a => String(a._id) === String(e.assignedAmbulanceId));
//           console.log(`\n  Emergency ${e._id}:`);
//           console.log(`    Patient Location: ${e.patientLocation}`);
//           console.log(`    Assigned Ambulance: ${amb?.ambulanceNumber || 'None'}`);
//           console.log(`    Will Show Route: ${!!(amb && coords[amb.currentLocation] && coords[e.patientLocation])}`);
//         });
//       }

//     } catch (err) {
//       console.error('❌ Error loading data:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const setupSocket = () => {
//     socketService.connect();

//     socketService.on('connect', () => console.log('✅ Socket connected - Live Map'));
//     socketService.on('disconnect', () => console.log('⚠️ Socket disconnected'));

//     socketService.on('newEmergency', (data) => {
//       console.log('\n📡 NEW EMERGENCY:', data);
//       setTimeout(() => loadData(), 500);
//     });

//     socketService.on('emergencyStatusUpdate', (data) => {
//       console.log('📡 Emergency status updated:', data);
//       setTimeout(() => loadData(), 500);
//     });

//     socketService.on('emergencyCompleted', () => {
//       console.log('📡 Emergency completed');
//       loadData();
//     });

//     socketService.on('ambulanceStatusUpdate', () => {
//       console.log('📡 Ambulance status updated');
//       loadData();
//     });
//   };

//   if (loading) {
//     return (
//       <div style={{
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         height: '100vh',
//         fontSize: '1.5rem',
//         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//         color: 'white',
//         fontFamily: 'Arial, sans-serif'
//       }}>
//         <div style={{ textAlign: 'center' }}>
//           <div style={{
//             width: '60px',
//             height: '60px',
//             border: '5px solid rgba(255,255,255,0.3)',
//             borderTopColor: 'white',
//             borderRadius: '50%',
//             animation: 'spin 1s linear infinite',
//             margin: '0 auto 20px'
//           }} />
//           Loading Haldwani Emergency Map...
//         </div>
//         <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
//       </div>
//     );
//   }

//   return (
//     <div style={{ width: '100%', height: '100vh', fontFamily: 'Arial, sans-serif', position: 'relative' }}>
//       {/* Header */}
//       <div style={{
//         padding: '15px 30px',
//         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//         color: 'white',
//         boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
//         zIndex: 1000,
//         position: 'relative'
//       }}>
//         <h1 style={{ margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: '700' }}>
//           🚑 Haldwani Emergency Dispatch
//         </h1>
//         <div style={{ display: 'flex', gap: '25px', fontSize: '0.95rem', flexWrap: 'wrap', alignItems: 'center' }}>
//           <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px' }}>
//             🚑 Total: <strong>{ambulances.length}</strong>
//           </div>
//           <div style={{ background: 'rgba(16, 185, 129, 0.3)', padding: '8px 16px', borderRadius: '20px' }}>
//             ✓ Available: <strong>{ambulances.filter(a => a.status === 'AVAILABLE').length}</strong>
//           </div>
//           <div style={{ background: 'rgba(239, 68, 68, 0.3)', padding: '8px 16px', borderRadius: '20px' }}>
//             ⚠ Busy: <strong>{ambulances.filter(a => a.status === 'BUSY').length}</strong>
//           </div>
//           <div style={{ background: 'rgba(220, 38, 38, 0.3)', padding: '8px 16px', borderRadius: '20px' }}>
//             🆘 Active: <strong>{emergencies.length}</strong>
//           </div>
//           <div style={{ background: 'rgba(59, 130, 246, 0.3)', padding: '8px 16px', borderRadius: '20px' }}>
//             📍 Nodes: <strong>{Object.keys(nodeCoords).length}</strong>
//           </div>
//         </div>
//       </div>

//       {/* Control Panel */}
//       <div style={{
//         position: 'absolute',
//         top: '110px',
//         right: '20px',
//         zIndex: 1000,
//         background: 'white',
//         borderRadius: '12px',
//         padding: '15px',
//         boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
//         minWidth: '220px'
//       }}>
//         <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#1f2937' }}>
//           🎛️ Map Controls
//         </h3>
        
//         <div style={{ marginBottom: '15px' }}>
//           <label style={{ 
//             display: 'flex', 
//             alignItems: 'center', 
//             cursor: 'pointer',
//             fontSize: '0.9rem',
//             color: '#374151'
//           }}>
//             <input
//               type="checkbox"
//               checked={showAllNodes}
//               onChange={(e) => setShowAllNodes(e.target.checked)}
//               style={{ marginRight: '8px', cursor: 'pointer' }}
//             />
//             Show All Nodes (A-J)
//           </label>
//         </div>

//         <div>
//           <label style={{ fontSize: '0.85rem', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
//             Route Preference:
//           </label>
//           <select
//             value={routePreference}
//             onChange={(e) => setRoutePreference(e.target.value)}
//             style={{
//               width: '100%',
//               padding: '8px',
//               borderRadius: '6px',
//               border: '1px solid #d1d5db',
//               fontSize: '0.9rem',
//               cursor: 'pointer',
//               background: 'white'
//             }}
//           >
//             <option value="balanced">🎯 Balanced (Recommended)</option>
//             <option value="fastest">⚡ Fastest Time</option>
//             <option value="shortest">📏 Shortest Distance</option>
//           </select>
//           <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '6px' }}>
//             {routePreference === 'balanced' && '✓ OSRM recommended route'}
//             {routePreference === 'fastest' && '✓ Prioritizes main roads'}
//             {routePreference === 'shortest' && '✓ May use narrow streets'}
//           </div>
//         </div>
//       </div>

//       {/* Legend */}
//       <div style={{
//         position: 'absolute',
//         bottom: '20px',
//         left: '20px',
//         zIndex: 1000,
//         background: 'white',
//         borderRadius: '10px',
//         padding: '12px 16px',
//         boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
//         fontSize: '0.85rem'
//       }}>
//         <strong style={{ display: 'block', marginBottom: '8px', color: '#1f2937' }}>Legend:</strong>
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
//           <div>🚑 = Ambulance</div>
//           <div>🆘 = Emergency/Patient</div>
//           <div>📍 = City Node</div>
//           <div style={{ color: '#2563eb' }}>━━━ = Primary Route</div>
//           <div style={{ color: '#94a3b8' }}>- - - = Alternative Route</div>
//         </div>
//       </div>

//       {/* Map */}
//       <MapContainer
//         center={[29.2183, 79.5130]}
//         zoom={13}
//         style={{ height: 'calc(100vh - 95px)', width: '100%' }}
//         scrollWheelZoom={true}
//         zoomControl={true}
//       >
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution='&copy; OpenStreetMap contributors'
//           maxZoom={19}
//         />

//         {/* ALL CITY NODES (A-J) */}
//         {showAllNodes && Object.entries(graphNodes).map(([nodeId, node]) => {
//           const pos = nodeCoords[nodeId];
//           if (!pos) return null;

//           const isHospital = node.isHospital;
//           const hasAmbulance = ambulances.some(amb => amb.currentLocation === nodeId);
//           const hasEmergency = emergencies.some(emg => emg.patientLocation === nodeId);

//           return (
//             <Marker
//               key={`node-${nodeId}`}
//               position={pos}
//               icon={createCustomIcon(
//                 isHospital ? '🏥' : '📍',
//                 isHospital ? 35 : 28
//               )}
//             >
//               <Popup>
//                 <div style={{ fontFamily: 'Arial, sans-serif', minWidth: '180px' }}>
//                   <h4 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '1rem' }}>
//                     {isHospital ? '🏥' : '📍'} Node {nodeId}
//                   </h4>
//                   <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
//                     <strong>Name:</strong> {node.name}
//                   </p>
//                   <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#6b7280' }}>
//                     <strong>Coords:</strong> [{pos[0].toFixed(4)}, {pos[1].toFixed(4)}]
//                   </p>
//                   {isHospital && (
//                     <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#10b981', fontWeight: 'bold' }}>
//                       ✓ Hospital Facility
//                     </p>
//                   )}
//                   {hasAmbulance && (
//                     <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#3b82f6' }}>
//                       🚑 {ambulances.filter(amb => amb.currentLocation === nodeId).length} Ambulance(s) here
//                     </p>
//                   )}
//                   {hasEmergency && (
//                     <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#ef4444' }}>
//                       🆘 Active Emergency
//                     </p>
//                   )}
//                 </div>
//               </Popup>
//             </Marker>
//           );
//         })}

//         {/* AMBULANCES with custom icon */}
//         {ambulances.map((amb) => {
//           const pos = nodeCoords[amb.currentLocation];
//           if (!pos) {
//             console.warn(`⚠️ No coords for ambulance at ${amb.currentLocation}`);
//             return null;
//           }

//           return (
//             <Marker
//               key={amb._id}
//               position={pos}
//               icon={ambulanceIcon(amb.status === 'AVAILABLE')}
//               zIndexOffset={1000}
//             >
//               <Popup>
//                 <div style={{ minWidth: '220px', fontFamily: 'Arial, sans-serif' }}>
//                   <h3 style={{
//                     margin: '0 0 10px 0',
//                     color: amb.status === 'AVAILABLE' ? '#10b981' : '#ef4444',
//                     fontSize: '1.1rem'
//                   }}>
//                     🚑 {amb.ambulanceNumber}
//                   </h3>
//                   <div style={{ fontSize: '0.9rem' }}>
//                     <p style={{ margin: '5px 0' }}>
//                       <strong>Status:</strong> 
//                       <span style={{
//                         marginLeft: '6px',
//                         padding: '2px 8px',
//                         borderRadius: '12px',
//                         background: amb.status === 'AVAILABLE' ? '#d1fae5' : '#fee2e2',
//                         color: amb.status === 'AVAILABLE' ? '#065f46' : '#991b1b',
//                         fontSize: '0.85rem',
//                         fontWeight: 'bold'
//                       }}>
//                         {amb.status}
//                       </span>
//                     </p>
//                     <p style={{ margin: '5px 0' }}>
//                       <strong>Location:</strong> Node {amb.currentLocation} ({graphNodes[amb.currentLocation]?.name})
//                     </p>
//                     <p style={{ margin: '5px 0' }}><strong>Driver:</strong> {amb.driver?.name}</p>
//                     <p style={{ margin: '5px 0' }}><strong>Phone:</strong> {amb.driver?.phone}</p>
//                   </div>
//                 </div>
//               </Popup>
//             </Marker>
//           );
//         })}

//         {/* EMERGENCIES with custom patient icon and routes */}
//         {emergencies.map(emg => {
//           const patientPos = nodeCoords[emg.patientLocation];
//           if (!patientPos) {
//             console.warn(`⚠️ No coords for emergency at ${emg.patientLocation}`);
//             return null;
//           }

//           // const assignedAmb = ambulances.find(a => String(a._id) === String(emg.assignedAmbulanceId));
//           const assignedAmb = emg.assignedAmbulanceId;
//           const ambPos = assignedAmb ? nodeCoords[assignedAmb.currentLocation] : null;
//           const willShowRoute = !!(ambPos && patientPos);

//           return (
//             <React.Fragment key={emg._id}>
//               {/* Emergency/Patient Marker */}
//               <Marker
//                 position={patientPos}
//                 icon={patientIcon}
//                 zIndexOffset={2000}
//               >
//                 <Popup>
//                   <div style={{ minWidth: '260px', fontFamily: 'Arial, sans-serif' }}>
//                     <h3 style={{ margin: '0 0 12px 0', color: '#dc2626', fontSize: '1.1rem' }}>
//                       🆘 EMERGENCY
//                     </h3>
//                     <div style={{ fontSize: '0.9rem' }}>
//                       <p style={{ margin: '6px 0' }}>
//                         <strong>Severity:</strong> 
//                         <span style={{
//                           marginLeft: '6px',
//                           padding: '3px 10px',
//                           borderRadius: '12px',
//                           background: emg.severity >= 4 ? '#fee2e2' : '#fef3c7',
//                           color: emg.severity >= 4 ? '#991b1b' : '#92400e',
//                           fontWeight: 'bold'
//                         }}>
//                           {emg.severity}/5
//                         </span>
//                       </p>
//                       <p style={{ margin: '6px 0' }}>
//                         <strong>Status:</strong> 
//                         <span style={{
//                           marginLeft: '6px',
//                           padding: '2px 8px',
//                           borderRadius: '12px',
//                           background: '#dbeafe',
//                           color: '#1e40af',
//                           fontSize: '0.85rem',
//                           fontWeight: 'bold'
//                         }}>
//                           {emg.status}
//                         </span>
//                       </p>
//                       <p style={{ margin: '6px 0' }}>
//                         <strong>Location:</strong> Node {emg.patientLocation} ({graphNodes[emg.patientLocation]?.name})
//                       </p>
//                       <p style={{ margin: '6px 0' }}><strong>Description:</strong> {emg.description}</p>
//                       {emg.patientInfo?.name && (
//                         <p style={{ margin: '6px 0' }}><strong>Patient:</strong> {emg.patientInfo.name}</p>
//                       )}
//                       {emg.patientInfo?.phone && (
//                         <p style={{ margin: '6px 0' }}><strong>Contact:</strong> {emg.patientInfo.phone}</p>
//                       )}
//                       {assignedAmb && (
//                         <>
//                           <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
//                           <p style={{ margin: '6px 0', color: '#3b82f6' }}>
//                             <strong>Assigned:</strong> {assignedAmb.ambulanceNumber}
//                           </p>
//                           <p style={{ margin: '6px 0' }}>
//                             <strong>From:</strong> Node {assignedAmb.currentLocation}
//                           </p>
//                         </>
//                       )}
//                       {emg.estimatedArrival && (
//                         <p style={{ margin: '6px 0', color: '#f59e0b', fontWeight: 'bold' }}>
//                           ⏱️ ETA: {emg.estimatedArrival} min
//                         </p>
//                       )}
//                       {emg.distance && (
//                         <p style={{ margin: '6px 0' }}>
//                           📏 Distance: {emg.distance.toFixed(2)} km
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 </Popup>
//               </Marker>

//               {/* ROUTE with alternatives */}
//               {willShowRoute && (
//                 <RouteDisplay
//                   start={ambPos}
//                   end={patientPos}
//                   emergencyId={emg._id}
//                   preference={routePreference}
//                 />
//               )}
//             </React.Fragment>
//           );
//         })}
//       </MapContainer>
//     </div>
//   );
// };

// export default LiveMap;

