import React from "react";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleBookEmergency = () => {
        if (user) {
            navigate("/emergency");
        } else {
            navigate("/sign-in");
        }
    };

    return (
        <div className="home">

            {/* HERO */}
            <section className="hero">
                <div className="hero-content">
                    <h1>
                        Smart Emergency <span>Dispatch System</span>
                    </h1>
                    <p>
                        Real-time ambulance tracking, intelligent dispatch, and
                        faster response to save lives when every second matters.
                    </p>

                    <div className="hero-buttons">
                        <button className="primary-btn" onClick={handleBookEmergency}>
                            🚑 Get Started
                        </button>
                        <button className="secondary-btn" onClick={handleBookEmergency}>
                            Book Emergency
                        </button>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="features">
                <h2>Why Choose Our System</h2>

                <div className="feature-grid">

                    <div className="card">
                        <h3>📍 Live Tracking</h3>
                        <p>Track ambulance movement in real-time with map integration.</p>
                    </div>

                    <div className="card">
                        <h3>⚡ Fast Dispatch</h3>
                        <p>Automatically assigns the nearest available ambulance.</p>
                    </div>

                    <div className="card">
                        <h3>🧠 Smart Routing</h3>
                        <p>Optimized routes using shortest path algorithms.</p>
                    </div>

                    <div className="card">
                        <h3>📊 Dashboard</h3>
                        <p>Centralized control panel for monitoring emergencies.</p>
                    </div>

                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="how">
                <h2>How It Works</h2>

                <div className="steps">

                    <div className="step">
                        <span>01</span>
                        <p>Report emergency instantly</p>
                    </div>

                    <div className="step">
                        <span>02</span>
                        <p>Nearest ambulance assigned</p>
                    </div>

                    <div className="step">
                        <span>03</span>
                        <p>Driver navigates with live route</p>
                    </div>

                    <div className="step">
                        <span>04</span>
                        <p>Patient receives rapid care</p>
                    </div>

                </div>
            </section>

            {/* CTA */}
            <section className="cta">
                <h2>Need Immediate Help?</h2>
                <p>Our system ensures fastest emergency response.</p>

                <button className="danger-btn" onClick={handleBookEmergency}>
                    🚨 Request Ambulance Now
                </button>
            </section>

        </div>
    );
};

export default HomePage;