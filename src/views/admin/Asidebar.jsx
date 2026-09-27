import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import {
  LayoutDashboard,
  Users,
  MapPinned,
  Siren,
  ShieldAlert,
  FileWarning,
  LogOut,
  UserRound,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

const Asidebar = () => {
  const navigate = useNavigate();
  const [activeSOSCount, setActiveSOSCount] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/adminlogin", { replace: true });
  };

  // Fetch the current number of active SOS alerts.
  const fetchSOSCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/sos/alerts`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch SOS alerts");
      }

      const activeCount = (data.alerts || []).filter(
        (alert) => alert.status === "ACTIVE"
      ).length;

      setActiveSOSCount(activeCount);
    } catch (error) {
      console.error("SOS count error:", error);
    }
  }, []);

  // Load the count and listen for live SOS updates.
  useEffect(() => {
    fetchSOSCount();

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("sos:alert", (alert) => {
      if (alert.status === "ACTIVE") {
        // Refetch to avoid counting the same alert twice.
        fetchSOSCount();
      }
    });

    socket.on("sos:status", () => {
      // Refresh the count when an alert is acknowledged or resolved.
      fetchSOSCount();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchSOSCount]);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Tourists",
      path: "/admin/tourists",
      icon: Users,
    },
    {
      name: "Live Map",
      path: "/admin/livemap",
      icon: MapPinned,
    },
    {
      name: "SOS Alerts",
      path: "/admin/sos-alerts",
      icon: Siren,
    },
    {
      name: "Danger Zones",
      path: "/admin/danger-zones",
      icon: ShieldAlert,
    },
    {
      name: "Incidents",
      path: "/admin/incidents",
      icon: FileWarning,
    },
  ];

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShieldAlert size={25} />
        </div>

        <div>
          <h2>TourSafe</h2>
          <span>Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-title">MAIN MENU</p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={20} />

              <span className="sidebar-link-label">{item.name}</span>

              {item.name === "SOS Alerts" && activeSOSCount > 0 && (
                <span className="sidebar-sos-badge">
                  {activeSOSCount > 99 ? "99+" : activeSOSCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <NavLink
          to="/admin/profile"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <UserRound size={20} />
          <span className="sidebar-link-label">Profile</span>
        </NavLink>

        <button
          type="button"
          className="sidebar-link logout-link"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span className="sidebar-link-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Asidebar;