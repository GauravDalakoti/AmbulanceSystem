import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
// import { userApi } from '../services/api';
import socketService from '../services/socket';
import { emergencyAPI, graphAPI, userApi } from '../services/api';
import 'leaflet/dist/leaflet.css';
import './UserDashboard.css';

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom icons
const ambulanceIcon = (isAssigned) => {
  return L.divIcon({
    html: `<div style="
      font-size: 36px;
      text-align: center;
      filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.4));
      ${isAssigned ? 'animation: pulse-ambulance 1.5s ease-in-out infinite;' : ''}
    ">🚑</div>
    <style>
      @keyframes pulse-ambulance {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
      }
    </style>`,
    className: 'ambulance-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

const patientIcon = L.divIcon({
  html: `<div style="
    font-size: 42px;
    text-align: center;
    animation: emergency-pulse 1s ease-in-out infinite;
    filter: drop-shadow(0px 3px 8px rgba(239, 68, 68, 0.6));
  ">🆘</div>
  <style>
    @keyframes emergency-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }
  </style>`,
  className: 'patient-icon',
  iconSize: [45, 45],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22]
});

// Route Display Component
function RouteDisplay({ start, end, emergencyId }) {
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const map = useMap();

  useEffect(() => {
    if (!start || !end) return;

    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          const distance = (route.distance / 1000).toFixed(2);
          const duration = Math.round(route.duration / 60);

          setRouteCoords(coordinates);
          setRouteInfo({ distance, duration });

          if (coordinates.length > 0) {
            const bounds = L.latLngBounds(coordinates);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
          }
        }
      })
      .catch(error => console.error('Error fetching route:', error));

  }, [start, end, emergencyId, map]);

  if (!routeCoords || routeCoords.length === 0) return null;

  return (
    <>
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
            <strong style={{ fontSize: '1.1rem', color: '#2563eb' }}>🛣️ Route to You</strong><br />
            <div style={{ marginTop: '8px' }}>
              <strong>Distance:</strong> {routeInfo?.distance} km<br />
              <strong>Duration:</strong> {routeInfo?.duration} min
            </div>
          </div>
        </Popup>
      </Polyline>
    </>
  );
}

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState(null);
  const [nodeCoords, setNodeCoords] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    loadUserData();
    setupSocket();
    return () => socketService.disconnect();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      console.log(user._id);

      if (!user) {
        window.location.href = '/login';
        return;
      }

      // Fetch user data
      const userRes = await userApi.getProfile(user._id);
      setUser(userRes.data);

      console.log(userRes);


      // Fetch user's emergencies
      const emergenciesRes = await emergencyAPI.getById(user._id);
      setEmergencies(emergenciesRes.data);

      // Find active emergency
      const active = emergenciesRes.data.find(e =>
        ['ASSIGNED', 'IN_TRANSIT', 'REACHED'].includes(e.status)
      );
      setActiveEmergency(active);

      // Fetch stats
      const statsRes = await userApi.getStats(user._id);
      console.log(statsRes.data.data);

      setStats(statsRes.data.data);

      // Fetch graph coordinates
      // const graphRes = await userApi.getGraph();
      // // const graphRes = await graphAPI.get();
      // const coords = {};
      // console.log("graph",graphRes.data.data);

      // if (graphRes.data?.data?.nodes) {
      //   Object.entries(graphRes.data.nodes).forEach(([id, node]) => {
      //     if (node?.coordinates) {
      //       coords[id] = [node.coordinates.lat, node.coordinates.lng];
      //     }
      //   });
      // }
      // setNodeCoords(coords);

      const graphRes = await graphAPI.get();
      const coords = {};

      console.log("Graph API FULL:", graphRes.data); // 🔥 MUST LOG

      const nodes = graphRes.data?.nodes; // ✅ CORRECT

      if (nodes) {
        Object.entries(nodes).forEach(([id, node]) => {
          if (node?.coordinates) {
            coords[id] = [node.coordinates.lat, node.coordinates.lng];
          }
        });
      }

      console.log("NodeCoords:", coords); // ✅ SHOULD NOT BE EMPTY

      setNodeCoords(coords);

      // If there's an active emergency with assigned ambulance, fetch ambulance location
      if (active && active.assignedAmbulanceId) {
        fetchAmbulanceLocation(active.assignedAmbulanceId);
      }

    } catch (err) {
      console.error('❌ Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAmbulanceLocation = async (ambulanceId) => {
    try {

      console.log("ghfn fhjfhfhf ",ambulanceId);
      
      const ambRes = await userApi.getAmbulanceLocation(ambulanceId);
      // console.log("Ambulance:", ambulanceLocation);
      // console.log("Start:", nodeCoords[ambulanceLocation?.currentLocation]);
      // console.log("End:", nodeCoords[activeEmergency?.patientLocation]);

      setAmbulanceLocation(ambRes.data.data);

    } catch (err) {
      console.error('Error fetching ambulance location:', err);
    }
  };

  const setupSocket = () => {
    socketService.connect();

    socketService.on('connect', () => console.log('✅ Socket connected - User Dashboard'));

    socketService.on('emergencyStatusUpdate', (data) => {
      console.log('📡 Emergency status updated:', data);
      loadUserData(); // Reload all data
    });

    socketService.on('ambulanceLocationUpdate', (data) => {
      console.log('📡 Ambulance location updated:', data);
      if (activeEmergency && data.ambulanceId === activeEmergency.assignedAmbulanceId) {
        setAmbulanceLocation(data);
      }
    });

    socketService.on('emergencyCompleted', (data) => {
      console.log('📡 Emergency completed:', data);
      loadUserData();
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': '#94a3b8',
      'ASSIGNED': '#3b82f6',
      'IN_TRANSIT': '#f59e0b',
      'REACHED': '#8b5cf6',
      'COMPLETED': '#10b981',
      'CANCELLED': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'PENDING': 'Waiting for Ambulance',
      'ASSIGNED': 'Ambulance Assigned',
      'IN_TRANSIT': 'Ambulance On The Way',
      'REACHED': 'Ambulance Reached',
      'COMPLETED': 'Trip Completed',
      'CANCELLED': 'Cancelled'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleCancel = async (emergencyId) => {
    console.log(emergencyId);

    alert("are you sure you want to cancel")
    const EmergencyRes = await userApi.cancelEmergency(emergencyId);
    if (EmergencyRes.data.data.success == true) {
      loadUserData();
    }
    // setupSocket();
    // return () => socketService.disconnect();
    console.log(EmergencyRes.data.data);


  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
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
          Loading Your Dashboard...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Header */}
      {/*
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🏥 My Emergency Dashboard</h1>
          <div className="user-info">
            <span>Welcome, <strong>{user?.name || 'User'}</strong></span>
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem('userId');
                localStorage.removeItem('userToken');
                window.location.href = '/login';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      */}

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.totalEmergencies}</div>
            <div className="stat-label">Total Emergencies</div>
          </div>
        </div>

        <div className="stat-card active">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.activeEmergencies}</div>
            <div className="stat-label">Active Emergency</div>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.completedEmergencies}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.avgResponseTime || 15} min</div>
            <div className="stat-label">Avg Response Time</div>
          </div>
        </div>
      </div>

      {/* Active Emergency Section */}
      {activeEmergency && (
        <div className="active-emergency-section">
          <h2>🚑 Active Emergency Tracking</h2>

          <div className="emergency-details-card">
            <div className="emergency-header">
              <div className="emergency-id">Emergency #{activeEmergency._id.slice(-6)}</div>
              <div
                className="status-badge"
                style={{ background: getStatusColor(activeEmergency.status) }}
              >
                {getStatusLabel(activeEmergency.status)}
              </div>
            </div>

            <div className="emergency-info-grid">
              <div className="info-item">
                <div className="info-label">📍 Your Location</div>
                <div className="info-value">Node {activeEmergency.patientLocation}</div>
              </div>

              <div className="info-item">
                <div className="info-label">⚕️ Severity</div>
                <div className="info-value">
                  <span style={{
                    color: activeEmergency.severity >= 4 ? '#ef4444' : '#f59e0b',
                    fontWeight: 'bold'
                  }}>
                    {activeEmergency.severity}/5
                  </span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-label">📝 Description</div>
                <div className="info-value">{activeEmergency.description}</div>
              </div>

              {activeEmergency.symptoms && (
                <div className="info-item">
                  <div className="info-label">🩺 Symptoms</div>
                  <div className="info-value">{activeEmergency.symptoms}</div>
                </div>
              )}

              {ambulanceLocation && (
                <>
                  <div className="info-item">
                    <div className="info-label">🚑 Ambulance</div>
                    <div className="info-value">{ambulanceLocation.ambulanceNumber}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">👨‍⚕️ Driver</div>
                    <div className="info-value">{ambulanceLocation.driver?.name}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">📞 Contact</div>
                    <div className="info-value">{ambulanceLocation.driver?.phone}</div>
                  </div>
                </>
              )}

              {activeEmergency.estimatedArrival && (
                <div className="info-item highlight">
                  <div className="info-label">⏰ Estimated Arrival</div>
                  <div className="info-value" style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {activeEmergency.estimatedArrival} minutes
                  </div>
                </div>
              )}

              {activeEmergency.distance && (
                <div className="info-item">
                  <div className="info-label">📏 Distance</div>
                  <div className="info-value">{activeEmergency.distance.toFixed(2)} km</div>
                </div>
              )}

              <div
                className="cancel-btn"
                style={{ background: getStatusColor(activeEmergency.status) }}
                onClick={() => handleCancel(activeEmergency._id)}
              >
                cancel emergencie
              </div>
            </div>

            {/* Live Map */}
            <div className="live-map-container">
              <h3>🗺️ Live Tracking Map</h3>
              <MapContainer
                center={nodeCoords[activeEmergency.patientLocation] || [29.2183, 79.5130]}
                zoom={13}
                style={{ height: '400px', width: '100%', borderRadius: '12px' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />

                {/* Patient Location */}
                {nodeCoords[activeEmergency.patientLocation] && (
                  <Marker
                    position={nodeCoords[activeEmergency.patientLocation]}
                    icon={patientIcon}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'Arial, sans-serif' }}>
                        <strong style={{ color: '#dc2626' }}>🆘 Your Location</strong><br />
                        Node {activeEmergency.patientLocation}<br />
                        Waiting for ambulance...
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Ambulance Location */}
                {ambulanceLocation && nodeCoords[ambulanceLocation.currentLocation] && (
                  <Marker
                    position={nodeCoords[ambulanceLocation.currentLocation]}
                    icon={ambulanceIcon(true)}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'Arial, sans-serif' }}>
                        <strong style={{ color: '#3b82f6' }}>🚑 {ambulanceLocation.ambulanceNumber}</strong><br />
                        Driver: {ambulanceLocation.driver?.name}<br />
                        Phone: {ambulanceLocation.driver?.phone}<br />
                        Status: On the way to you!
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Route */}
                {ambulanceLocation &&
                  nodeCoords[ambulanceLocation.currentLocation] &&
                  nodeCoords[activeEmergency.patientLocation] && (
                    <RouteDisplay
                      start={nodeCoords[ambulanceLocation.currentLocation]}
                      end={nodeCoords[activeEmergency.patientLocation]}
                      emergencyId={activeEmergency._id}
                    />
                  )}
              </MapContainer>
            </div>

            {/* Help Instructions */}
            <div className="help-instructions">
              <h4>💡 What to do while waiting:</h4>
              <ul>
                <li>Stay calm and in your current location</li>
                <li>Keep your phone accessible for driver contact</li>
                <li>Prepare any medical documents if available</li>
                <li>If condition worsens, call emergency services: <strong>112</strong></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Emergency History */}
      <div className="emergency-history-section">
        <h2>📋 Emergency History</h2>

        {emergencies.length === 0 ? (
          <div className="no-emergencies">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏥</div>
            <h3>No Emergency Requests Yet</h3>
            <p>You haven't requested any emergency services.</p>
            <button
              className="create-emergency-btn"
              onClick={() => window.location.href = '/emergency'}
            >
              Request Emergency Ambulance
            </button>
          </div>
        ) : (
          <div className="emergency-list">
            {emergencies.map(emergency => (
              <div key={emergency._id} className="emergency-card">
                <div className="emergency-card-header">
                  <div className="emergency-meta">
                    <span className="emergency-date">{formatDate(emergency.createdAt)}</span>
                    <span className="emergency-id">#{emergency._id.slice(-6)}</span>
                  </div>
                  <div
                    className="status-badge"
                    style={{ background: getStatusColor(emergency.status) }}
                  >
                    {getStatusLabel(emergency.status)}
                  </div>
                </div>

                <div className="emergency-card-body">
                  <div className="emergency-field">
                    <strong>Location:</strong> Node {emergency.patientLocation}
                  </div>
                  <div className="emergency-field">
                    <strong>Severity:</strong>
                    <span style={{
                      color: emergency.severity >= 4 ? '#ef4444' : '#f59e0b',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {emergency.severity}/5
                    </span>
                  </div>
                  <div className="emergency-field">
                    <strong>Description:</strong> {emergency.description}
                  </div>
                  {emergency.assignedAmbulanceNumber && (
                    <div className="emergency-field">
                      <strong>Ambulance:</strong> {emergency.assignedAmbulanceNumber}
                    </div>
                  )}
                  {emergency.completedAt && (
                    <div className="emergency-field">
                      <strong>Completed At:</strong> {formatDate(emergency.completedAt)}
                    </div>
                  )}
                  {emergency.responseTime && (
                    <div className="emergency-field">
                      <strong>Response Time:</strong> {emergency.responseTime} minutes
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;