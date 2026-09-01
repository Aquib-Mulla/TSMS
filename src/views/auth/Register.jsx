import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../style/auth.css";

const Register = () => {

  const navigate = useNavigate();

  // ======================================================
  // FORM DATA
  // ======================================================

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });


  // ======================================================
  // STATES
  // ======================================================

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touristId, setTouristId] = useState("");


  // ======================================================
  // BACKEND URL
  // ======================================================

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";


  // ======================================================
  // HANDLE INPUT CHANGE
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
  // HANDLE REGISTER
  // ======================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");


    // ====================================================
    // VALIDATION
    // ====================================================

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


    // ====================================================
    // PASSWORD LENGTH
    // ====================================================

    if (formData.password.length < 6) {

      setError(
        "Password must be at least 6 characters."
      );

      return;

    }


    // ====================================================
    // PASSWORD MATCH
    // ====================================================

    if (
      formData.password !==
      formData.confirmPassword
    ) {

      setError("Passwords do not match.");

      return;

    }


    try {

      setLoading(true);


      console.log(
        "Sending registration request to:",
        `${API_URL}/api/auth/register`
      );


      // ==================================================
      // SEND REQUEST TO BACKEND
      // ==================================================

      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {

          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({

            full_name:
              formData.fullName.trim(),

            email:
              formData.email.trim(),

            phone:
              formData.mobile.trim(),

            password:
              formData.password,

          }),

        }
      );


      // ==================================================
      // GET SERVER RESPONSE
      // ==================================================

      const data = await response.json();


      console.log(
        "Registration response:",
        data
      );


      // ==================================================
      // SERVER ERROR
      // ==================================================

      if (!response.ok) {

        setError(
          data.message ||
          "Registration failed. Please try again."
        );

        return;

      }


      // ==================================================
      // SUCCESS
      // ==================================================

      if (data.success) {

        console.log(
          "Tourist ID:",
          data.touristId
        );


        // Save Tourist ID in state
        setTouristId(data.touristId);


        // Optional: save user information
        localStorage.setItem(
          "touristId",
          data.touristId
        );

        localStorage.setItem(
          "userId",
          data.userId
        );


        // Clear form
        setFormData({
          fullName: "",
          email: "",
          mobile: "",
          password: "",
          confirmPassword: "",
        });

      }

    } catch (error) {

      console.error(
        "Registration Error:",
        error
      );


      // ==================================================
      // CONNECTION ERROR
      // ==================================================

      setError(
        `Unable to connect to the server at ${API_URL}. Make sure the backend is running.`
      );

    } finally {

      setLoading(false);

    }

  };


  // ======================================================
  // SUCCESS SCREEN
  // ======================================================

  if (touristId) {

    return (

      <div className="register-page">

        <div className="register-card">

          <div className="register-header">

            <h1>TourSafe</h1>

            <h2>Registration Successful</h2>

            <p>
              Your account has been created successfully.
            </p>

          </div>


          {/* TOURIST ID */}

          <div
            style={{
              textAlign: "center",
              padding: "25px",
              margin: "20px 0",
              borderRadius: "10px",
              background: "#f0fdfa",
              border: "1px solid #0f766e",
            }}
          >

            <p
              style={{
                marginBottom: "10px",
                fontSize: "14px",
                color: "#555",
              }}
            >
              Your Tourist ID
            </p>


            <h2
              style={{
                margin: "0",
                color: "#0f766e",
                fontSize: "30px",
                letterSpacing: "2px",
              }}
            >
              {touristId}
            </h2>


            <p
              style={{
                marginTop: "12px",
                fontSize: "13px",
                color: "#555",
              }}
            >
              Please remember this ID.
              <br />
              It will be used to identify and track
              your TourSafe account.
            </p>

          </div>


          {/* LOGIN BUTTON */}

          <button
            type="button"
            className="register-button"
            onClick={() => navigate("/login")}
          >
            Continue to Login
          </button>

        </div>

      </div>

    );

  }


  // ======================================================
  // REGISTRATION FORM
  // ======================================================

  return (

    <div className="register-page">

      <div className="register-card">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="register-header">

          <h1>TourSafe</h1>

          <h2>Create Account</h2>

          <p>
            Register to access the Smart Tourist Safety
            Monitoring System.
          </p>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="register-error">

            {error}

          </div>

        )}


        {/* =================================================
            FORM
        ================================================= */}

        <form onSubmit={handleSubmit}>


          {/* FULL NAME */}

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


          {/* MOBILE */}

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


          {/* PASSWORD */}

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


          {/* CONFIRM PASSWORD */}

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


          {/* TERMS */}

          <div className="terms">

            <input
              type="checkbox"
              id="terms"
              required
              disabled={loading}
            />

            <label htmlFor="terms">
              I agree to the Terms & Conditions
              and Privacy Policy.
            </label>

          </div>


          {/* SUBMIT */}

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >

            {loading
              ? "Creating Account..."
              : "Create Account"}

          </button>

        </form>


        {/* =================================================
            LOGIN
        ================================================= */}

        <div className="login-link">

          <span>
            Already have an account?{" "}
          </span>

          <Link to="/login">
            Login
          </Link>

        </div>

      </div>

    </div>

  );

};

export default Register;
