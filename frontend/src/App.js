import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// import Dashboard from './components/Dashboard';
import LiveMap from './components/LiveMap';
import AdminPanel from './components/AdminPanel';
import EmergencyForm from './components/EmergencyForm';
import './App.css';
import DriverDashboard from './components/DriverDashboard';
import SignIn from './components/SignIn';
import { LogIn, LogOutIcon } from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Signup from './components/Signup';
import { Toaster } from "react-hot-toast";
import toast from 'react-hot-toast';
import { userApi } from './services/api';
import HomePage from './components/HomePage';
// import { Home } from 'lucide-react';

function App() {

  const { user, logout } = useAuth()

  // const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await userApi.logout();
      logout();
      toast.success("Logout successfully");
      // navigate("/sign-in");

    } catch {
      toast.error("Error while logging out");
    }
  };
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-brand">
              <span className="brand-icon">🚑</span>
              <span className="brand-text">Emergency Dispatch System</span>
            </div>

            <div className="nav-links">
              {/* <Link to="/dashboard" className="nav-link">
                <span className="nav-icon">📊</span>
                Dashboard
              </Link> */}
              <Link to="/" className="nav-link">
                <span className="nav-icon">📊</span>
                Home
              </Link>
              <Link to="/map" className="nav-link">
                <span className="nav-icon">🗺️</span>
                Live Map
              </Link>
              <Link to="/emergency" className="nav-link">
                <span className="nav-icon">🚨</span>
                New Emergency
              </Link>
              {
                user?.role === "driver" &&

                <Link to="/driver-dashboard" className="nav-link">
                  <span className="nav-icon">🚨</span>
                  Driver Dashboard
                </Link>

              }

              {
                user?.role === "admin" &&

                <Link to="/admin" className="nav-link">
                  <span className="nav-icon">⚙️</span>
                  Admin Dashboard
                </Link>
              }

              {user ? <button id="logout" onClick={handleLogout}>
                <LogOutIcon size={"18"} />
                <p>logout</p>
              </button> :
                <Link to="/sign-in" className="nav-link">
                  <LogIn />
                  get started
                </Link>

              }

            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            {/* <Route path="/" element={<Navigate to="/dashboard" replace />} /> */}
            <Route path="/" element={<HomePage />} />

            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
            <Route path="/map" element={<LiveMap />} />
            <Route path="/emergency" element={<EmergencyForm />} />
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />
            <Route path="/driver-dashboard" element={<ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<Signup />} />
          </Routes>
          <Toaster toastOptions={{ duration: 3000 }} />
        </main>

        <footer className="footer">
  <div className="footer-container">

    <div className="footer-left">
      <h3>🚑 Emergency Dispatch System</h3>
      <p>
        Real-time ambulance dispatch platform built with modern web technologies
        and optimized routing using Dijkstra's Algorithm.
      </p>
    </div>

    <div className="footer-tech">
      <span className="tech-badge">React</span>
      <span className="tech-badge">Node.js</span>
      <span className="tech-badge">Express</span>
      <span className="tech-badge">MongoDB</span>
      <span className="tech-badge">Socket.IO</span>
      <span className="tech-badge">Leaflet</span>
    </div>

  </div>

  <div className="footer-bottom">
    © 2025 Emergency Ambulance Dispatch System
  </div>
</footer>
      </div>
    </Router>
  );
}

export default App;
