import React, { useEffect, useState } from "react";
import "./DriverDashboard.css";
import { ambulanceAPI, emergencyAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import socketService from "../services/socket";

const DriverDashboard = () => {
  const [ambulance, setAmbulance] = useState(null);
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(new Date());
  const [updating, setUpdating] = useState(false);
  const [route, setRoute] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    loadData();
    setupSocket();

    // Clock timer
    const timer = setInterval(() => setClock(new Date()), 1000);

    return () => {
      clearInterval(timer);
      socketService.disconnect();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // console.log("this", user.username);

      // Get driver's ambulance info
      const ambRes = await ambulanceAPI.getByDriver(user.username);
      console.log(ambRes);

      const amb = await ambRes.data[0];
      setAmbulance(amb);
      setEmergency(ambRes.data[0]);
      // setEmergency(null);

      console.log("📍 Ambulance loaded:", amb);

      // If ambulance is busy, get assigned emergency
      // if (amb.status === "BUSY") {
      //   const emgRes = await emergencyAPI.getByAmbulance(amb._id);
      //   if (emgRes.data) {
      //     setEmergency(emgRes.data);
      //     console.log("🆘 Active emergency:", emgRes.data);
      //   }
      // } else {
      //   setEmergency(null);
      // }
    } catch (err) {
      console.error("❌ Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    socketService.connect();

    socketService.on("connect", () => {
      console.log("✅ Socket connected - Driver Dashboard");
    });

    // Listen for new emergency assigned to this driver
    socketService.on("emergencyAssigned", (data) => {
      console.log("📡 Emergency assigned to you:", data);

      // Check if this emergency is assigned to current driver's ambulance
      if (data.emergency && ambulance &&
        String(data.emergency.assignedAmbulanceId) === String(ambulance._id)) {
        setEmergency(data.emergency);
        setAmbulance(prev => ({ ...prev, status: "BUSY" }));

        // Show notification
        if (Notification.permission === "granted") {
          new Notification("New Emergency!", {
            body: `Emergency at ${data.emergency.patientLocation}`,
            icon: "/ambulance-icon.png"
          });
        }
      }
    });

    // Listen for emergency updates
    socketService.on("emergencyUpdated", (data) => {
      console.log("📡 Emergency updated:", data);

      if (emergency && String(data.emergency._id) === String(emergency._id)) {
        setEmergency(data.emergency);
      }
    });

    // Listen for emergency completion
    socketService.on("emergencyCompleted", (data) => {
      console.log("📡 Emergency completed:", data);

      if (emergency && String(data.emergencyId) === String(emergency._id)) {
        setEmergency(null);
        setAmbulance(prev => ({ ...prev, status: "AVAILABLE" }));
      }
    });

    socketService.on("disconnect", () => {
      console.log("⚠️ Socket disconnected");
    });
  };

  const updateEmergencyStatus = async (newStatus) => {
    if (!emergency) {
      alert("No active emergency!");
      return;
    }

    try {
      setUpdating(true);
      console.log(`🔄 Updating emergency status to: ${newStatus}`);

      const response = await emergencyAPI.updateStatus(emergency._id, newStatus);
      console.log(response.data);

      if (response.status == 200) {
        console.log("✅ Status updated successfully");

        // Update local state
        // setEmergency(prev => ({ ...prev, status: newStatus }));
        console.log(newStatus);

        const updatedEmergency = {
          ...emergency,
          status: newStatus
        };
        console.log(updatedEmergency);
        setEmergency(updatedEmergency);

        // If completed, clear emergency and set ambulance to available
        if (newStatus === "COMPLETED") {
          setTimeout(() => {
            setEmergency(null);
            setAmbulance(prev => ({ ...prev, status: "AVAILABLE" }));
          }, 2000);
        }
      }
    } catch (err) {
      console.error("❌ Error updating status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const requestNotificationPermission = () => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
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
      {/* Top Bar */}
      <div className="top-bar">
        <div className="brand">
          🚑 HALDWANI EMERGENCY DISPATCH
        </div>
        <div className="clock">
          {clock.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })}
        </div>
        <div className={`status-badge ${getStatusColor(ambulance?.status)}`}>
          <span className="status-dot"></span>
          {ambulance?.status || "UNKNOWN"}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Panel - Ambulance Info */}
        <div className="panel ambulance-panel">
          <h3 className="panel-title">
            <span className="icon">🚑</span>
            Ambulance Unit
          </h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Unit Number</label>
              <span className="value">{ambulance?.ambulanceNumber || "N/A"}</span>
            </div>
            <div className="info-item">
              <label>Driver Name</label>
              <span className="value">{ambulance?.driver?.name || user.username}</span>
            </div>
            <div className="info-item">
              <label>Contact</label>
              <span className="value">{ambulance?.driver?.phone || "N/A"}</span>
            </div>
            <div className="info-item">
              <label>Current Location</label>
              <span className="value location">{ambulance?.currentLocation || "N/A"}</span>
            </div>
            <div className="info-item">
              <label>Status</label>
              <span className={`value status-text ${getStatusColor(ambulance?.status)}`}>
                {ambulance?.status || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Center Panel - Emergency Details */}
        <div className="panel emergency-panel large">
          {emergency ? (
            <>
              <div className="emergency-header">
                <h3 className="alert-title">
                  🆘 ACTIVE EMERGENCY
                </h3>
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
                        <span
                          key={i}
                          className={`severity-dot ${i < emergency.severity ? 'active' : ''}`}
                        />
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

                {/* <div className="detail-row">
                  <span className="label">🕐 Created At:</span>
                  <span className="value">
                    {new Date(emergency.createdAt).toLocaleString()}
                  </span>
                </div> */}
              </div>

              {/* Control Buttons */}
              <div className="control-buttons">
                {emergency.status === "ASSIGNED" && (
                  <button
                    onClick={() => updateEmergencyStatus("IN_TRANSIT")}
                    className="btn btn-start"
                    disabled={updating}
                  >
                    <span className="btn-icon">🚀</span>
                    {updating ? "Updating..." : "START JOURNEY"}
                  </button>
                )}

                {emergency.status === "IN_TRANSIT" && (
                  <button
                    onClick={() => updateEmergencyStatus("REACHED")}
                    className="btn btn-arrived"
                    disabled={updating}
                  >
                    <span className="btn-icon">📍</span>
                    {updating ? "Updating..." : "PATIENT REACHED"}
                  </button>
                )}

                {(emergency.status === "REACHED" || emergency.status === "IN_TRANSIT") && (
                  <button
                    onClick={() => updateEmergencyStatus("COMPLETED")}
                    className="btn btn-complete"
                    disabled={updating}
                  >
                    <span className="btn-icon">✅</span>
                    {updating ? "Completing..." : "COMPLETE MISSION"}
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

        {/* Right Panel - Live Metrics */}
        <div className="panel metrics-panel">
          <h3 className="panel-title">
            <span className="icon">📊</span>
            Live Metrics
          </h3>

          <div className="metrics-list">
            <div className="metric-item">
              <div className="metric-header">
                <span className="metric-label">⛽ Fuel Level</span>
                <span className="metric-value">87%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill fuel" style={{ width: "87%" }}></div>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-header">
                <span className="metric-label">📡 GPS Signal</span>
                <span className="metric-value">Strong</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill signal" style={{ width: "95%" }}></div>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-header">
                <span className="metric-label">🔧 Engine Status</span>
                <span className="metric-value">Optimal</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill engine" style={{ width: "92%" }}></div>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-header">
                <span className="metric-label">🌡️ Temperature</span>
                <span className="metric-value">Normal</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill temp" style={{ width: "68%" }}></div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
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

      {/* Footer Status Bar */}
      <div className="footer-bar">
        <div className="footer-item">
          <span className="footer-icon">🔒</span>
          <span>System Secure</span>
        </div>
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