import React, { useEffect, useState } from "react";

import {
  Search,
  MapPin,
  Eye,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  X,
} from "lucide-react";

import Asidebar from "./asidebar";
import "../../style/admin.css";


const Tourists = () => {

  const [search, setSearch] = useState("");

  const [selectedTourist, setSelectedTourist] =
    useState(null);

  const [filter, setFilter] = useState("All");

  const [tourists, setTourists] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ======================================================
  // API URL
  // ======================================================

  const API_URL = import.meta.env.VITE_API_URL;


  // ======================================================
  // FETCH TOURISTS
  // ======================================================

  const fetchTourists = async () => {

    try {

      setLoading(true);

      setError("");


      if (!API_URL) {

        setError(
          "Server configuration is missing."
        );

        return;

      }


      const response = await fetch(
        `${API_URL}/api/admin/tourists`
      );


      const data = await response.json();


      console.log(
        "Tourists API response:",
        data
      );


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Unable to fetch tourists."
        );

      }


      // ==================================================
      // CONVERT DATABASE DATA TO FRONTEND FORMAT
      // ==================================================

      const formattedTourists =
        data.tourists.map((tourist) => ({

          id: tourist.id,

          touristId:
            tourist.tourist_id,

          name:
            tourist.full_name,

          email:
            tourist.email,

          mobile:
            tourist.phone || "Not provided",

          location:
            tourist.current_location ||
            "Location unavailable",

          status:
            tourist.account_status ||
            "Active",

          safety:
            tourist.safety_status ||
            "Safe",

          joined:
            tourist.created_at
              ? new Date(
                  tourist.created_at
                ).toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )
              : "N/A",

        }));


      setTourists(
        formattedTourists
      );


    } catch (error) {

      console.error(
        "FETCH TOURISTS ERROR:",
        error
      );

      setError(
        "Unable to connect to the server."
      );

    } finally {

      setLoading(false);

    }

  };


  // ======================================================
  // LOAD TOURISTS WHEN PAGE OPENS
  // ======================================================

  useEffect(() => {

    fetchTourists();

  }, []);


  // ======================================================
  // SEARCH + FILTER
  // ======================================================

  const filteredTourists =
    tourists.filter((tourist) => {

      const searchValue =
        search.toLowerCase().trim();


      const matchesSearch =

        tourist.name
          .toLowerCase()
          .includes(searchValue)

        ||

        tourist.email
          .toLowerCase()
          .includes(searchValue)

        ||

        tourist.mobile
          .toLowerCase()
          .includes(searchValue)

        ||

        (tourist.touristId || "")
          .toLowerCase()
          .includes(searchValue);


      const matchesFilter =
        filter === "All" ||
        tourist.status === filter;


      return (
        matchesSearch &&
        matchesFilter
      );

    });


  // ======================================================
  // TOGGLE ACCOUNT STATUS
  // ======================================================

  const toggleStatus = async (tourist) => {

    try {

      const newStatus =
        tourist.status === "Active"
          ? "Inactive"
          : "Active";


      if (!API_URL) {

        setError(
          "Server configuration is missing."
        );

        return;

      }


      const response = await fetch(

        `${API_URL}/api/admin/tourists/${tourist.id}/status`,

        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status: newStatus,
          }),

        }

      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Unable to update status."
        );

      }


      // Update frontend immediately
      setTourists((previousTourists) =>

        previousTourists.map(
          (item) =>

            item.id === tourist.id

              ? {
                  ...item,
                  status: newStatus,
                }

              : item
        )

      );


      // Update selected modal if open
      if (
        selectedTourist &&
        selectedTourist.id === tourist.id
      ) {

        setSelectedTourist(
          (previous) => ({
            ...previous,
            status: newStatus,
          })
        );

      }


    } catch (error) {

      console.error(
        "STATUS UPDATE ERROR:",
        error
      );

      alert(
        "Unable to update tourist status."
      );

    }

  };


  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {

    return (

      <div className="admin-layout">

        <Asidebar />

        <main className="admin-main">

          <div className="admin-page">

            <div className="admin-page-header">

              <div>

                <h1>Tourists</h1>

                <p>
                  Loading registered tourists...
                </p>

              </div>

            </div>

          </div>

        </main>

      </div>

    );

  }


  // ======================================================
  // MAIN UI
  // ======================================================

  return (

    <div className="admin-layout">

      {/* ================= SIDEBAR ================= */}

      <Asidebar />


      {/* ================= MAIN ================= */}

      <main className="admin-main">

        <div className="admin-page">


          {/* ================= HEADER ================= */}

          <div className="admin-page-header">

            <div>

              <h1>Tourists</h1>

              <p>
                Manage and monitor all registered tourists
              </p>

            </div>


            <div className="tourist-total">

              <UserCheck size={20} />

              <span>
                {tourists.length} Registered
              </span>

            </div>

          </div>


          {/* ================= ERROR ================= */}

          {error && (

            <div
              style={{
                padding: "14px",
                marginBottom: "20px",
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: "8px",
              }}
            >

              {error}

            </div>

          )}


          {/* ================= STATISTICS ================= */}

          <div className="admin-stats-grid">


            {/* TOTAL */}

            <div className="admin-stat-card">

              <div className="stat-icon">

                <UserCheck size={24} />

              </div>

              <div>

                <span>
                  Total Tourists
                </span>

                <h2>
                  {tourists.length}
                </h2>

              </div>

            </div>


            {/* SAFE */}

            <div className="admin-stat-card">

              <div className="stat-icon">

                <ShieldCheck size={24} />

              </div>

              <div>

                <span>
                  Safe Tourists
                </span>

                <h2>

                  {
                    tourists.filter(
                      (t) =>
                        t.safety === "Safe"
                    ).length
                  }

                </h2>

              </div>

            </div>


            {/* WARNING */}

            <div className="admin-stat-card">

              <div className="stat-icon">

                <ShieldAlert size={24} />

              </div>

              <div>

                <span>
                  Warnings
                </span>

                <h2>

                  {
                    tourists.filter(
                      (t) =>
                        t.safety ===
                        "Warning"
                    ).length
                  }

                </h2>

              </div>

            </div>


            {/* DANGER */}

            <div className="admin-stat-card">

              <div className="stat-icon">

                <ShieldAlert size={24} />

              </div>

              <div>

                <span>
                  Danger
                </span>

                <h2>

                  {
                    tourists.filter(
                      (t) =>
                        t.safety ===
                        "Danger"
                    ).length
                  }

                </h2>

              </div>

            </div>

          </div>


          {/* ================= SEARCH / FILTER ================= */}

          <div className="tourist-toolbar">


            <div className="tourist-search">

              <Search size={20} />

              <input

                type="text"

                placeholder="Search by tourist ID, name, email or mobile..."

                value={search}

                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }

              />

            </div>


            <div className="tourist-filters">

              {[
                "All",
                "Active",
                "Inactive",
              ].map((item) => (

                <button

                  key={item}

                  className={
                    filter === item
                      ? "filter-active"
                      : ""
                  }

                  onClick={() =>
                    setFilter(item)
                  }

                >

                  {item}

                </button>

              ))}

            </div>

          </div>


          {/* ================= TABLE ================= */}

          <div className="admin-table-container">


            <div className="table-heading">

              <div>

                <h2>
                  Registered Tourists
                </h2>

                <p>
                  View tourist information and
                  current safety status
                </p>

              </div>

            </div>


            <div className="table-responsive">

              <table className="admin-table">


                <thead>

                  <tr>

                    <th>Tourist</th>

                    <th>Contact</th>

                    <th>Current Location</th>

                    <th>Safety Status</th>

                    <th>Account Status</th>

                    <th>Joined</th>

                    <th>Action</th>

                  </tr>

                </thead>


                <tbody>


                  {filteredTourists.length > 0 ? (

                    filteredTourists.map(
                      (tourist) => (

                        <tr key={tourist.id}>


                          {/* TOURIST */}

                          <td>

                            <div className="tourist-info">

                              <div className="tourist-avatar">

                                {tourist.name
                                  .charAt(0)
                                  .toUpperCase()}

                              </div>


                              <div>

                                <strong>
                                  {tourist.name}
                                </strong>

                                <small>

                                  ID:{" "}

                                  {tourist.touristId ||
                                    `TS-${String(
                                      tourist.id
                                    ).padStart(
                                      5,
                                      "0"
                                    )}`}

                                </small>

                              </div>

                            </div>

                          </td>


                          {/* CONTACT */}

                          <td>

                            <div className="contact-info">

                              <span>

                                <Mail size={14} />

                                {tourist.email}

                              </span>


                              <span>

                                <Phone size={14} />

                                {tourist.mobile}

                              </span>

                            </div>

                          </td>


                          {/* LOCATION */}

                          <td>

                            <div className="location-info">

                              <MapPin size={17} />

                              <span>
                                {tourist.location}
                              </span>

                            </div>

                          </td>


                          {/* SAFETY */}

                          <td>

                            <span
                              className={`safety-badge ${tourist.safety.toLowerCase()}`}
                            >

                              {tourist.safety ===
                                "Safe" && (

                                <ShieldCheck
                                  size={15}
                                />

                              )}


                              {tourist.safety ===
                                "Warning" && (

                                <ShieldAlert
                                  size={15}
                                />

                              )}


                              {tourist.safety ===
                                "Danger" && (

                                <ShieldAlert
                                  size={15}
                                />

                              )}


                              {tourist.safety}

                            </span>

                          </td>


                          {/* ACCOUNT STATUS */}

                          <td>

                            <span
                              className={`status-badge ${tourist.status.toLowerCase()}`}
                            >

                              {tourist.status}

                            </span>

                          </td>


                          {/* JOINED */}

                          <td>
                            {tourist.joined}
                          </td>


                          {/* ACTION */}

                          <td>

                            <div className="tourist-actions">


                              {/* VIEW */}

                              <button

                                className="view-btn"

                                title="View Tourist"

                                onClick={() =>
                                  setSelectedTourist(
                                    tourist
                                  )
                                }

                              >

                                <Eye size={17} />

                              </button>


                              {/* STATUS */}

                              <button

                                className="status-btn"

                                title={
                                  tourist.status ===
                                  "Active"

                                    ? "Deactivate"

                                    : "Activate"
                                }

                                onClick={() =>
                                  toggleStatus(
                                    tourist
                                  )
                                }

                              >

                                {tourist.status ===
                                "Active" ? (

                                  <UserX
                                    size={17}
                                  />

                                ) : (

                                  <UserCheck
                                    size={17}
                                  />

                                )}

                              </button>

                            </div>

                          </td>

                        </tr>

                      )

                    )

                  ) : (

                    <tr>

                      <td colSpan="7">

                        <div className="no-tourists">

                          <Search size={35} />

                          <h3>
                            No tourists found
                          </h3>

                          <p>
                            Try changing your search
                            or filter.
                          </p>

                        </div>

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>


          {/* ================= MODAL ================= */}

          {selectedTourist && (

            <div

              className="tourist-modal-overlay"

              onClick={() =>
                setSelectedTourist(null)
              }

            >


              <div

                className="tourist-modal"

                onClick={(e) =>
                  e.stopPropagation()
                }

              >


                {/* HEADER */}

                <div className="modal-header">

                  <div>

                    <h2>
                      Tourist Details
                    </h2>

                    <p>
                      Complete tourist information
                    </p>

                  </div>


                  <button

                    className="modal-close"

                    onClick={() =>
                      setSelectedTourist(null)
                    }

                  >

                    <X size={21} />

                  </button>

                </div>


                {/* PROFILE */}

                <div className="modal-profile">

                  <div className="modal-avatar">

                    {selectedTourist.name
                      .charAt(0)
                      .toUpperCase()}

                  </div>


                  <div>

                    <h3>
                      {selectedTourist.name}
                    </h3>

                    <p>

                      Tourist ID:{" "}

                      {selectedTourist.touristId}

                    </p>

                  </div>

                </div>


                {/* DETAILS */}

                <div className="tourist-detail-grid">


                  <div>

                    <label>
                      Email
                    </label>

                    <p>
                      {selectedTourist.email}
                    </p>

                  </div>


                  <div>

                    <label>
                      Mobile
                    </label>

                    <p>
                      {selectedTourist.mobile}
                    </p>

                  </div>


                  <div>

                    <label>
                      Current Location
                    </label>

                    <p>
                      {selectedTourist.location}
                    </p>

                  </div>


                  <div>

                    <label>
                      Joined Date
                    </label>

                    <p>
                      {selectedTourist.joined}
                    </p>

                  </div>


                  <div>

                    <label>
                      Account Status
                    </label>

                    <p>
                      {selectedTourist.status}
                    </p>

                  </div>


                  <div>

                    <label>
                      Safety Status
                    </label>

                    <p>
                      {selectedTourist.safety}
                    </p>

                  </div>

                </div>


                {/* LOCATION */}

                <div className="modal-location">

                  <MapPin size={20} />

                  <div>

                    <strong>
                      Live Location
                    </strong>

                    <p>

                      Current location:{" "}

                      {selectedTourist.location}

                    </p>

                  </div>

                </div>


              </div>

            </div>

          )}

        </div>

      </main>

    </div>

  );

};


export default Tourists;
