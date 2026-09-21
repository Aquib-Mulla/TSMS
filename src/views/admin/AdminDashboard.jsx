import React, { useCallback, useEffect, useState } from "react";
import Asidebar from "./asidebar";

import {
  Siren,
  ShieldAlert,
  Users,
  Bell,
  UserRound,
  Activity,
  AlertTriangle,
  MapPin,
  RefreshCw,
} from "lucide-react";

import "../../style/admin.css";

// =====================================================
// API CONFIGURATION
// =====================================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

// =====================================================
// ADMIN DASHBOARD
// =====================================================

const AdminDashboard = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [tourists, setTourists] = useState([]);
  const [activeTourists, setActiveTourists] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH ALL REGISTERED TOURISTS
  // =====================================================

  const fetchTourists = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/admin/tourists`
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "ADMIN - ALL TOURISTS:",
        data
      );

      if (!data.success) {
        throw new Error(
          data.message ||
            "Unable to fetch tourists"
        );
      }

      setTourists(
        Array.isArray(data.tourists)
          ? data.tourists
          : []
      );

      // Clear old error if request succeeds
      setError("");
    } catch (err) {
      console.error(
        "FETCH TOURISTS ERROR:",
        err
      );

      setError(
        "Unable to connect to tourist service."
      );
    }
  }, []);

  // =====================================================
  // FETCH CURRENTLY ONLINE TOURISTS
  // =====================================================

  const fetchActiveTourists = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/location/active`
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "ADMIN - ONLINE TOURISTS:",
        data
      );

      if (!data.success) {
        throw new Error(
          data.message ||
            "Unable to fetch online tourists"
        );
      }

      setActiveTourists(
        Array.isArray(data.tourists)
          ? data.tourists
          : []
      );
    } catch (err) {
      console.error(
        "FETCH ONLINE TOURISTS ERROR:",
        err
      );

      setError(
        "Unable to fetch live tourist locations."
      );
    }
  }, []);

  // =====================================================
  // LOAD COMPLETE DASHBOARD
  // =====================================================

  const loadDashboard = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        fetchTourists(),
        fetchActiveTourists(),
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    fetchTourists,
    fetchActiveTourists,
  ]);

  // =====================================================
  // INITIAL LOAD + AUTO REFRESH
  // =====================================================

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      fetchTourists();
      fetchActiveTourists();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [
    loadDashboard,
    fetchTourists,
    fetchActiveTourists,
  ]);

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (date) => {
    if (!date) {
      return "Never";
    }

    const locationDate = new Date(date);

    if (
      Number.isNaN(
        locationDate.getTime()
      )
    ) {
      return "Unknown";
    }

    const now = new Date();

    const difference = Math.floor(
      (now - locationDate) / 1000
    );

    if (difference < 10) {
      return "Just now";
    }

    if (difference < 60) {
      return `${difference} sec ago`;
    }

    const minutes = Math.floor(
      difference / 60
    );

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    return `${days} day${
      days > 1 ? "s" : ""
    } ago`;
  };

  // =====================================================
  // GET TOURIST ID
  // =====================================================

  const getTouristId = (tourist) => {
    return (
      tourist?.tourist_id ||
      tourist?.user_id ||
      tourist?.userId ||
      tourist?.id ||
      null
    );
  };

  // =====================================================
  // CHECK CURRENT ONLINE STATUS
  //
  // IMPORTANT:
  // We determine current online status by checking
  // whether the tourist exists in activeTourists.
  // =====================================================

  const isTouristOnline = (tourist) => {
    const touristId =
      getTouristId(tourist);

    if (!touristId) {
      return false;
    }

    return activeTourists.some(
      (activeTourist) => {
        const activeId =
          getTouristId(activeTourist);

        return (
          String(activeId) ===
          String(touristId)
        );
      }
    );
  };

  // =====================================================
  // DERIVED DATA
  // =====================================================

  // ALL REGISTERED TOURISTS
  const totalTourists =
    tourists.length;

  // ONLY CURRENTLY ONLINE TOURISTS
  const onlineTourists =
    activeTourists;

  // NUMBER OF CURRENTLY ONLINE TOURISTS
  const onlineTouristCount =
    onlineTourists.length;

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="admin-dashboard">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Asidebar />

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="admin-main">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="admin-header">

          <div>
            <h1>Dashboard</h1>

            <p>
              Monitor and manage tourist
              safety in real time.
            </p>
          </div>

          <div className="header-right">

            {/* NOTIFICATIONS */}

            <button
              className="notification-btn"
              title="Notifications"
            >
              <Bell size={21} />

              <span className="notification-dot"></span>
            </button>

            {/* REFRESH */}

            <button
              className="notification-btn"
              onClick={loadDashboard}
              title="Refresh dashboard"
              disabled={refreshing}
            >
              <RefreshCw
                size={20}
                className={
                  refreshing
                    ? "refresh-spinning"
                    : ""
                }
              />
            </button>

            {/* ADMIN PROFILE */}

            <div className="admin-profile">

              <div className="profile-icon">
                <UserRound size={20} />
              </div>

              <div>
                <strong>
                  Admin
                </strong>

                <span>
                  Administrator
                </span>
              </div>

            </div>

          </div>
        </header>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="dashboard-error">

            <AlertTriangle size={18} />

            <span>
              {error}
            </span>

          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="stats-grid">

          {/* =================================================
              TOTAL TOURISTS
          ================================================= */}

          <div className="stat-card">

            <div className="stat-icon tourists">
              <Users size={25} />
            </div>

            <div className="stat-content">

              <span>
                Total Tourists
              </span>

              <h2>
                {loading
                  ? "..."
                  : totalTourists}
              </h2>

              <small className="positive">
                Registered tourists
              </small>

            </div>

          </div>

          {/* =================================================
              ONLINE TOURISTS
          ================================================= */}

          <div className="stat-card">

            <div className="stat-icon active">
              <Activity size={25} />
            </div>

            <div className="stat-content">

              <span>
                Online Tourists
              </span>

              <h2>
                {loading
                  ? "..."
                  : onlineTouristCount}
              </h2>

              <small className="positive">
                Currently online
              </small>

            </div>

          </div>

          {/* =================================================
              SOS ALERTS
          ================================================= */}

          <div className="stat-card">

            <div className="stat-icon sos">
              <Siren size={25} />
            </div>

            <div className="stat-content">

              <span>
                SOS Alerts
              </span>

              <h2>
                0
              </h2>

              <small className="negative">
                Requires attention
              </small>

            </div>

          </div>

          {/* =================================================
              INCIDENTS
          ================================================= */}

          <div className="stat-card">

            <div className="stat-icon incidents">
              <ShieldAlert size={25} />
            </div>

            <div className="stat-content">

              <span>
                Open Incidents
              </span>

              <h2>
                0
              </h2>

              <small className="warning">
                Under investigation
              </small>

            </div>

          </div>

        </section>

        {/* =================================================
            SECTION 1
            ONLINE TOURISTS
            ONLY CURRENTLY TRACKING USERS
        ================================================= */}

        <section className="dashboard-card activity-card">

          {/* HEADER */}

          <div className="card-header">

            <div>

              <h3>
                Online Tourists
              </h3>

              <p>
                Tourists currently sharing
                their live location
              </p>

            </div>

            <div
              className="live-indicator"
              title="Live data refreshes every 3 seconds"
            >

              <span className="live-dot"></span>

              Live

            </div>

          </div>

          {/* NO ONLINE TOURISTS */}

          {!loading &&
            onlineTourists.length === 0 && (

              <div className="empty-state">

                <MapPin size={35} />

                <h3>
                  No tourists online
                </h3>

                <p>
                  When a tourist clicks
                  <strong>
                    {" "}Start Tour{" "}
                  </strong>
                  their live location
                  will appear here.
                </p>

              </div>

            )}

          {/* ONLINE TOURISTS TABLE */}

          {onlineTourists.length > 0 && (

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      Tourist ID
                    </th>

                    <th>
                      Name
                    </th>

                    <th>
                      Latitude
                    </th>

                    <th>
                      Longitude
                    </th>

                    <th>
                      Accuracy
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {onlineTourists.map(
                    (tourist) => (

                      <tr
                        key={
                          tourist.id ||
                          tourist.tourist_id
                        }
                      >

                        {/* TOURIST ID */}

                        <td>

                          <strong>
                            {
                              tourist.tourist_id ||
                              tourist.user_id ||
                              tourist.id ||
                              "N/A"
                            }
                          </strong>

                        </td>

                        {/* NAME */}

                        <td>
                          {
                            tourist.full_name ||
                            "Unknown"
                          }
                        </td>

                        {/* LATITUDE */}

                        <td>

                          {tourist.latitude !==
                            null &&
                          tourist.latitude !==
                            undefined
                            ? Number(
                                tourist.latitude
                              ).toFixed(6)
                            : "N/A"}

                        </td>

                        {/* LONGITUDE */}

                        <td>

                          {tourist.longitude !==
                            null &&
                          tourist.longitude !==
                            undefined
                            ? Number(
                                tourist.longitude
                              ).toFixed(6)
                            : "N/A"}

                        </td>

                        {/* ACCURACY */}

                        <td>

                          {tourist.accuracy !==
                            null &&
                          tourist.accuracy !==
                            undefined
                            ? `${Math.round(
                                Number(
                                  tourist.accuracy
                                )
                              )} m`
                            : "N/A"}

                        </td>

                        {/* STATUS */}

                        <td>

                          <span className="table-status active-status">
                            Online
                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =================================================
            SECTION 2
            TOURIST ACTIVITY
            ALL REGISTERED TOURISTS
        ================================================= */}

        <section className="dashboard-card activity-card">

          {/* HEADER */}

          <div className="card-header">

            <div>

              <h3>
                Tourist Activity
              </h3>

              <p>
                Last known location and
                activity of registered tourists
              </p>

            </div>

          </div>

          {/* LOADING */}

          {loading ? (

            <div className="empty-state">

              <RefreshCw
                size={30}
                className="refresh-spinning"
              />

              <p>
                Loading tourist activity...
              </p>

            </div>

          ) : tourists.length === 0 ? (

            /* NO REGISTERED TOURISTS */

            <div className="empty-state">

              <Users size={35} />

              <h3>
                No tourists registered
              </h3>

              <p>
                Registered tourists will
                appear here.
              </p>

            </div>

          ) : (

            /* ACTIVITY TABLE */

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      Tourist ID
                    </th>

                    <th>
                      Name
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Last Location
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Last Active
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {tourists.map(
                    (tourist) => {

                      // CHECK CURRENT LIVE STATUS
                      const online =
                        isTouristOnline(
                          tourist
                        );

                      // CHECK LAST LOCATION
                      const hasLocation =
                        tourist.latitude !==
                          null &&
                        tourist.latitude !==
                          undefined &&
                        tourist.longitude !==
                          null &&
                        tourist.longitude !==
                          undefined;

                      return (

                        <tr
                          key={
                            tourist.id ||
                            tourist.tourist_id
                          }
                        >

                          {/* TOURIST ID */}

                          <td>

                            <strong>
                              {
                                tourist.tourist_id ||
                                tourist.user_id ||
                                tourist.id ||
                                "N/A"
                              }
                            </strong>

                          </td>

                          {/* NAME */}

                          <td>
                            {
                              tourist.full_name ||
                              "Unknown"
                            }
                          </td>

                          {/* EMAIL */}

                          <td>
                            {
                              tourist.email ||
                              "N/A"
                            }
                          </td>

                          {/* LAST LOCATION */}

                          <td>

                            {hasLocation ? (

                              <span>

                                {Number(
                                  tourist.latitude
                                ).toFixed(6)}

                                {" , "}

                                {Number(
                                  tourist.longitude
                                ).toFixed(6)}

                              </span>

                            ) : (

                              <span>
                                No location
                              </span>

                            )}

                          </td>

                          {/* CURRENT STATUS */}

                          <td>

                            <span
                              className={
                                online
                                  ? "table-status active-status"
                                  : "table-status offline-status"
                              }
                            >
                              {online
                                ? "Online"
                                : "Offline"}
                            </span>

                          </td>

                          {/* LAST ACTIVE */}

                          <td>

                            {formatTime(
                              tourist.location_updated_at ||
                              tourist.updated_at ||
                              tourist.last_active
                            )}

                          </td>

                        </tr>

                      );

                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>
  );
};

export default AdminDashboard;