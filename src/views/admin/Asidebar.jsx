import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  MapPinned,
  Siren,
  ShieldAlert,
  Map,
  FileWarning,
  LogOut,
  Bell,
  UserRound,
  Activity,
} from "lucide-react";

const Asidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/admin/login", { replace: true });
  };

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
      path: "/admin/sos",
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

        <p className="sidebar-section-title">
          MAIN MENU
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">

        <NavLink
          to="/admin/profile"
          className={({ isActive }) =>
            `sidebar-link ${
              isActive ? "active" : ""
            }`
          }
        >
          <UserRound size={20} />
          <span>Profile</span>
        </NavLink>

        <button
          className="sidebar-link logout-link"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
};

export default Asidebar;