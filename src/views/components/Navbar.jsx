
import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  // Check whether user is logged in
  const isLoggedIn =
    localStorage.getItem("token") &&
    localStorage.getItem("user");

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Logout function
  const handleLogout = () => {
    // Remove login information
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("touristId");

    // Close mobile menu
    setMenuOpen(false);

    // Go to login page
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="nav-container">

        {/* Logo */}
        <Link
          to="/"
          className="logo"
          onClick={closeMenu}
        >
          Tour<span>Safe</span>
        </Link>

        {/* Navigation Links */}
        <nav
          className={`nav-links ${
            menuOpen ? "active" : ""
          }`}
        >

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

          {/* Mobile Authentication */}
          <div className="mobile-auth">

            {isLoggedIn ? (
              <button
                className="login-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : (
              <>
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
              </>
            )}

          </div>

        </nav>

        {/* Desktop Actions + Mobile Menu */}
        <div className="nav-actions">

          {isLoggedIn ? (
            <button
              className="login-btn desktop-only"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <>
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
            </>
          )}

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
