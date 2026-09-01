import React from "react";
import Asidebar from "./asidebar";

import {
  Siren,
  ShieldAlert,
  Users,
  Bell,
  UserRound,
  Activity,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import "../../style/admin.css";

const AdminDashboard = () => {

  return (
    <div className="admin-dashboard">

      {/* ================= SIDEBAR ================= */}
      <Asidebar />

      {/* ================= MAIN CONTENT ================= */}
      <main className="admin-main">

        {/* ================= TOP HEADER ================= */}
        <header className="admin-header">

          <div>
            <h1>Dashboard</h1>
            <p>
              Monitor and manage tourist safety in real time.
            </p>
          </div>

          <div className="header-right">

            <button className="notification-btn">
              <Bell size={21} />
              <span className="notification-dot"></span>
            </button>

            <div className="admin-profile">

              <div className="profile-icon">
                <UserRound size={20} />
              </div>

              <div>
                <strong>Admin</strong>
                <span>Administrator</span>
              </div>

            </div>

          </div>

        </header>


        {/* ================= STATISTICS ================= */}
        <section className="stats-grid">

          {/* TOTAL TOURISTS */}
          <div className="stat-card">

            <div className="stat-icon tourists">
              <Users size={25} />
            </div>

            <div className="stat-content">
              <span>Total Tourists</span>
              <h2>1,248</h2>

              <small className="positive">
                +12.5% this month
              </small>
            </div>

          </div>


          {/* ACTIVE TOURS */}
          <div className="stat-card">

            <div className="stat-icon active">
              <Activity size={25} />
            </div>

            <div className="stat-content">
              <span>Active Tours</span>
              <h2>326</h2>

              <small className="positive">
                Currently active
              </small>
            </div>

          </div>


          {/* SOS ALERTS */}
          <div className="stat-card">

            <div className="stat-icon sos">
              <Siren size={25} />
            </div>

            <div className="stat-content">
              <span>SOS Alerts</span>
              <h2>03</h2>

              <small className="negative">
                Requires attention
              </small>
            </div>

          </div>


          {/* OPEN INCIDENTS */}
          <div className="stat-card">

            <div className="stat-icon incidents">
              <ShieldAlert size={25} />
            </div>

            <div className="stat-content">
              <span>Open Incidents</span>
              <h2>08</h2>

              <small className="warning">
                Under investigation
              </small>
            </div>

          </div>

        </section>


        {/* ================= CONTENT GRID ================= */}
        <section className="dashboard-grid">

          {/* ================= RECENT SOS ================= */}
          <div className="dashboard-card sos-card">

            <div className="card-header">

              <div>
                <h3>Recent SOS Alerts</h3>
                <p>
                  Latest emergency alerts from tourists
                </p>
              </div>

              <a href="/admin/sos-alerts">
                View All
              </a>

            </div>


            <div className="alert-list">

              {/* ALERT 1 */}
              <div className="alert-item">

                <div className="alert-icon">
                  <Siren size={19} />
                </div>

                <div className="alert-info">
                  <strong>Emergency SOS</strong>
                  <span>Tourist ID: TS1024</span>
                  <small>2 minutes ago</small>
                </div>

                <span className="status danger">
                  Active
                </span>

              </div>


              {/* ALERT 2 */}
              <div className="alert-item">

                <div className="alert-icon">
                  <Siren size={19} />
                </div>

                <div className="alert-info">
                  <strong>Emergency SOS</strong>
                  <span>Tourist ID: TS0987</span>
                  <small>18 minutes ago</small>
                </div>

                <span className="status warning-status">
                  Responding
                </span>

              </div>


              {/* ALERT 3 */}
              <div className="alert-item">

                <div className="alert-icon">
                  <Siren size={19} />
                </div>

                <div className="alert-info">
                  <strong>Emergency SOS</strong>
                  <span>Tourist ID: TS1145</span>
                  <small>42 minutes ago</small>
                </div>

                <span className="status resolved">
                  Resolved
                </span>

              </div>

            </div>

          </div>


          {/* ================= SYSTEM OVERVIEW ================= */}
          <div className="dashboard-card">

            <div className="card-header">

              <div>
                <h3>System Overview</h3>
                <p>
                  Current safety monitoring status
                </p>
              </div>

            </div>


            <div className="system-list">

              {/* LOCATION TRACKING */}
              <div className="system-item">

                <div className="system-left">

                  <div className="system-icon green">
                    <CheckCircle size={19} />
                  </div>

                  <span>Location Tracking</span>

                </div>

                <strong className="online">
                  Online
                </strong>

              </div>


              {/* GEO-FENCING */}
              <div className="system-item">

                <div className="system-left">

                  <div className="system-icon green">
                    <CheckCircle size={19} />
                  </div>

                  <span>Geo-Fencing</span>

                </div>

                <strong className="online">
                  Active
                </strong>

              </div>


              {/* EMERGENCY SERVICES */}
              <div className="system-item">

                <div className="system-left">

                  <div className="system-icon warning-icon">
                    <AlertTriangle size={19} />
                  </div>

                  <span>Emergency Services</span>

                </div>

                <strong className="monitoring">
                  Monitoring
                </strong>

              </div>


              {/* DATABASE */}
              <div className="system-item">

                <div className="system-left">

                  <div className="system-icon green">
                    <CheckCircle size={19} />
                  </div>

                  <span>Database</span>

                </div>

                <strong className="online">
                  Connected
                </strong>

              </div>

            </div>

          </div>

        </section>


        {/* ================= TOURIST ACTIVITY ================= */}
        <section className="dashboard-card activity-card">

          <div className="card-header">

            <div>
              <h3>Recent Tourist Activity</h3>
              <p>
                Latest registered and active tourists
              </p>
            </div>

            <a href="/admin/tourists">
              View All
            </a>

          </div>


          <div className="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>Tourist ID</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Last Active</th>
                </tr>
              </thead>

              <tbody>

                <tr>
                  <td>
                    <strong>TS1024</strong>
                  </td>

                  <td>Rahul Sharma</td>

                  <td>Mumbai</td>

                  <td>
                    <span className="table-status active-status">
                      Active
                    </span>
                  </td>

                  <td>2 min ago</td>
                </tr>


                <tr>
                  <td>
                    <strong>TS0987</strong>
                  </td>

                  <td>Priya Patil</td>

                  <td>Goa</td>

                  <td>
                    <span className="table-status active-status">
                      Active
                    </span>
                  </td>

                  <td>8 min ago</td>
                </tr>


                <tr>
                  <td>
                    <strong>TS1145</strong>
                  </td>

                  <td>Arjun Mehta</td>

                  <td>Pune</td>

                  <td>
                    <span className="table-status offline-status">
                      Offline
                    </span>
                  </td>

                  <td>35 min ago</td>
                </tr>


                <tr>
                  <td>
                    <strong>TS1210</strong>
                  </td>

                  <td>Neha Joshi</td>

                  <td>Manali</td>

                  <td>
                    <span className="table-status active-status">
                      Active
                    </span>
                  </td>

                  <td>4 min ago</td>
                </tr>

              </tbody>

            </table>

          </div>

        </section>

      </main>

    </div>
  );
};

export default AdminDashboard;
