import React, { useState } from "react";
import "./Auth.css";
import { userApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
    const navigate = useNavigate();

    // const { login } = useAuth()

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await userApi.register(formData);
            navigate("/sign-in");
        } catch (err) {
            setError("Registration failed");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-left">
                <h1> HALDWANI DISPATCH</h1>
                <p>Create Account</p>
            </div>

            <div className="auth-right">
                <div className="auth-card">
                    <h2 className="heading">Sign Up</h2>

                    {error && <p className="error">{error}</p>}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <input
                                type="text"
                                name="username"
                                placeholder="Full Name"
                                value={formData.username}
                                required
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                placeholder="Email Address"
                                required
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                placeholder="Password"
                                required
                                onChange={handleChange}
                            />
                        </div>

                        <button type="submit" className="auth-btn">
                            Create Account
                        </button>
                    </form>

                    <div className="switch-link">
                        Already have an account?
                        <span onClick={() => navigate("/sign-in")}>
                            Sign In
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;