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
  const [loading, setLoading] = useState(false);

  // ======================================================
  // BACKEND URL
  // ======================================================

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ======================================================
  // HANDLE INPUT
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
  };

  // ======================================================
  // LOGIN
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // ====================================================
    // VALIDATION
    // ====================================================

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      console.log(
        "Sending login request to:",
        `${API_URL}/api/auth/login`
      );

      // ==================================================
      // SEND LOGIN REQUEST
      // ==================================================

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
          }),
        }
      );

      // ==================================================
      // GET RESPONSE
      // ==================================================

      const data = await response.json();

      console.log("Login response:", data);

      // ==================================================
      // LOGIN FAILED
      // ==================================================

      if (!response.ok) {
        setError(
          data.message || "Invalid email or password."
        );

        return;
      }

      // ==================================================
      // CHECK USER INFORMATION
      // ==================================================

      if (!data.user || !data.user.id) {
        console.error(
          "Login response does not contain user ID:",
          data
        );

        setError(
          "Login successful, but user information is missing."
        );

        return;
      }

      // ==================================================
      // LOGIN SUCCESS
      // ==================================================

      console.log("Login successful");
      console.log("User ID:", data.user.id);
      console.log("Tourist ID:", data.user.tourist_id);

      // ==================================================
      // STORE JWT
      // ==================================================

      if (data.token) {
        localStorage.setItem(
          "token",
          data.token
        );
      }

      // ==================================================
      // STORE USER INFORMATION
      // ==================================================

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // ==================================================
      // IMPORTANT FOR LIVE LOCATION
      // ==================================================

      localStorage.setItem(
        "userId",
        String(data.user.id)
      );

      // Store Tourist ID too
      if (data.user.tourist_id) {
        localStorage.setItem(
          "touristId",
          data.user.tourist_id
        );
      }

      // ==================================================
      // VERIFY LOCAL STORAGE
      // ==================================================

      console.log(
        "Stored userId:",
        localStorage.getItem("userId")
      );

      console.log(
        "Stored touristId:",
        localStorage.getItem("touristId")
      );

      // ==================================================
      // GO TO HOME
      // ==================================================

      navigate("/");

    } catch (error) {
      console.error("Login Error:", error);

      setError(
        `Unable to connect to the server at ${API_URL}.`
      );

    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // UI
  // ======================================================

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

          {/* EMAIL */}

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

          {/* PASSWORD */}

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
              disabled={loading}
            />

          </div>

          {/* REMEMBER ME */}

          <div className="remember-me">

            <input
              type="checkbox"
              id="remember"
            />

            <label htmlFor="remember">
              Remember me
            </label>

          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </form>

        {/* REGISTER */}

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