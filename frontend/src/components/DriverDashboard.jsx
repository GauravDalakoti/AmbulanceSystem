import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "./DriverDashboard.css";
import { ambulanceAPI, emergencyAPI, graphAPI, userApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import socketService from "../services/socket";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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
            <strong style={{ fontSize: '1.1rem', color: '#2563eb' }}>🛣️ Route to Patient</strong><br />
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

const DriverDashboard = () => {
  const [ambulance, setAmbulance] = useState(null);
  const [emergency, setEmergency] = useState(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState(null); 
  const [nodeCoords, setNodeCoords] = useState({});
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(new Date());
  const [updating, setUpdating] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    loadData();
    setupSocket();
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => {
      clearInterval(timer);
      socketService.disconnect();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const ambRes = await ambulanceAPI.getByDriver(user.username);
      const emergencyData = ambRes.data[0];

      setAmbulance(emergencyData);
      setEmergency(emergencyData);
     
      const graphRes = await graphAPI.get();
      const coords = {};
      const nodes = graphRes.data?.nodes;
      if (nodes) {
        Object.entries(nodes).forEach(([id, node]) => {
          if (node?.coordinates) {
            coords[id] = [node.coordinates.lat, node.coordinates.lng];
          }
        });
      }
      console.log("NodeCoords:", coords);
      setNodeCoords(coords);

      
      if (emergencyData && emergencyData.assignedAmbulanceId) {
        fetchAmbulanceLocation(emergencyData.assignedAmbulanceId);
      }

    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };


  const fetchAmbulanceLocation = async (ambulanceId) => {
    try {
      
      const ambRes = await userApi.getAmbulanceLocationById(ambulanceId);
      console.log("Ambulance location data:", ambRes.data.data);
      setAmbulanceLocation(ambRes.data.data);

   
      
    } catch (err) {
      console.error('Error fetching ambulance location:', err);
    }
  };

  const setupSocket = () => {
    socketService.connect();
    socketService.on("connect", () => console.log("Socket connected - Driver Dashboard"));

    socketService.on("emergencyAssigned", (data) => {
      if (data.emergency && ambulance &&
        String(data.emergency.assignedAmbulanceId) === String(ambulance._id)) {
        setEmergency(data.emergency);
        setAmbulance((prev) => ({ ...prev, status: "BUSY" }));
        if (data.emergency.assignedAmbulanceId) {
          fetchAmbulanceLocation(data.emergency.assignedAmbulanceId);
        }
        if (Notification.permission === "granted") {
          new Notification("New Emergency!", { body: `Emergency at ${data.emergency.patientLocation}` });
        }
      }
    });

    socketService.on("emergencyUpdated", (data) => {
      if (emergency && String(data.emergency._id) === String(emergency._id)) {
        setEmergency(data.emergency);
      }
    });

    socketService.on("ambulanceLocationUpdate", (data) => {
      
      if (emergency && data.ambulanceId === emergency.assignedAmbulanceId) {
        setAmbulanceLocation(data);
      }
    });

    socketService.on("emergencyCompleted", (data) => {
      if (emergency && String(data.emergencyId) === String(emergency._id)) {
        setEmergency(null);
        setAmbulanceLocation(null);
        setAmbulance((prev) => ({ ...prev, status: "AVAILABLE" }));
      }
    });

    socketService.on("disconnect", () => console.log("Socket disconnected"));
  };

  const updateEmergencyStatus = async (newStatus) => {
    if (!emergency) { alert("No active emergency!"); return; }
    try {
      setUpdating(true);
      const response = await emergencyAPI.updateStatus(emergency._id, newStatus);
      if (response.status === 200) {
        setEmergency({ ...emergency, status: newStatus });
        if (newStatus === "COMPLETED") {
          setTimeout(() => {
            setEmergency(null);
            setAmbulanceLocation(null);
            setAmbulance((prev) => ({ ...prev, status: "AVAILABLE" }));
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (Notification.permission === "default") Notification.requestPermission();
  }, []);

  if (loading) {
    return (
      <div className="driver-loading">
        <div className="spinner"></div>
        <p>Initializing Driver System...</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "AVAILABLE": return "green";
      case "BUSY": return "orange";
      case "OFFLINE": return "red";
      default: return "gray";
    }
  };

  const getEmergencyStatusColor = (status) => {
    switch (status) {
      case "PENDING": return "#fbbf24";
      case "ASSIGNED": return "#3b82f6";
      case "IN_TRANSIT": return "#8b5cf6";
      case "REACHED": return "#f59e0b";
      case "COMPLETED": return "#10b981";
      default: return "#6b7280";
    }
  };

  return (
    <div className="command-center">

     
      <div className="top-bar">
        <div className="brand">🚑 HALDWANI EMERGENCY DISPATCH</div>
        <div className="clock">
          {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
        </div>
        <div className={`status-badge ${getStatusColor(ambulance?.status)}`}>
          <span className="status-dot"></span>
          {ambulance?.status || "UNKNOWN"}
        </div>
      </div>

      <div className="dashboard-grid">

        {/* Left – Ambulance Info */}
        <div className="panel ambulance-panel">
          <h3 className="panel-title"><span className="icon">🚑</span>Ambulance Unit</h3>
          <div className="info-grid">
            {/* <div className="info-item">
              <label>Unit Number</label>
              <span className="value">{ambulanceLocation?.ambulanceNumber || ambulance?.ambulanceNumber || "N/A"}</span>
            </div> */}
            <div className="info-item">
              <label>Driver Name</label>
              <span className="value">{ user.username}</span>
            </div>
            {/* <div className="info-item">
              <label>Contact</label>
              <span className="value">{ambulanceLocation?.driver?.phone || ambulance?.driver?.phone || "N/A"}</span>
            </div> */}
            {/* <div className="info-item">
              <label>Current Location</label>
              <span className="value location">{ambulanceLocation?.currentLocation || "N/A"}</span>
            </div> */}
            {/* <div className="info-item">
              <label>Status</label>
              <span className={`value status-text ${getStatusColor(ambulance?.status)}`}>
                {ambulance?.status || "N/A"}
              </span>
            </div> */}
          </div>
        </div>

        {/* Center – Emergency Details + Map */}
        <div className="panel emergency-panel large">
          {emergency ? (
            <>
              <div className="emergency-header">
                <h3 className="alert-title">🆘 ACTIVE EMERGENCY</h3>
                <span
                  className="emergency-status-badge"
                  style={{ backgroundColor: getEmergencyStatusColor(emergency.status) }}
                >
                  {emergency.status}
                </span>
              </div>

              <div className="emergency-details">
                <div className="detail-row">
                  <span className="label">📍 Patient Location:</span>
                  <span className="value">{emergency.patientLocation}</span>
                </div>
                <div className="detail-row">
                  <span className="label">🚨 Severity Level:</span>
                  <span className="value severity">
                    <span className="severity-bar">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`severity-dot ${i < emergency.severity ? "active" : ""}`} />
                      ))}
                    </span>
                    {emergency.severity}/5
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">📋 Description:</span>
                  <span className="value">{emergency.description || "No description provided"}</span>
                </div>
                <div className="detail-row">
                  <span className="label">👤 Patient Name:</span>
                  <span className="value">{emergency.patientInfo?.name || "N/A"}</span>
                </div>
                {emergency.patientInfo?.phone && (
                  <div className="detail-row">
                    <span className="label">📞 Patient Contact:</span>
                    <span className="value">{emergency.patientInfo.phone}</span>
                  </div>
                )}
                {emergency.estimatedArrival && (
                  <div className="detail-row">
                    <span className="label">⏱️ ETA:</span>
                    <span className="value eta">{emergency.estimatedArrival} min</span>
                  </div>
                )}
                {emergency.distance && (
                  <div className="detail-row">
                    <span className="label">📏 Distance:</span>
                    <span className="value">{emergency.distance.toFixed(2)} km</span>
                  </div>
                )}
              </div>

              {/* Control Buttons */}
              <div className="control-buttons">
                {emergency.status === "ASSIGNED" && (
                  <button onClick={() => updateEmergencyStatus("IN_TRANSIT")} className="btn btn-start" disabled={updating}>
                    <span className="btn-icon">🚀</span>{updating ? "Updating..." : "START JOURNEY"}
                  </button>
                )}
                {emergency.status === "IN_TRANSIT" && (
                  <button onClick={() => updateEmergencyStatus("REACHED")} className="btn btn-arrived" disabled={updating}>
                    <span className="btn-icon">📍</span>{updating ? "Updating..." : "PATIENT REACHED"}
                  </button>
                )}
                {(emergency.status === "REACHED" || emergency.status === "IN_TRANSIT") && (
                  <button onClick={() => updateEmergencyStatus("COMPLETED")} className="btn btn-complete" disabled={updating}>
                    <span className="btn-icon">✅</span>{updating ? "Completing..." : "COMPLETE MISSION"}
                  </button>
                )}
                {emergency.status === "COMPLETED" && (
                  <div className="completion-message">
                    <span className="success-icon">✅</span>
                    <p>Mission Completed Successfully!</p>
                  </div>
                )}
              </div>

            
             
            </>
          ) : (
            <div className="idle-state">
              <div className="idle-icon">✅</div>
              <h3>SYSTEM READY</h3>
              <p>Waiting for emergency assignment...</p>
              <div className="pulse-indicator"></div>
            </div>
          )}
        </div>

        {/* Right – Live Metrics */}
        <div className="panel metrics-panel">
          <h3 className="panel-title"><span className="icon">📊</span>Live Metrics</h3>
          <div className="metrics-list">
            <div className="metric-item">
              <div className="metric-header">
                <span className="metric-label">⛽ Fuel Level</span>
                <span className="metric-value">87%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill fuel" style={{ width: "87%" }}></div></div>
            </div>
            <div className="metric-item">
              <div className="metric-header">
                <span className="metric-label">📡 GPS Signal</span>
                <span className="metric-value">Strong</span>
              </div>
              <div className="progress-bar"><div className="progress-fill signal" style={{ width: "95%" }}></div></div>
            </div>
            <div className="metric-item">
              <div className="metric-header">
                <span className="metric-label">🔧 Engine Status</span>
                <span className="metric-value">Optimal</span>
              </div>
              <div className="progress-bar"><div className="progress-fill engine" style={{ width: "92%" }}></div></div>
            </div>
            <div className="metric-item">
              <div className="metric-header">
                <span className="metric-label">🌡️ Temperature</span>
                <span className="metric-value">Normal</span>
              </div>
              <div className="progress-bar"><div className="progress-fill temp" style={{ width: "68%" }}></div></div>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-icon">🚦</span>
              <span className="stat-label">Today's Trips</span>
              <span className="stat-value">3</span>
            </div>
            <div className="stat-box">
              <span className="stat-icon">⏱️</span>
              <span className="stat-label">Avg Response</span>
              <span className="stat-value">8 min</span>
            </div>
          </div>
        </div>

      </div>

       {/* Live Map — */}

       {emergency && (
       <div className="live-map-container" style={{  margin: "40px" }}>
                <h3 style={{ marginBottom: "10px" }}>🗺️ Live Navigation Map</h3>
                <MapContainer
                  center={nodeCoords[emergency.patientLocation] || [29.2183, 79.5130]}
                  zoom={13}
                  style={{ height: '400px', width: '100%', borderRadius: '12px' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />

                 
                  {nodeCoords[emergency.patientLocation] && (
                    <Marker
                      position={nodeCoords[emergency.patientLocation]}
                      icon={patientIcon}
                    >
                      <Popup>
                        <div style={{ fontFamily: 'Arial, sans-serif' }}>
                          <strong style={{ color: '#dc2626' }}>🆘 Patient Location</strong><br />
                          Node {emergency.patientLocation}<br />
                          {emergency.patientInfo?.name && <>Name: {emergency.patientInfo.name}<br /></>}
                          Severity: {emergency.severity}/5
                        </div>
                      </Popup>
                    </Marker>
                  )}

                 
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
                          Status: En route to patient!
                        </div>
                      </Popup>
                    </Marker>
                  )}

                
                  {ambulanceLocation &&
                    nodeCoords[ambulanceLocation.currentLocation] &&
                    nodeCoords[emergency.patientLocation] && (
                      <RouteDisplay
                        start={nodeCoords[ambulanceLocation.currentLocation]}
                        end={nodeCoords[emergency.patientLocation]}
                        emergencyId={emergency._id}
                      />
                    )}
                </MapContainer>
              </div>

                  )

                }

      {/* Footer */}
      <div className="footer-bar">
        <div className="footer-item"><span className="footer-icon">🔒</span><span>System Secure</span></div>
        <div className="footer-item">
          <span className="footer-icon">📶</span>
          <span>Connection: {socketService.socket?.connected ? "Active" : "Disconnected"}</span>
        </div>
        <div className="footer-item">
          <span className="footer-icon">👤</span>
          <span>Driver: {user.username}</span>
        </div>
      </div>



    </div>
  );
};

export default DriverDashboard;