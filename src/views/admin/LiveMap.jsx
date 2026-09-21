import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  Search,
  MapPin,
  Users,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  X,
} from "lucide-react";

import Asidebar from "./asidebar";

import "../../style/admin.css";

// =====================================================
// DEFAULT LOCATION - MUMBAI
// =====================================================

const DEFAULT_LOCATION = {
  lat: 19.076,
  lng: 72.8777,
};

// =====================================================
// BACKEND API
// =====================================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

// =====================================================
// MAP STYLE
// =====================================================

const LIBERTY_STYLE =
  "https://tiles.openfreemap.org/styles/liberty";

// =====================================================
// TOURIST MARKER
// =====================================================

const createTouristMarker = (safety) => {
  let background = "#0f766e";

  if (safety === "Warning") {
    background = "#f59e0b";
  }

  if (safety === "Danger") {
    background = "#dc2626";
  }

  const container = document.createElement("div");

  container.style.width = "42px";
  container.style.height = "42px";
  container.style.borderRadius = "50%";
  container.style.background = background;
  container.style.border = "3px solid #ffffff";
  container.style.boxShadow =
    "0 3px 12px rgba(0, 0, 0, 0.25)";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.color = "#ffffff";
  container.style.fontWeight = "700";
  container.style.fontSize = "13px";
  container.style.cursor = "pointer";
  container.style.userSelect = "none";

  container.textContent = "T";

  return container;
};

// =====================================================
// FORMAT LAST UPDATED
// =====================================================

const formatLastUpdated = (date) => {
  if (!date) {
    return "Unknown";
  }

  const updated = new Date(date);
  const now = new Date();

  const difference = Math.floor(
    (now.getTime() - updated.getTime()) / 1000
  );

  if (difference < 5) {
    return "Just now";
  }

  if (difference < 60) {
    return `${difference} seconds ago`;
  }

  const minutes = Math.floor(
    difference / 60
  );

  if (minutes < 60) {
    return `${minutes} minute${
      minutes !== 1 ? "s" : ""
    } ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  return `${hours} hour${
    hours !== 1 ? "s" : ""
  } ago`;
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const LiveMap = () => {
  // ===================================================
  // TOURISTS
  // ===================================================

  const [tourists, setTourists] = useState([]);

  // ===================================================
  // SEARCH
  // ===================================================

  const [search, setSearch] = useState("");

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

  const [loading, setLoading] = useState(false);

  // ===================================================
  // ERROR
  // ===================================================

  const [error, setError] = useState("");

  // ===================================================
  // MAP REFS
  // ===================================================

  const mapContainerRef = useRef(null);

  const mapRef = useRef(null);

  const markersRef = useRef(new Map());

  const popupRef = useRef(null);

  // ===================================================
  // FETCH ACTIVE TOURISTS
  // ===================================================

  const fetchLiveLocations = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/location/active`
        );

        if (!response.ok) {
          throw new Error(
            `Server returned ${response.status}`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.message ||
              "Unable to fetch tourists"
          );
        }

        // =============================================
        // FORMAT DATABASE DATA
        // =============================================

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

              latitude: Number(
                tourist.latitude
              ),

              longitude: Number(
                tourist.longitude
              ),

              accuracy:
                tourist.accuracy !== null &&
                tourist.accuracy !== undefined
                  ? Number(
                      tourist.accuracy
                    )
                  : null,

              safety: "Safe",

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

        // =============================================
        // UPDATE SELECTED TOURIST
        // =============================================

        setSelectedTourist(
          (currentSelected) => {
            if (!currentSelected) {
              return null;
            }

            const updated =
              formattedTourists.find(
                (tourist) =>
                  tourist.id ===
                  currentSelected.id
              );

            return updated || null;
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
  }, [fetchLiveLocations]);

  // ===================================================
  // AUTO REFRESH
  // ===================================================

  useEffect(() => {
    const interval = setInterval(
      () => {
        fetchLiveLocations();
      },
      5000
    );

    return () => {
      clearInterval(interval);
    };
  }, [fetchLiveLocations]);

  // ===================================================
  // SEARCH
  // ===================================================

  const onlineTourists =
    tourists.filter(
      (tourist) =>
        tourist.isOnline
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
            .includes(value) ||

          tourist.email
            ?.toLowerCase()
            .includes(value) ||

          tourist.touristId
            ?.toLowerCase()
            .includes(value) ||

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
        tourist.safety === "Safe"
    ).length;

  const warningTourists =
    tourists.filter(
      (tourist) =>
        tourist.safety === "Warning"
    ).length;

  const dangerTourists =
    tourists.filter(
      (tourist) =>
        tourist.safety === "Danger"
    ).length;

  // ===================================================
  // CREATE POPUP HTML
  // ===================================================

  const createPopupHTML = (tourist) => {
    const safetyClass =
      tourist.safety.toLowerCase();

    const accuracyText =
      tourist.accuracy !== null
        ? `±${tourist.accuracy.toFixed(
            1
          )} meters`
        : "Not available";

    return `
      <div class="admin-map-popup">

        <div class="admin-popup-header">

          <div>
            <h3>
              ${escapeHTML(
                tourist.name || "Tourist"
              )}
            </h3>

            <span>
              ${escapeHTML(
                tourist.touristId || "N/A"
              )}
            </span>
          </div>

          <button
            class="admin-popup-close"
            type="button"
            aria-label="Close"
          >
            ×
          </button>

        </div>

        <div class="admin-popup-content">

          <div class="admin-popup-row">
            <strong>Email</strong>
            <span>
              ${escapeHTML(
                tourist.email || "N/A"
              )}
            </span>
          </div>

          <div class="admin-popup-row">
            <strong>Mobile</strong>
            <span>
              ${escapeHTML(
                tourist.mobile || "N/A"
              )}
            </span>
          </div>

          <div class="admin-popup-row">
            <strong>Status</strong>

            <span
              class="popup-safety ${safetyClass}"
            >
              ${escapeHTML(
                tourist.safety
              )}
            </span>
          </div>

          <div class="admin-popup-row">
            <strong>Coordinates</strong>

            <span>
              ${tourist.latitude.toFixed(
                6
              )},
              ${tourist.longitude.toFixed(
                6
              )}
            </span>
          </div>

          <div class="admin-popup-row">
            <strong>Accuracy</strong>

            <span>
              ${accuracyText}
            </span>
          </div>

          <div class="admin-popup-row">
            <strong>Last Updated</strong>

            <span>
              ${escapeHTML(
                tourist.lastUpdated
              )}
            </span>
          </div>

        </div>

      </div>
    `;
  };

  // ===================================================
  // ESCAPE HTML
  // ===================================================

  const escapeHTML = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // ===================================================
  // SELECT TOURIST
  // ===================================================

  const handleSelectTourist = useCallback(
    (tourist) => {
      setSelectedTourist(tourist);

      const map = mapRef.current;

      if (!map) {
        return;
      }

      if (
        !Number.isFinite(
          tourist.latitude
        ) ||
        !Number.isFinite(
          tourist.longitude
        )
      ) {
        return;
      }

      map.flyTo({
        center: [
          tourist.longitude,
          tourist.latitude,
        ],
        zoom: 16,
        duration: 700,
      });

      const marker =
        markersRef.current.get(
          tourist.id
        );

      if (marker) {
        marker.togglePopup();
      }
    },
    []
  );

  // ===================================================
  // INITIALIZE MAP
  // ===================================================

  useEffect(() => {
    const container =
      mapContainerRef.current;

    if (!container) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    console.log(
      "ADMIN - INITIALIZING LIBERTY MAP"
    );

    const map = new maplibregl.Map({
      container,
      style: LIBERTY_STYLE,

      center: [
        DEFAULT_LOCATION.lng,
        DEFAULT_LOCATION.lat,
      ],

      zoom: 13,

      pitch: 0,

      bearing: 0,

      attributionControl: true,

      cooperativeGestures: false,
    });

    mapRef.current = map;

    // ===============================================
    // NAVIGATION CONTROL
    // ===============================================

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      "top-right"
    );

    // ===============================================
    // FULLSCREEN
    // ===============================================

    map.addControl(
      new maplibregl.FullscreenControl(),
      "top-right"
    );

    // ===============================================
    // MAP LOAD
    // ===============================================

    map.on("load", () => {
      console.log(
        "ADMIN - LIBERTY MAP LOADED"
      );

      map.resize();
    });

    // ===============================================
    // MAP ERROR
    // ===============================================

    map.on("error", (event) => {
      console.error(
        "ADMIN - MAPLIBRE ERROR:",
        event
      );
    });

    // ===============================================
    // CLEANUP
    // ===============================================

    return () => {
      console.log(
        "ADMIN - DESTROYING MAP"
      );

      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }

      markersRef.current.forEach(
        (marker) => {
          marker.remove();
        }
      );

      markersRef.current.clear();

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ===================================================
  // UPDATE TOURIST MARKERS
  // ===================================================

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    // ===============================================
    // REMOVE MARKERS THAT ARE NO LONGER PRESENT
    // ===============================================

    const currentTouristIds =
      new Set(
        filteredTourists.map(
          (tourist) =>
            tourist.id
        )
      );

    markersRef.current.forEach(
      (marker, touristId) => {
        if (
          !currentTouristIds.has(
            touristId
          )
        ) {
          marker.remove();

          markersRef.current.delete(
            touristId
          );
        }
      }
    );

    // ===============================================
    // CREATE / UPDATE MARKERS
    // ===============================================

    filteredTourists.forEach(
      (tourist) => {
        if (
          !Number.isFinite(
            tourist.latitude
          ) ||
          !Number.isFinite(
            tourist.longitude
          )
        ) {
          return;
        }

        const existingMarker =
          markersRef.current.get(
            tourist.id
          );

        // ===========================================
        // UPDATE EXISTING MARKER
        // ===========================================

        if (existingMarker) {
          existingMarker.setLngLat([
            tourist.longitude,
            tourist.latitude,
          ]);

          return;
        }

        // ===========================================
        // CREATE NEW MARKER
        // ===========================================

        const markerElement =
          createTouristMarker(
            tourist.safety
          );

        const marker =
          new maplibregl.Marker({
            element: markerElement,
            anchor: "center",
          })
            .setLngLat([
              tourist.longitude,
              tourist.latitude,
            ])
            .addTo(map);

        // ===========================================
        // MARKER CLICK
        // ===========================================

        markerElement.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();

            handleSelectTourist(
              tourist
            );
          }
        );

        // ===========================================
        // POPUP
        // ===========================================

        const popup =
          new maplibregl.Popup({
            offset: 25,

            closeButton: false,

            closeOnClick: false,

            maxWidth: "330px",
          }).setHTML(
            createPopupHTML(
              tourist
            )
          );

        marker.setPopup(popup);

        // ===========================================
        // POPUP OPEN
        // ===========================================

        popup.on("open", () => {
          const popupElement =
            popup.getElement();

          if (!popupElement) {
            return;
          }

          const closeButton =
            popupElement.querySelector(
              ".admin-popup-close"
            );

          if (closeButton) {
            closeButton.addEventListener(
              "click",
              () => {
                popup.remove();

                setSelectedTourist(
                  null
                );
              }
            );
          }

          popupRef.current =
            popup;
        });

        // ===========================================
        // POPUP CLOSE
        // ===========================================

        popup.on("close", () => {
          if (
            popupRef.current ===
            popup
          ) {
            popupRef.current = null;
          }
        });

        markersRef.current.set(
          tourist.id,
          marker
        );
      }
    );
  }, [
    filteredTourists,
    handleSelectTourist,
  ]);

  // ===================================================
  // UPDATE MARKER POSITION / POPUP DATA
  // ===================================================

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    filteredTourists.forEach(
      (tourist) => {
        const marker =
          markersRef.current.get(
            tourist.id
          );

        if (!marker) {
          return;
        }

        if (
          Number.isFinite(
            tourist.latitude
          ) &&
          Number.isFinite(
            tourist.longitude
          )
        ) {
          marker.setLngLat([
            tourist.longitude,
            tourist.latitude,
          ]);
        }

        const popup =
          marker.getPopup();

        if (popup) {
          popup.setHTML(
            createPopupHTML(
              tourist
            )
          );
        }
      }
    );
  }, [filteredTourists]);

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
              disabled={loading}
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
            <div className="live-map-error">

              <span>
                {error}
              </span>

              <button
                onClick={() =>
                  setError("")
                }
                aria-label="Close error"
              >
                <X size={16} />
              </button>

            </div>
          )}

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
              MAP
          ================================================= */}

          <div className="live-map-container">

            {/* =================================================
                SEARCH PANEL
            ================================================= */}

            <div className="map-search-panel">

              {/* SEARCH */}

              <div className="map-search">

                <Search size={18} />

                <input
                  type="text"
                  placeholder="Search tourist..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
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
                  <div className="map-no-users">

                    {loading
                      ? "Loading tourists..."
                      : "No active tourists"}

                  </div>
                )}

              </div>

            </div>

            {/* =================================================
                MAPLIBRE MAP
            ================================================= */}

            <div
              ref={mapContainerRef}
              className="admin-live-map"
            />

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