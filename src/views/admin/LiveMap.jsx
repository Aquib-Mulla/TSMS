import React, { useEffect, useState } from "react";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";

import {
  Search,
  MapPin,
  Users,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";

import Asidebar from "./asidebar";

import "../../style/admin.css";


// =====================================================
// DEFAULT LOCATION - MUMBAI
// =====================================================

const DEFAULT_LOCATION = {
  lat: 19.0760,
  lng: 72.8777,
};


// =====================================================
// TOURIST MARKER
// =====================================================

const TouristMarker = ({ safety }) => {

  let background = "#0f766e";

  if (safety === "Warning") {
    background = "#f59e0b";
  }

  if (safety === "Danger") {
    background = "#dc2626";
  }

  return (
    <div
      style={{
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        background: background,
        border: "3px solid #ffffff",
        boxShadow: "0 3px 12px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontWeight: "700",
        fontSize: "13px",
        cursor: "pointer",
      }}
    >
      T
    </div>
  );
};


// =====================================================
// LIVE MAP
// =====================================================

const LiveMap = () => {

  // ===================================================
  // DEMO TOURISTS
  // ===================================================

  const [tourists, setTourists] = useState([

    {
      id: 1,
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      mobile: "+91 9876543210",
      latitude: 19.0760,
      longitude: 72.8777,
      location: "Gateway of India",
      safety: "Safe",
      lastUpdated: "Just now",
    },

    {
      id: 2,
      name: "Priya Patil",
      email: "priya@gmail.com",
      mobile: "+91 9823456712",
      latitude: 19.0820,
      longitude: 72.8850,
      location: "Marine Drive",
      safety: "Safe",
      lastUpdated: "10 seconds ago",
    },

    {
      id: 3,
      name: "Sneha Kulkarni",
      email: "sneha@gmail.com",
      mobile: "+91 9988776655",
      latitude: 19.0890,
      longitude: 72.8920,
      location: "Juhu Beach",
      safety: "Warning",
      lastUpdated: "20 seconds ago",
    },

    {
      id: 4,
      name: "Aman Khan",
      email: "aman@gmail.com",
      mobile: "+91 9898989898",
      latitude: 19.0650,
      longitude: 72.8680,
      location: "Bandra",
      safety: "Danger",
      lastUpdated: "5 seconds ago",
    },

  ]);


  // ===================================================
  // STATES
  // ===================================================

  const [search, setSearch] = useState("");

  const [selectedTourist, setSelectedTourist] =
    useState(null);

  const [loading, setLoading] = useState(false);


  // ===================================================
  // REFRESH
  // ===================================================

  const fetchLiveLocations = async () => {

    try {

      setLoading(true);

      /*
        ===============================================
        BACKEND WILL BE CONNECTED LATER

        const response = await fetch(
          "http://localhost:5000/api/admin/live-locations"
        );

        const data = await response.json();

        setTourists(data.users);

        ===============================================
      */

      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

    } catch (error) {

      console.error(
        "Error fetching live locations:",
        error
      );

    } finally {

      setLoading(false);

    }

  };


  // ===================================================
  // INITIAL REFRESH
  // ===================================================

  useEffect(() => {

    fetchLiveLocations();

  }, []);


  // ===================================================
  // SEARCH
  // ===================================================

  const filteredTourists = tourists.filter(
    (tourist) => {

      const value = search.toLowerCase();

      return (

        tourist.name
          .toLowerCase()
          .includes(value)

        ||

        tourist.email
          .toLowerCase()
          .includes(value)

        ||

        tourist.location
          .toLowerCase()
          .includes(value)

      );

    }
  );


  // ===================================================
  // STATISTICS
  // ===================================================

  const totalTourists = tourists.length;

  const safeTourists = tourists.filter(
    (tourist) =>
      tourist.safety === "Safe"
  ).length;

  const warningTourists = tourists.filter(
    (tourist) =>
      tourist.safety === "Warning"
  ).length;

  const dangerTourists = tourists.filter(
    (tourist) =>
      tourist.safety === "Danger"
  ).length;


  // ===================================================
  // SELECT TOURIST
  // ===================================================

  const handleSelectTourist = (tourist) => {

    setSelectedTourist(tourist);

  };


  // ===================================================
  // PAGE
  // ===================================================

  return (

    <div className="admin-layout">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Asidebar />


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="admin-main">

        <div className="live-map-page">


          {/* =================================================
              HEADER
          ================================================= */}

          <div className="live-map-header">

            <div>

              <h1>
                Live Map
              </h1>

              <p>
                Monitor the real-time location
                of registered tourists
              </p>

            </div>


            <button
              className="refresh-map-btn"
              onClick={fetchLiveLocations}
            >

              <RefreshCw
                size={18}
                className={
                  loading
                    ? "refresh-spinning"
                    : ""
                }
              />

              Refresh

            </button>

          </div>


          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="live-map-stats">


            {/* ONLINE */}

            <div className="map-stat">

              <div className="map-stat-icon">

                <Users size={20} />

              </div>

              <div>

                <span>
                  Online Tourists
                </span>

                <strong>
                  {totalTourists}
                </strong>

              </div>

            </div>


            {/* SAFE */}

            <div className="map-stat">

              <div className="map-stat-icon">

                <ShieldCheck size={20} />

              </div>

              <div>

                <span>
                  Safe
                </span>

                <strong>
                  {safeTourists}
                </strong>

              </div>

            </div>


            {/* WARNING */}

            <div className="map-stat">

              <div className="map-stat-icon">

                <ShieldAlert size={20} />

              </div>

              <div>

                <span>
                  Warning
                </span>

                <strong>
                  {warningTourists}
                </strong>

              </div>

            </div>


            {/* DANGER */}

            <div className="map-stat">

              <div className="map-stat-icon">

                <ShieldAlert size={20} />

              </div>

              <div>

                <span>
                  Danger
                </span>

                <strong>
                  {dangerTourists}
                </strong>

              </div>

            </div>

          </div>


          {/* =================================================
              MAP CONTAINER
          ================================================= */}

          <div className="live-map-container">


            {/* =================================================
                SEARCH + TOURIST LIST
            ================================================= */}

            <div className="map-search-panel">


              {/* SEARCH */}

              <div className="map-search">

                <Search size={18} />

                <input
                  type="text"
                  placeholder="Search tourist..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />

              </div>


              {/* USER LIST */}

              <div className="map-user-list">

                {filteredTourists.length > 0 ? (

                  filteredTourists.map(
                    (tourist) => (

                      <button
                        key={tourist.id}
                        className={
                          `map-user-item ${
                            selectedTourist?.id ===
                            tourist.id
                              ? "selected"
                              : ""
                          }`
                        }
                        onClick={() =>
                          handleSelectTourist(
                            tourist
                          )
                        }
                      >

                        <div
                          className={
                            `map-user-status ${
                              tourist.safety.toLowerCase()
                            }`
                          }
                        />

                        <div className="map-user-info">

                          <strong>
                            {tourist.name}
                          </strong>

                          <span>

                            <MapPin size={12} />

                            {tourist.location}

                          </span>

                        </div>

                      </button>

                    )
                  )

                ) : (

                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#777",
                    }}
                  >
                    No tourists found
                  </div>

                )}

              </div>

            </div>


            {/* =================================================
                GOOGLE MAP
            ================================================= */}

            <APIProvider
              apiKey={
                import.meta.env
                  .VITE_GOOGLE_MAPS_API_KEY
              }
            >

              <Map

                className="admin-live-map"

                defaultCenter={
                  DEFAULT_LOCATION
                }

                defaultZoom={13}

                mapId="DEMO_MAP_ID"

                gestureHandling="greedy"

                disableDefaultUI={false}

                zoomControl={true}

                streetViewControl={true}

                fullscreenControl={true}

                mapTypeControl={true}

              >


                {/* =========================================
                    TOURIST MARKERS
                ========================================= */}

                {filteredTourists.map(
                  (tourist) => (

                    <React.Fragment
                      key={tourist.id}
                    >

                      <AdvancedMarker

                        position={{
                          lat:
                            Number(
                              tourist.latitude
                            ),

                          lng:
                            Number(
                              tourist.longitude
                            ),
                        }}

                        title={
                          tourist.name
                        }

                        onClick={() =>
                          handleSelectTourist(
                            tourist
                          )
                        }
                      >

                        <TouristMarker
                          safety={
                            tourist.safety
                          }
                        />

                      </AdvancedMarker>


                      {/* ===================================
                          INFO WINDOW
                      =================================== */}

                      {selectedTourist?.id ===
                        tourist.id && (

                        <InfoWindow

                          position={{
                            lat:
                              Number(
                                tourist.latitude
                              ),

                            lng:
                              Number(
                                tourist.longitude
                              ),
                          }}

                          onCloseClick={() =>
                            setSelectedTourist(
                              null
                            )
                          }
                        >

                          <div
                            className="map-popup"
                            style={{
                              minWidth:
                                "220px",
                            }}
                          >

                            <h3>
                              {tourist.name}
                            </h3>


                            <p>
                              {tourist.email}
                            </p>


                            <div
                              className={
                                `popup-safety ${
                                  tourist.safety.toLowerCase()
                                }`
                              }
                            >
                              {tourist.safety}
                            </div>


                            <p>

                              <strong>
                                Location
                              </strong>

                              <br />

                              {tourist.location}

                            </p>


                            <p>

                              <strong>
                                Coordinates
                              </strong>

                              <br />

                              {Number(
                                tourist.latitude
                              ).toFixed(6)}

                              {" , "}

                              {Number(
                                tourist.longitude
                              ).toFixed(6)}

                            </p>


                            <p>

                              <strong>
                                Last Updated
                              </strong>

                              <br />

                              {tourist.lastUpdated}

                            </p>

                          </div>

                        </InfoWindow>

                      )}

                    </React.Fragment>

                  )
                )}

              </Map>

            </APIProvider>


            {/* =================================================
                LIVE INDICATOR
            ================================================= */}

            <div className="map-live-indicator">

              <span />

              LIVE

            </div>


            {/* =================================================
                LEGEND
            ================================================= */}

            <div className="map-legend">

              <strong>
                Safety Status
              </strong>


              <div>

                <span
                  className="legend-dot safe"
                />

                Safe

              </div>


              <div>

                <span
                  className="legend-dot warning"
                />

                Warning

              </div>


              <div>

                <span
                  className="legend-dot danger"
                />

                Danger

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>

  );

};


export default LiveMap;
