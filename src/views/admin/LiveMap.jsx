import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

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
// BACKEND API
// =====================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";


// =====================================================
// TOURIST MARKER
// =====================================================

const TouristMarker = ({
  safety,
}) => {

  let background =
    "#0f766e";


  if (
    safety === "Warning"
  ) {

    background =
      "#f59e0b";

  }


  if (
    safety === "Danger"
  ) {

    background =
      "#dc2626";

  }


  return (

    <div
      style={{

        width: "38px",

        height: "38px",

        borderRadius: "50%",

        background,

        border:
          "3px solid #ffffff",

        boxShadow:
          "0 3px 12px rgba(0,0,0,0.25)",

        display: "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        color:
          "#ffffff",

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
// FORMAT LAST UPDATED
// =====================================================

const formatLastUpdated = (
  date
) => {

  if (!date) {

    return "Unknown";

  }


  const updated =
    new Date(date);

  const now =
    new Date();


  const difference =
    Math.floor(
      (
        now.getTime() -
        updated.getTime()
      ) / 1000
    );


  if (
    difference < 5
  ) {

    return "Just now";

  }


  if (
    difference < 60
  ) {

    return `${difference} seconds ago`;

  }


  const minutes =
    Math.floor(
      difference / 60
    );


  if (
    minutes < 60
  ) {

    return `${minutes} minute${
      minutes !== 1
        ? "s"
        : ""
    } ago`;

  }


  const hours =
    Math.floor(
      minutes / 60
    );


  return `${hours} hour${
    hours !== 1
      ? "s"
      : ""
  } ago`;

};


// =====================================================
// MAIN COMPONENT
// =====================================================

const LiveMap = () => {


  // ===================================================
  // TOURISTS
  // ===================================================

  const [tourists, setTourists] =
    useState([]);


  // ===================================================
  // SEARCH
  // ===================================================

  const [search, setSearch] =
    useState("");


  // ===================================================
  // SELECTED TOURIST
  // ===================================================

  const [
    selectedTourist,
    setSelectedTourist,
  ] = useState(null);


  // ===================================================
  // LOADING
  // ===================================================

  const [loading, setLoading] =
    useState(false);


  // ===================================================
  // ERROR
  // ===================================================

  const [error, setError] =
    useState("");


  // ===================================================
  // FETCH ACTIVE TOURISTS
  // ===================================================

  const fetchLiveLocations =
    useCallback(
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await fetch(
              `${API_URL}/api/location/active`
            );


          if (!response.ok) {

            throw new Error(
              `Server returned ${response.status}`
            );

          }


          const data =
            await response.json();


          if (!data.success) {

            throw new Error(
              data.message ||
              "Unable to fetch tourists"
            );

          }


// =========================================
// FORMAT DATABASE DATA
// =========================================
const formattedTourists =
  (data.tourists || []).map(
    (tourist) => ({
      id: tourist.id,

      touristId:
        tourist.tourist_id,

      name:
        tourist.full_name,

      email:
        tourist.email,

      mobile:
        tourist.phone,

      latitude:
        Number(
          tourist.latitude
        ),

      longitude:
        Number(
          tourist.longitude
        ),

      accuracy:
        tourist.accuracy !== null &&
        tourist.accuracy !== undefined
          ? Number(
              tourist.accuracy
            )
          : null,

      safety:
        "Safe",

      lastUpdated:
        formatLastUpdated(
          tourist.updated_at
        ),

      updatedAt:
        tourist.updated_at,

      isTracking:
        tourist.is_tracking === 1 ||
        tourist.is_tracking === true,

      isOnline:
        tourist.is_online === 1 ||
        tourist.is_online === true,
    })
  );

          setTourists(
            formattedTourists
          );


          // =========================================
          // UPDATE SELECTED TOURIST
          // =========================================

          setSelectedTourist(
            (currentSelected) => {

              if (
                !currentSelected
              ) {

                return null;

              }


              const updated =
                formattedTourists.find(
                  (tourist) =>
                    tourist.id ===
                    currentSelected.id
                );


              return (
                updated ||
                null
              );

            }
          );


        } catch (fetchError) {

          console.error(
            "Error fetching live locations:",
            fetchError
          );


          setError(
            "Unable to connect to the backend."
          );


        } finally {

          setLoading(false);

        }

      },
      []
    );


  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {

    fetchLiveLocations();

  }, [
    fetchLiveLocations,
  ]);


  // ===================================================
  // AUTO REFRESH
  // ===================================================

  useEffect(() => {

    const interval =
      setInterval(
        () => {

          fetchLiveLocations();

        },
        5000
      );


    return () => {

      clearInterval(
        interval
      );

    };

  }, [
    fetchLiveLocations,
  ]);


  // ===================================================
  // SEARCH
  // ===================================================

const onlineTourists = tourists.filter(
  (tourist) => tourist.isOnline
);

const filteredTourists =
  onlineTourists.filter(
    (tourist) => {

        const value =
          search
            .toLowerCase()
            .trim();


        if (!value) {

          return true;

        }


        return (

          tourist.name
            ?.toLowerCase()
            .includes(value)

          ||

          tourist.email
            ?.toLowerCase()
            .includes(value)

          ||

          tourist.touristId
            ?.toLowerCase()
            .includes(value)

          ||

          tourist.mobile
            ?.toLowerCase()
            .includes(value)

        );

      }
    );


  // ===================================================
  // STATISTICS
  // ===================================================

  const totalTourists =
    tourists.length;


  const safeTourists =
    tourists.filter(
      (tourist) =>
        tourist.safety ===
        "Safe"
    ).length;


  const warningTourists =
    tourists.filter(
      (tourist) =>
        tourist.safety ===
        "Warning"
    ).length;


  const dangerTourists =
    tourists.filter(
      (tourist) =>
        tourist.safety ===
        "Danger"
    ).length;


  // ===================================================
  // SELECT TOURIST
  // ===================================================

  const handleSelectTourist =
    (tourist) => {

      setSelectedTourist(
        tourist
      );

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
          MAIN
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
              onClick={
                fetchLiveLocations
              }
              disabled={
                loading
              }
            >

              <RefreshCw
                size={18}
                className={
                  loading
                    ? "refresh-spinning"
                    : ""
                }
              />

              {loading
                ? "Refreshing..."
                : "Refresh"}

            </button>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div
              style={{

                marginBottom:
                  "15px",

                padding:
                  "12px 16px",

                borderRadius:
                  "8px",

                background:
                  "#ffffff",

                border:
                  "1px solid #000000",

                color:
                  "#000000",

              }}
            >

              {error}

            </div>

          )}


          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="live-map-stats">


            {/* ONLINE */}

            <div className="map-stat">

              <div className="map-stat-icon">

                <Users
                  size={20}
                />

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

                <ShieldCheck
                  size={20}
                />

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

                <ShieldAlert
                  size={20}
                />

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

                <ShieldAlert
                  size={20}
                />

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
              MAP
          ================================================= */}

          <div className="live-map-container">


            {/* =================================================
                SEARCH PANEL
            ================================================= */}

            <div className="map-search-panel">


              {/* SEARCH */}

              <div className="map-search">

                <Search
                  size={18}
                />

                <input
                  type="text"
                  placeholder="Search tourist..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />

              </div>


              {/* TOURIST LIST */}

              <div className="map-user-list">

                {filteredTourists.length >
                0 ? (

                  filteredTourists.map(
                    (tourist) => (

                      <button
                        key={
                          tourist.id
                        }
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
                            {
                              tourist.name
                            }
                          </strong>

                          <span>

                            <MapPin
                              size={12}
                            />

                            {
                              tourist.touristId
                            }

                          </span>

                        </div>

                      </button>

                    )
                  )

                ) : (

                  <div
                    style={{

                      padding:
                        "20px",

                      textAlign:
                        "center",

                      color:
                        "#000000",

                    }}
                  >

                    {loading
                      ? "Loading tourists..."
                      : "No active tourists"}

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

                defaultZoom={
                  13
                }

                mapId="DEMO_MAP_ID"

                gestureHandling="greedy"

                disableDefaultUI={
                  false
                }

                zoomControl={
                  true
                }

                streetViewControl={
                  true
                }

                fullscreenControl={
                  true
                }

                mapTypeControl={
                  true
                }

              >


                {/* =========================================
                    TOURIST MARKERS
                ========================================= */}

                {filteredTourists.map(
                  (tourist) => {

                    if (
                      !Number.isFinite(
                        tourist.latitude
                      ) ||
                      !Number.isFinite(
                        tourist.longitude
                      )
                    ) {

                      return null;

                    }


                    return (

                      <React.Fragment
                        key={
                          tourist.id
                        }
                      >


                        {/* ===================================
                            MARKER
                        =================================== */}

                        <AdvancedMarker

                          position={{
                            lat:
                              tourist.latitude,

                            lng:
                              tourist.longitude,
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
                                tourist.latitude,

                              lng:
                                tourist.longitude,
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
                                  "240px",

                                color:
                                  "#000000",

                              }}
                            >

                              <h3>
                                {
                                  tourist.name
                                }
                              </h3>


                              <p>

                                <strong>
                                  Tourist ID
                                </strong>

                                <br />

                                {
                                  tourist.touristId
                                }

                              </p>


                              <p>
                                {
                                  tourist.email
                                }
                              </p>


                              <p>
                                {
                                  tourist.mobile
                                }
                              </p>


                              <div
                                className={
                                  `popup-safety ${
                                    tourist.safety.toLowerCase()
                                  }`
                                }
                              >

                                {
                                  tourist.safety
                                }

                              </div>


                              <p>

                                <strong>
                                  Coordinates
                                </strong>

                                <br />

                                {
                                  tourist.latitude.toFixed(
                                    6
                                  )
                                }

                                {" , "}

                                {
                                  tourist.longitude.toFixed(
                                    6
                                  )
                                }

                              </p>


                              {tourist.accuracy !==
                                null && (

                                <p>

                                  <strong>
                                    Accuracy
                                  </strong>

                                  <br />

                                  ±
                                  {
                                    tourist.accuracy.toFixed(
                                      1
                                    )
                                  }
                                  {" meters"}

                                </p>

                              )}


                              <p>

                                <strong>
                                  Last Updated
                                </strong>

                                <br />

                                {
                                  tourist.lastUpdated
                                }

                              </p>

                            </div>

                          </InfoWindow>

                        )}

                      </React.Fragment>

                    );

                  }
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
