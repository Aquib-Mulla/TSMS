import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../style/auth.css";

const Login = () => {
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
      setError("Please enter your email and password.");
      return;
    }

    try {

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
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


      // Login failed
      if (!response.ok) {

        setError(
          data.message || "Invalid email or password."
        );

        return;
      }


      // Login successful
      console.log("Login successful:", data);


      // Store JWT token
      localStorage.setItem(
        "token",
        data.token
      );


      // Store logged-in user information
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );


      // Go to home page
      navigate("/");


    } catch (error) {

      console.error("Login Error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );

    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-header">
          <h1>TourSafe</h1>

          <h2>Welcome Back</h2>

          <p>
            Login to access the Smart Tourist Safety Monitoring System.
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
              Email Address
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <div className="password-label">
              <label htmlFor="password">
                Password
              </label>

              <Link to="/forgot-password">
                Forgot Password?
              </Link>
            </div>

            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="remember-me">
            <input
              type="checkbox"
              id="remember"
            />

            <label htmlFor="remember">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className="login-button"
          >
            Sign In
          </button>

        </form>

        <div className="register-link">
          Don't have an account?

          <Link to="/register">
            Register
          </Link>
        </div>

      </div>

    </div>
  );
};

export default Login;