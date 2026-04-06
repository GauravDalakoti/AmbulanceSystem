import React, { useState, useEffect } from 'react';
import { ambulanceAPI, hospitalAPI, graphAPI } from '../services/api';
import './AdminPanel.css';
import Dashboard from './Dashboard';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('ambulances');
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [ambulanceForm, setAmbulanceForm] = useState({
    ambulanceNumber: '',
    currentLocation: '',
    status: 'AVAILABLE',
    hospitalId: '',
    driver: { name: '', phone: '' }
  });

  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    location: '',
    address: '',
    capacity: { total: 100, available: 100, icu: 20, emergency: 30 },
    contact: { phone: '', email: '', emergencyHotline: '911' },
    coordinates: { lat: 40.7505, lng: -73.9934 }
  });

  const [graphNodeForm, setGraphNodeForm] = useState({
    nodeId: '',
    name: '',
    type: 'junction',
    coordinates: { lat: 40.7505, lng: -73.9934 }
  });

  const [graphEdgeForm, setGraphEdgeForm] = useState({
    from: '',
    to: '',
    weight: 1
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'ambulances') {
        const res = await ambulanceAPI.getAll();
        setAmbulances(res.data);
      } else if (activeTab === 'hospitals') {
        const res = await hospitalAPI.getAll();
        setHospitals(res.data);
      } else if (activeTab === 'graph') {
        const res = await graphAPI.get();
        setGraphData(res.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAddAmbulance = async (e) => {
    e.preventDefault();
    try {
      await ambulanceAPI.create(ambulanceForm);
      alert('Ambulance added successfully!');
      setShowAddModal(false);
      resetAmbulanceForm();
      loadData();
    } catch (error) {
      alert('Error adding ambulance: ' + error.message);
    }
  };

  const handleAddHospital = async (e) => {
    e.preventDefault();
    try {
      await hospitalAPI.create(hospitalForm);
      alert('Hospital added successfully!');
      setShowAddModal(false);
      resetHospitalForm();
      loadData();
    } catch (error) {
      alert('Error adding hospital: ' + error.message);
    }
  };

  const handleAddGraphNode = async (e) => {
    e.preventDefault();
    try {
      await graphAPI.addNode(graphNodeForm);
      alert('Node added successfully!');
      resetGraphNodeForm();
      loadData();
    } catch (error) {
      alert('Error adding node: ' + error.message);
    }
  };

  const handleAddGraphEdge = async (e) => {
    e.preventDefault();
    try {
      await graphAPI.addEdge(graphEdgeForm);
      alert('Edge added successfully!');
      resetGraphEdgeForm();
      loadData();
    } catch (error) {
      alert('Error adding edge: ' + error.message);
    }
  };

  const handleDeleteAmbulance = async (id) => {
    if (window.confirm('Are you sure you want to delete this ambulance?')) {
      try {
        await ambulanceAPI.delete(id);
        alert('Ambulance deleted successfully!');
        loadData();
      } catch (error) {
        alert('Error deleting ambulance: ' + error.message);
      }
    }
  };

  const handleDeleteHospital = async (id) => {
    if (window.confirm('Are you sure you want to delete this hospital?')) {
      try {
        await hospitalAPI.delete(id);
        alert('Hospital deleted successfully!');
        loadData();
      } catch (error) {
        alert('Error deleting hospital: ' + error.message);
      }
    }
  };

  const resetAmbulanceForm = () => {
    setAmbulanceForm({
      ambulanceNumber: '',
      currentLocation: '',
      status: 'AVAILABLE',
      hospitalId: '',
      driver: { name: '', phone: '' }
    });
  };

  const resetHospitalForm = () => {
    setHospitalForm({
      name: '',
      location: '',
      address: '',
      capacity: { total: 100, available: 100, icu: 20, emergency: 30 },
      contact: { phone: '', email: '', emergencyHotline: '911' },
      coordinates: { lat: 40.7505, lng: -73.9934 }
    });
  };

  const resetGraphNodeForm = () => {
    setGraphNodeForm({
      nodeId: '',
      name: '',
      type: 'junction',
      coordinates: { lat: 40.7505, lng: -73.9934 }
    });
  };

  const resetGraphEdgeForm = () => {
    setGraphEdgeForm({
      from: '',
      to: '',
      weight: 1
    });
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>⚙️ Admin Panel</h1>
      </div>

      <Dashboard />
      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'ambulances' ? 'active' : ''}`}
          onClick={() => setActiveTab('ambulances')}
        >
          🚑 Ambulances
        </button>
        <button
          className={`tab ${activeTab === 'hospitals' ? 'active' : ''}`}
          onClick={() => setActiveTab('hospitals')}
        >
          🏥 Hospitals
        </button>
        <button
          className={`tab ${activeTab === 'graph' ? 'active' : ''}`}
          onClick={() => setActiveTab('graph')}
        >
          🗺️ City Graph
        </button>

      </div>

      <div className="admin-content">
        {/* AMBULANCES TAB */}
        {activeTab === 'ambulances' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Manage Ambulances</h2>
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                + Add Ambulance
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Driver</th>
                    <th>Hospital</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ambulances.map(amb => (
                    <tr key={amb._id}>
                      <td>{amb.ambulanceNumber}</td>
                      <td>{amb.currentLocation}</td>
                      <td>
                        <span className={`status-badge ${amb.status.toLowerCase()}`}>
                          {amb.status}
                        </span>
                      </td>
                      <td>{amb.driver?.name || 'N/A'}</td>
                      <td>{amb.hospitalId?.name || 'N/A'}</td>
                      <td>
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => handleDeleteAmbulance(amb._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showAddModal && (
              <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Add New Ambulance</h2>
                    <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
                  </div>
                  <form onSubmit={handleAddAmbulance}>
                    <div className="form-group">
                      <label>Ambulance Number *</label>
                      <input
                        type="text"
                        required
                        value={ambulanceForm.ambulanceNumber}
                        onChange={(e) => setAmbulanceForm({ ...ambulanceForm, ambulanceNumber: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Current Location (Node ID) *</label>
                      <input
                        type="text"
                        required
                        value={ambulanceForm.currentLocation}
                        onChange={(e) => setAmbulanceForm({ ...ambulanceForm, currentLocation: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={ambulanceForm.status}
                        onChange={(e) => setAmbulanceForm({ ...ambulanceForm, status: e.target.value })}
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="BUSY">BUSY</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Driver Name</label>
                      <input
                        type="text"
                        value={ambulanceForm.driver.name}
                        onChange={(e) => setAmbulanceForm({
                          ...ambulanceForm,
                          driver: { ...ambulanceForm.driver, name: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Driver Phone</label>
                      <input
                        type="text"
                        value={ambulanceForm.driver.phone}
                        onChange={(e) => setAmbulanceForm({
                          ...ambulanceForm,
                          driver: { ...ambulanceForm.driver, phone: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">Add Ambulance</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HOSPITALS TAB */}
        {activeTab === 'hospitals' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Manage Hospitals</h2>
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                + Add Hospital
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Address</th>
                    <th>Capacity</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map(hospital => (
                    <tr key={hospital._id}>
                      <td>{hospital.name}</td>
                      <td>{hospital.location}</td>
                      <td>{hospital.address}</td>
                      <td>{hospital.capacity?.available}/{hospital.capacity?.total}</td>
                      <td>{hospital.contact?.phone || 'N/A'}</td>
                      <td>
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => handleDeleteHospital(hospital._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showAddModal && (
              <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Add New Hospital</h2>
                    <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
                  </div>
                  <form onSubmit={handleAddHospital}>
                    <div className="form-group">
                      <label>Hospital Name *</label>
                      <input
                        type="text"
                        required
                        value={hospitalForm.name}
                        onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Location (Node ID) *</label>
                      <input
                        type="text"
                        required
                        value={hospitalForm.location}
                        onChange={(e) => setHospitalForm({ ...hospitalForm, location: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>coordinates *</label>
                      <input
                        type="text"
                        required
                        value={hospitalForm.coordinates}
                        onChange={(e) => setHospitalForm({ ...hospitalForm, coordinates: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Address *</label>
                      <input
                        type="text"
                        required
                        value={hospitalForm.address}
                        onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        value={hospitalForm.contact.phone}
                        onChange={(e) => setHospitalForm({
                          ...hospitalForm,
                          contact: { ...hospitalForm.contact, phone: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">Add Hospital</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* GRAPH TAB */}
        {activeTab === 'graph' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>City Graph Management</h2>
            </div>

            {graphData && (
              <div className="graph-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Nodes:</span>
                  <span className="stat-value">{Object.keys(graphData.nodes || {}).length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Edges:</span>
                  <span className="stat-value">{graphData.metadata?.totalEdges || 0}</span>
                </div>
              </div>
            )}

            <div className="graph-forms">
              {/* Add Node Form */}
              <div className="form-card">
                <h3>Add Node</h3>
                <form onSubmit={handleAddGraphNode}>
                  <div className="form-group">
                    <label>Node ID *</label>
                    <input
                      type="text"
                      required
                      value={graphNodeForm.nodeId}
                      onChange={(e) => setGraphNodeForm({ ...graphNodeForm, nodeId: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      required
                      value={graphNodeForm.name}
                      onChange={(e) => setGraphNodeForm({ ...graphNodeForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={graphNodeForm.type}
                      onChange={(e) => setGraphNodeForm({ ...graphNodeForm, type: e.target.value })}
                    >
                      <option value="junction">Junction</option>
                      <option value="hospital">Hospital</option>
                      <option value="residential">Residential</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary">Add Node</button>
                </form>
              </div>

              {/* Add Edge Form */}
              <div className="form-card">
                <h3>Add Edge</h3>
                <form onSubmit={handleAddGraphEdge}>
                  <div className="form-group">
                    <label>From Node *</label>
                    <input
                      type="text"
                      required
                      value={graphEdgeForm.from}
                      onChange={(e) => setGraphEdgeForm({ ...graphEdgeForm, from: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>To Node *</label>
                    <input
                      type="text"
                      required
                      value={graphEdgeForm.to}
                      onChange={(e) => setGraphEdgeForm({ ...graphEdgeForm, to: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Weight (km) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={graphEdgeForm.weight}
                      onChange={(e) => setGraphEdgeForm({ ...graphEdgeForm, weight: parseFloat(e.target.value) })}
                    />
                  </div>
                  <button type="submit" className="btn-primary">Add Edge</button>
                </form>
              </div>
            </div>

            {/* Display Graph Nodes */}
            {graphData && graphData.nodes && (
              <div className="nodes-list">
                <h3>Graph Nodes</h3>
                <div className="nodes-grid">
                  {Object.entries(graphData.nodes).map(([nodeId, node]) => (
                    <div key={nodeId} className="node-card">
                      <div className="node-id">{nodeId}</div>
                      <div className="node-name">{node.name}</div>
                      <div className="node-type">{node.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
