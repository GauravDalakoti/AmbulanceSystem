import React, { useState } from 'react';
import { emergencyAPI } from '../services/api';
import './EmergencyForm.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EmergencyForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    patientLocation: '',
    patientInfo: {
      name: '',
      age: '',
      gender: 'Male',
      phone: ''
    },
    severity: 3,
    description: '',
    symptoms: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate("/sign-in")
    }

    setSubmitting(true);

    try {
      // Convert symptoms string to array
      const symptoms = formData.symptoms
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const emergencyData = {
        ...formData,
        symptoms,
        patientInfo: {
          ...formData.patientInfo,
          age: parseInt(formData.patientInfo.age) || 0
        }
      };

      const response = await emergencyAPI.create(emergencyData);

      if (response.data.success) {
        alert('Emergency request created successfully! Ambulance assigned.');
        resetForm();
        if (onSuccess) onSuccess(response.data);
      } else {
        alert(response.data.message || 'No ambulances available at the moment');
      }
    } catch (error) {
      alert('Error creating emergency request: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patientLocation: '',
      patientInfo: {
        name: '',
        age: '',
        gender: 'Male',
        phone: ''
      },
      severity: 3,
      description: '',
      symptoms: ''
    });
  };

  return (
    <div className="emergency-form-container">
      <div className="form-header">
        <h2>🚨 New Emergency Request</h2>
        <p>Fill in the details to request an ambulance</p>
      </div>

      <form onSubmit={handleSubmit} className="emergency-form">
        <div className="form-section">
          <h3>Location Information</h3>
          <div className="form-group">
            <label>Patient Location (Node ID) *</label>
            <input
              type="text"
              required
              value={formData.patientLocation}
              onChange={(e) => setFormData({ ...formData, patientLocation: e.target.value })}
              placeholder="e.g., A, B, C"
            />
            <small>Enter the node ID from the city graph</small>
          </div>
        </div>

        <div className="form-section">
          <h3>Patient Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Patient Name</label>
              <input
                type="text"
                value={formData.patientInfo.name}
                onChange={(e) => setFormData({
                  ...formData,
                  patientInfo: { ...formData.patientInfo, name: e.target.value }
                })}
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                value={formData.patientInfo.age}
                onChange={(e) => setFormData({
                  ...formData,
                  patientInfo: { ...formData.patientInfo, age: e.target.value }
                })}
                placeholder="30"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender</label>
              <select
                value={formData.patientInfo.gender}
                onChange={(e) => setFormData({
                  ...formData,
                  patientInfo: { ...formData.patientInfo, gender: e.target.value }
                })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Contact Phone</label>
              <input
                type="tel"
                value={formData.patientInfo.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  patientInfo: { ...formData.patientInfo, phone: e.target.value }
                })}
                placeholder="+1-555-0100"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Emergency Details</h3>
          <div className="form-group">
            <label>Severity Level * ({formData.severity}/5)</label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) })}
              className="severity-slider"
            />
            <div className="severity-labels">
              <span className={formData.severity === 1 ? 'active' : ''}>Minor</span>
              <span className={formData.severity === 2 ? 'active' : ''}>Low</span>
              <span className={formData.severity === 3 ? 'active' : ''}>Moderate</span>
              <span className={formData.severity === 4 ? 'active' : ''}>High</span>
              <span className={formData.severity === 5 ? 'active' : ''}>Critical</span>
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the emergency situation..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Symptoms (comma-separated)</label>
            <input
              type="text"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              placeholder="Chest pain, difficulty breathing, dizziness"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={resetForm} className="btn-secondary">
            Clear Form
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Requesting Ambulance...' : '🚑 Request Ambulance'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmergencyForm;
