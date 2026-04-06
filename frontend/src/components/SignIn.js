import React, { useState } from "react";
import "./Auth.css";
import { userApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const SignIn = () => {
    const navigate = useNavigate();

    const { login } = useAuth()

    const [formData, setFormData] = useState({
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
            const response = await userApi.login(formData);

            const  loggedInUser  = response.data;
    
            login(loggedInUser);

            toast.success("Signed in successfully");

            if (loggedInUser.role === "admin") {
                navigate("/admin");
            } else if (loggedInUser.role === "driver") {
                navigate("/driver-dashboard");
            }
            else {
                navigate("/user-dashboard");
            }

        } catch (err) {
            toast.error("Error while login")
            setError("Invalid email or password");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-left">
                <h1> HALDWANI DISPATCH</h1>
                <p> Login Portal</p>
            </div>

            <div className="auth-right">
                <div className="auth-card">
                    <h2 className="heading">Sign In</h2>

                    {error && <p className="error">{error}</p>}

                    <form onSubmit={handleSubmit}>
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
                            Sign In
                        </button>
                    </form>

                    <div className="switch-link">
                        Don't have an account?
                        <span onClick={() => navigate("/sign-up")}>
                            Create Account
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignIn;