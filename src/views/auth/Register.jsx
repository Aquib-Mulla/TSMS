import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../style/auth.css";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Backend URL from .env
  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Check all fields
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.mobile.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    // Check password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Check password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Check API URL
    if (!API_URL) {
      console.error("VITE_API_URL is missing in .env");
      setError("Server configuration is missing.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            full_name: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.mobile.trim(),
            password: formData.password,
          }),
        }
      );

      // Get response
      const data = await response.json();

      console.log("Server response:", data);

      // Server returned an error
      if (!response.ok) {
        setError(
          data.message || "Registration failed. Please try again."
        );
        return;
      }

      // Registration successful
      console.log("Registration successful:", data);

      alert("Registration successful!");

      navigate("/login");

    } catch (error) {
      console.error("Registration Error:", error);

      setError(
        "Unable to connect to the server. Please check your internet connection and try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      <div className="register-card">

        {/* Header */}
        <div className="register-header">

          <h1>TourSafe</h1>

          <h2>Create Account</h2>

          <p>
            Register to access the Smart Tourist Safety
            Monitoring System.
          </p>

        </div>

        {/* Error */}
        {error && (
          <div className="register-error">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>

          {/* Full Name */}
          <div className="form-group">

            <label htmlFor="fullName">
              Full Name
            </label>

            <input
              id="fullName"
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              disabled={loading}
            />

          </div>

          {/* Email */}
          <div className="form-group">

            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />

          </div>

          {/* Mobile */}
          <div className="form-group">

            <label htmlFor="mobile">
              Mobile Number
            </label>

            <input
              id="mobile"
              type="tel"
              name="mobile"
              placeholder="Enter your mobile number"
              value={formData.mobile}
              onChange={handleChange}
              disabled={loading}
            />

          </div>

          {/* Password */}
          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />

          </div>

          {/* Confirm Password */}
          <div className="form-group">

            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />

          </div>

          {/* Terms */}
          <div className="terms">

            <input
              type="checkbox"
              id="terms"
              required
              disabled={loading}
            />

            <label htmlFor="terms">
              I agree to the Terms & Conditions and Privacy Policy.
            </label>

          </div>

          {/* Submit */}
          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        {/* Login */}
        <div className="login-link">

          <span>Already have an account? </span>

          <Link to="/login">
            Login
          </Link>

        </div>

      </div>

    </div>
  );
};

export default Register;