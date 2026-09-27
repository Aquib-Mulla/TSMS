import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ======================================================
  // CHECK LOGIN STATUS
  // ======================================================

  const checkLoginStatus = () => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    setIsLoggedIn(!!user && !!token);
  };

  // ======================================================
  // CHECK LOGIN WHEN NAVBAR LOADS
  // ======================================================

  useEffect(() => {
    checkLoginStatus();

    // Detect login/logout changes
    window.addEventListener("authChange", checkLoginStatus);

    // Detect localStorage changes from another tab
    window.addEventListener("storage", checkLoginStatus);

    return () => {
      window.removeEventListener("authChange", checkLoginStatus);
      window.removeEventListener("storage", checkLoginStatus);
    };
  }, []);

  // ======================================================
  // CLOSE MOBILE MENU
  // ======================================================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {
    // Remove login information
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("touristId");

    // Update Navbar immediately
    setIsLoggedIn(false);

    // Close mobile menu
    setMenuOpen(false);

    // Notify other components
    window.dispatchEvent(new Event("authChange"));

    // Go to Home
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="nav-container">

        {/* ==================================================
            LOGO
        ================================================== */}

        <Link
          to="/"
          className="logo"
          onClick={closeMenu}
        >
          Tour<span>Safe</span>
        </Link>

        {/* ==================================================
            NAVIGATION LINKS
        ================================================== */}

        <nav className={`nav-links ${menuOpen ? "active" : ""}`}>

          <NavLink
            to="/"
            onClick={closeMenu}
          >
            Home
          </NavLink>

          <NavLink
            to="/Map"
            onClick={closeMenu}
          >
            Live Map
          </NavLink>

          <NavLink
            to="/geofence"
            onClick={closeMenu}
          >
            Accounts
          </NavLink>

          <NavLink
            to="/about"
            onClick={closeMenu}
          >
            About
          </NavLink>

          <NavLink
            to="/contact"
            onClick={closeMenu}
          >
            Contact
          </NavLink>

          {/* ==================================================
              MOBILE AUTH BUTTONS
          ================================================== */}

          <div className="mobile-auth">

            {/* Logged out */}
            {!isLoggedIn && (
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

            {/* Logged in */}
            {isLoggedIn && (
              <button
                type="button"
                className="login-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            )}

          </div>

        </nav>

        {/* ==================================================
            DESKTOP ACTIONS + MOBILE MENU
        ================================================== */}

        <div className="nav-actions">

          {/* ==================================================
              DESKTOP AUTH BUTTONS
          ================================================== */}

          {!isLoggedIn ? (
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
          ) : (
            <button
              type="button"
              className="login-btn desktop-only"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}

          {/* ==================================================
              MOBILE MENU BUTTON
          ================================================== */}

          <button
            type="button"
            className="menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
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