import React, { useCallback, useEffect, useState } from "react";
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
  MapPin,
  RefreshCw,
} from "lucide-react";

import "../../style/admin.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");


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
  // FETCH ALL TOURISTS
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

      if (data.success) {

        setTourists(
          Array.isArray(data.tourists)
            ? data.tourists
            : []
        );

      } else {

        throw new Error(
          data.message || "Unable to fetch tourists"
        );

      }

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
  // FETCH ACTIVE TOURISTS
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
        "ADMIN - ACTIVE TOURISTS:",
        data
      );

      if (data.success) {

        setActiveTourists(
          Array.isArray(data.tourists)
            ? data.tourists
            : []
        );

      } else {

        throw new Error(
          data.message || "Unable to fetch active tourists"
        );

      }

    } catch (err) {

      console.error(
        "FETCH ACTIVE TOURISTS ERROR:",
        err
      );

      setError(
        "Unable to fetch live tourist locations."
      );

    }

  }, []);


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = useCallback(async () => {

    setRefreshing(true);

    await Promise.all([
      fetchTourists(),
      fetchActiveTourists()
    ]);

    setLoading(false);
    setRefreshing(false);

  }, [
    fetchTourists,
    fetchActiveTourists
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
    fetchActiveTourists
  ]);


  // =====================================================
  // HELPERS
  // =====================================================

  const formatTime = (date) => {

    if (!date) {
      return "Never";
    }

    const locationDate = new Date(date);

    if (Number.isNaN(locationDate.getTime())) {
      return "Unknown";
    }

    const now = new Date();

    const difference =
      Math.floor(
        (now - locationDate) / 1000
      );

    if (difference < 10) {
      return "Just now";
    }

    if (difference < 60) {
      return `${difference} sec ago`;
    }

    const minutes =
      Math.floor(difference / 60);

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours =
      Math.floor(minutes / 60);

    return `${hours} hr ago`;
  };


const isTouristOnline = (tourist) => {
  return (
    tourist.is_online === 1 ||
    tourist.is_online === true
  );
};

  // =====================================================
  // DERIVED DATA
  // =====================================================

const totalTourists =
  tourists.filter(
    (tourist) => tourist.isOnline
  ).length;
  const onlineTourists = tourists.filter(
    isTouristOnline
  );

  const activeTours =
    activeTourists.length;


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
              Monitor and manage tourist safety in real time.
            </p>

          </div>


          <div className="header-right">

            <button
              className="notification-btn"
              title="Notifications"
            >
              <Bell size={21} />

              <span className="notification-dot"></span>

            </button>


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


            <div className="admin-profile">

              <div className="profile-icon">
                <UserRound size={20} />
              </div>

              <div>

                <strong>Admin</strong>

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

            <span>{error}</span>

          </div>

        )}


        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="stats-grid">


          {/* TOTAL TOURISTS */}

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


          {/* ACTIVE TOURS */}

          <div className="stat-card">

            <div className="stat-icon active">
              <Activity size={25} />
            </div>

            <div className="stat-content">

              <span>
                Active Tours
              </span>

              <h2>
                {loading
                  ? "..."
                  : activeTours}
              </h2>

              <small className="positive">
                Currently tracking
              </small>

            </div>

          </div>


          {/* SOS */}

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


          {/* INCIDENTS */}

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
            LIVE TOURISTS
        ================================================= */}

        <section className="dashboard-card activity-card">

          <div className="card-header">

            <div>

              <h3>
                Online Tourists
              </h3>

              <p>
                Tourists currently sharing their live location
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
            activeTourists.length === 0 && (

              <div className="empty-state">

                <MapPin size={35} />

                <h3>
                  No tourists online
                </h3>

                <p>
                  When a tourist clicks
                  <strong> Start Tour </strong>
                  their live location will appear here.
                </p>

              </div>

            )}


          {/* ONLINE TOURISTS */}

          {activeTourists.length > 0 && (

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

                    <th>
                      Last Update
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {activeTourists.map(
                    (tourist) => (

                      <tr
                        key={tourist.id}
                      >

                        <td>

                          <strong>
                            {tourist.tourist_id}
                          </strong>

                        </td>


                        <td>
                          {tourist.full_name}
                        </td>


                        <td>

                          {Number(
                            tourist.latitude
                          ).toFixed(6)}

                        </td>


                        <td>

                          {Number(
                            tourist.longitude
                          ).toFixed(6)}

                        </td>


                        <td>

                          {tourist.accuracy
                            ? `${Math.round(
                                tourist.accuracy
                              )} m`
                            : "N/A"}

                        </td>


                        <td>

                          <span
                            className="table-status active-status"
                          >
                            Online
                          </span>

                        </td>


                        <td>

                          {formatTime(
                            tourist.updated_at
                          )}

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
            ALL TOURISTS
        ================================================= */}

        <section className="dashboard-card activity-card">

          <div className="card-header">

            <div>

              <h3>
                Tourist Activity
              </h3>

              <p>
                Registered tourists and tracking status
              </p>

            </div>

          </div>


          {loading ? (

            <div className="empty-state">

              <RefreshCw size={30} />

              <p>
                Loading tourist data...
              </p>

            </div>

          ) : tourists.length === 0 ? (

            <div className="empty-state">

              <Users size={35} />

              <h3>
                No tourists registered
              </h3>

            </div>

          ) : (

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
                      Location
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

                      const online =
                        isTouristOnline(
                          tourist
                        );


                      return (

                        <tr
                          key={tourist.id}
                        >

                          <td>

                            <strong>
                              {tourist.tourist_id}
                            </strong>

                          </td>


                          <td>
                            {tourist.full_name}
                          </td>


                          <td>
                            {tourist.email}
                          </td>


                          <td>

                            {tourist.latitude !== null &&
                            tourist.longitude !== null ? (

                              <span>

                                {Number(
                                  tourist.latitude
                                ).toFixed(4)}

                                {" , "}

                                {Number(
                                  tourist.longitude
                                ).toFixed(4)}

                              </span>

                            ) : (

                              <span>
                                No location
                              </span>

                            )}

                          </td>


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


                          <td>

                            {formatTime(
                              tourist.location_updated_at
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