import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../style/auth.css";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please enter your admin email and password.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Invalid admin email or password."
        );

        return;
      }

      console.log("Admin login successful:", data);

      localStorage.setItem(
        "adminToken",
        data.token
      );

      localStorage.setItem(
        "admin",
        JSON.stringify(data.admin)
      );

      navigate("/admin/dashboard");

    } catch (error) {
      console.error("Admin Login Error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    }
  };

  return (
    <div className="login-page">

      <div className="login-card admin-login-card">

        <div className="login-header">

          <h1>TourSafe Admin</h1>

          <div className="admin-badge">
            ADMINISTRATOR ACCESS
          </div>

          <h2>Admin Login</h2>

          <p>
            Login to access the TourSafe
            Smart Tourist Safety Monitoring System.
          </p>

        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label htmlFor="email">
              Admin Email Address
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter admin email address"
              value={formData.email}
              onChange={handleChange}
            />

          </div>

          <div className="form-group">

            <div className="password-label">

              <label htmlFor="password">
                Password
              </label>

              <Link to="/admin/forgot-password">
                Forgot Password?
              </Link>

            </div>

            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter admin password"
              value={formData.password}
              onChange={handleChange}
            />

          </div>

          <div className="remember-me">

            <input
              type="checkbox"
              id="adminRemember"
            />

            <label htmlFor="adminRemember">
              Remember me
            </label>

          </div>

          <button
            type="submit"
            className="login-button"
          >
            Sign In as Admin
          </button>

        </form>

        <div className="admin-login-footer">
          Authorized administrators only.
        </div>

      </div>

    </div>
  );
};

export default AdminLogin;
