import React from "react";
import { Link } from "react-router-dom";
import "../../style/style.css";

const Footer = () => {
  return (
    <footer className="footer">

      {/* ================= FOOTER TOP ================= */}
      <div className="footer-top">

        {/* ================= BRAND ================= */}
        <div className="footer-brand">

          <Link to="/" className="logo">
            Tour<span>Safe</span>
          </Link>

          <p>
            Smart technology for safer tourism and better
            emergency response.
          </p>

          <div className="footer-status">
            <span className="footer-status-dot"></span>
            <span>Safety monitoring system</span>
          </div>

        </div>


        {/* ================= FOOTER LINKS ================= */}
        <div className="footer-links">

          {/* PLATFORM */}
          <div className="footer-column">

            <h4>Platform</h4>

            <Link to="/">
              Home
            </Link>

            <Link to="/map">
              Live Map
            </Link>

            <Link to="/geofence">
              Safety Zones
            </Link>

          </div>


          {/* COMPANY */}
          <div className="footer-column">

            <h4>Company</h4>

            <Link to="/about">
              About
            </Link>

            <Link to="/contact">
              Contact
            </Link>

          </div>


          {/* ACCOUNT */}
          <div className="footer-column">

            <h4>Account</h4>

            <Link to="/login">
              Sign In
            </Link>

            <Link to="/register">
              Register
            </Link>

          </div>

        </div>

      </div>


      {/* ================= FOOTER BOTTOM ================= */}
      <div className="footer-bottom">

        <p>
          © 2026 TourSafe. Smart Tourist Safety Monitoring System.
        </p>

        <p>
          Built for safer journeys.
        </p>

      </div>

    </footer>
  );
};

export default Footer;