import React from "react";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth()
    const handleBookEmergency = () => {
        // const token = document.cookie.includes("accessToken");

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
                <h1>🚑 Smart Emergency Dispatch System</h1>
                <p>
                    Real-time ambulance tracking, AI powered dispatch,
                    and faster emergency response to save lives.
                </p>


                <button className="primary-btn" onClick={handleBookEmergency}>
                    Get Started
                </button>
                <button className="primary-btn" onClick={handleBookEmergency}>
                    Book Emergency
                </button>

            </section>

            {/* FEATURES */}
            <section className="features">

                <h2>Why Use Our System</h2>

                <div className="feature-grid">

                    <div className="card">
                        <h3>📍 Live Tracking</h3>
                        <p>Track ambulance movement in real time on map.</p>
                    </div>

                    <div className="card">
                        <h3>⚡ Fast Dispatch</h3>
                        <p>Nearest ambulance assigned automatically.</p>
                    </div>

                    <div className="card">
                        <h3>🧠 Smart Routing</h3>
                        <p>Optimized routes reduce response time.</p>
                    </div>

                    <div className="card">
                        <h3>📊 Command Dashboard</h3>
                        <p>Monitor emergencies and fleet in one place.</p>
                    </div>

                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="how">

                <h2>How It Works</h2>

                <div className="steps">

                    <div className="step">
                        <span>1</span>
                        <p>Report emergency instantly</p>
                    </div>

                    <div className="step">
                        <span>2</span>
                        <p>System assigns nearest ambulance</p>
                    </div>

                    <div className="step">
                        <span>3</span>
                        <p>Driver navigates with live route</p>
                    </div>

                    <div className="step">
                        <span>4</span>
                        <p>Patient receives rapid care</p>
                    </div>

                </div>

            </section>

            {/* CTA */}
            <section className="cta">
                <h2>Need Immediate Help?</h2>
                <button className="danger-btn" onClick={handleBookEmergency}>
                    🚨 Request Ambulance Now
                </button>
            </section>

        </div>
    );
};

export default HomePage;

