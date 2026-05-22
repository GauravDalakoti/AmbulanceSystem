import React, { useState, useEffect } from 'react';
import { emergencyAPI, ambulanceAPI, graphAPI } from '../services/api';
import socketService from '../services/socket';
import './Dashboard.css';

const Dashboard = () => {
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    setupSocketListeners();

    return () => {
      socketService.removeAllListeners('newEmergency');
      socketService.removeAllListeners('emergencyStatusUpdate');
      socketService.removeAllListeners('ambulanceStatusUpdate');
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [emergenciesRes, ambulancesRes, statsRes] = await Promise.all([
        emergencyAPI.getActive(),
        ambulanceAPI.getAll(),
        graphAPI.getStats()
      ]);

      setActiveEmergencies(emergenciesRes.data);
      setAmbulances(ambulancesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.connect();

    socketService.on('newEmergency', (data) => {
      if (data.success) {
        setActiveEmergencies(prev => [data.emergency, ...prev]);
      }
    });

    socketService.on('emergencyStatusUpdate', (emergency) => {
      setActiveEmergencies(prev =>
        prev.map(e => e._id === emergency._id ? emergency : e)
      );
    });

    socketService.on('ambulanceStatusUpdate', (ambulance) => {
      setAmbulances(prev =>
        prev.map(a => a._id === ambulance._id ? ambulance : a)
      );
    });

    socketService.on('emergencyCompleted', () => {
      loadData(); // Refresh all data
    });
  };

  const getSeverityClass = (severity) => {
    if (severity >= 4) return 'critical';
    if (severity === 3) return 'high';
    if (severity === 2) return 'medium';
    return 'low';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': 'pending',
      'ASSIGNED': 'assigned',
      'IN_TRANSIT': 'in-transit',
      'REACHED': 'reached',
      'COMPLETED': 'completed'
    };
    return badges[status] || 'pending';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🚑 Emergency Dispatch Dashboard</h1>
        <div className="live-indicator">
          <span className="pulse"></span>
          <span>Live</span>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🚑</div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalAmbulances}</div>
              <div className="stat-label">Total Ambulances</div>
            </div>
          </div>

          <div className="stat-card available">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.availableAmbulances}</div>
              <div className="stat-label">Available</div>
            </div>
          </div>

          <div className="stat-card busy">
            <div className="stat-icon">🚨</div>
            <div className="stat-info">
              <div className="stat-value">{stats.busyAmbulances}</div>
              <div className="stat-label">On Duty</div>
            </div>
          </div>

          <div className="stat-card active">
            <div className="stat-icon">📞</div>
            <div className="stat-info">
              <div className="stat-value">{stats.activeEmergencies}</div>
              <div className="stat-label">Active Emergencies</div>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-value">{stats.pendingEmergencies}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div className="stat-card completed">
            <div className="stat-icon">✔️</div>
            <div className="stat-info">
              <div className="stat-value">{stats.completedToday}</div>
              <div className="stat-label">Completed Today</div>
            </div>
          </div>
        </div>
      )}

      {/* Active Emergencies */}
      <div className="section">
        <h2>Active Emergencies</h2>
        <div className="emergencies-list">
          {activeEmergencies.length === 0 ? (
            <div className="empty-state">
              <p>No active emergencies</p>
            </div>
          ) : (
            activeEmergencies.map(emergency => (
              <div key={emergency._id} className="emergency-card">
                <div className="emergency-header">
                  <span className={`severity-badge ${getSeverityClass(emergency.severity)}`}>
                    Severity: {emergency.severity}
                  </span>
                  <span className={`status-badge ${getStatusBadge(emergency.status)}`}>
                    {emergency.status}
                  </span>
                  {/* <span className={`status-badge ${getStatusBadge(emergency.status)}`}>
                    {emergency.status}
                  </span> */}
                </div>

                <div className="emergency-details">
                  <div className="detail-row hello">
                    <span className="label">Location:</span>
                    <span className="value">{emergency.patientLocation}</span>
                  </div>

                  {emergency.patientInfo?.name && (
                    <div className="detail-row">
                      <span className="label">Patient:</span>
                      <span className="value">{emergency.patientInfo.name}</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="label">Description:</span>
                    <span className="value">{emergency.description}</span>
                  </div>

                  {emergency.assignedAmbulanceId && (
                    <div className="detail-row">
                      <span className="label">Ambulance:</span>
                      <span className="value">
                        {emergency.assignedAmbulanceId.ambulanceNumber || 'Assigned'}
                      </span>
                    </div>
                  )}

                  {emergency.estimatedArrival && (
                    <div className="detail-row">
                      <span className="label">ETA:</span>
                      <span className="value">{emergency.estimatedArrival} minutes</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="label">Time:</span>
                    <span className="value">
                      {new Date(emergency.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ambulances Status */}
      <div className="section">
        <h2>Ambulances</h2>
        <div className="ambulances-grid">
          {ambulances.map(ambulance => (
            <div key={ambulance._id} className={`ambulance-card ${ambulance.status.toLowerCase()}`}>
              <div className="ambulance-header">
                <h3>{ambulance.ambulanceNumber}</h3>
                <span className={`status-indicator ${ambulance.status.toLowerCase()}`}>
                  {ambulance.status}
                </span>
              </div>

              <div className="ambulance-info">
                <div className="info-item">
                  <span className="icon">📍</span>
                  <span>Location: {ambulance.currentLocation}</span>
                </div>

                {ambulance.driver && (
                  <div className="info-item">
                    <span className="icon">👨‍⚕️</span>
                    <span>{ambulance.driver.name}</span>
                  </div>
                )}

                {ambulance.hospitalId && (
                  <div className="info-item">
                    <span className="icon">🏥</span>
                    <span>{ambulance.hospitalId.name || 'Hospital'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
