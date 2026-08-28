import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";


const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="nav-container">

        {/* Logo */}
        <Link to="/" className="logo" onClick={closeMenu}>
          Tour<span>Safe</span>
        </Link>

        {/* Navigation Links */}
        <nav className={`nav-links ${menuOpen ? "active" : ""}`}>

          <NavLink to="/" onClick={closeMenu}>
            Home
          </NavLink>

          <NavLink to="/Map" onClick={closeMenu}>
            Live Map
          </NavLink>

          <NavLink to="/geofence" onClick={closeMenu}>
            Accounts
          </NavLink>

          <NavLink to="/about" onClick={closeMenu}>
            About
          </NavLink>

          <NavLink to="/contact" onClick={closeMenu}>
            Contact
          </NavLink>

          {/* Mobile Buttons */}
          <div className="mobile-auth">
            <Link
              to="/login"
              className="login-btn"
              onClick={closeMenu}
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="register-btn"
              onClick={closeMenu}
            >
              Register
            </Link>
          </div>

        </nav>

        {/* Desktop Actions + Mobile Menu */}
        <div className="nav-actions">

          <Link
            to="/login"
            className="login-btn desktop-only"
          >
            Sign In
          </Link>

          <Link
            to="/register"
            className="register-btn desktop-only"
          >
            Register
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

        </div>

      </div>
    </header>
  );
};

export default Navbar;