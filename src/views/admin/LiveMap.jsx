import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

maplibregl.setWorkerUrl(workerUrl);

import {
  Search,
  MapPin,
  Users,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  LocateFixed,
  Box,
  Square,
  X,
} from "lucide-react";

import Asidebar from "./asidebar";

import "../../style/admin.css";


// ============================================================
// CONFIGURATION
// ============================================================

const DEFAULT_LOCATION = {
  lat: 19.076,
  lng: 72.8777,
};

const MAP_STYLE =
  "https://tiles.openfreemap.org/styles/liberty";

const BRIGHT_MAP_STYLE =
  "https://tiles.openfreemap.org/styles/bright";


// IMPORTANT:
// Empty string means same-domain API.
//
// Example:
//
// https://your-ngrok-url.com
//        |
//        └── /api/location/active
//
// This avoids localhost problems on mobile/ngrok.

const API_URL =
  import.meta.env.VITE_API_URL || "";

const ACTIVE_LOCATION_API =
  `${API_URL}/api/location/active`;


// ============================================================
// HELPERS
// ============================================================

const toNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};


const toBoolean = (value) => {
  if (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "TRUE" ||
    value === "True" ||
    value === "yes" ||
    value === "YES"
  ) {
    return true;
  }

  return false;
};


const normalizeSafety = (value) => {
  const safety = String(
    value || "Safe"
  )
    .trim()
    .toLowerCase();

  if (safety === "danger") {
    return "Danger";
  }

  if (safety === "warning") {
    return "Warning";
  }

  return "Safe";
};


const safetyClass = (value) => {
  return normalizeSafety(value)
    .toLowerCase();
};


const isValidCoordinate = (
  latitude,
  longitude
) => {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};


const formatLastUpdated = (
  date
) => {
  if (!date) {
    return "Unknown";
  }

  const updated =
    new Date(date);

  if (
    Number.isNaN(
      updated.getTime()
    )
  ) {
    return "Unknown";
  }

  const now =
    new Date();

  const difference =
    Math.max(
      0,
      Math.floor(
        (
          now.getTime() -
          updated.getTime()
        ) / 1000
      )
    );

  if (difference < 5) {
    return "Just now";
  }

  if (difference < 60) {
    return `${difference} seconds ago`;
  }

  const minutes =
    Math.floor(
      difference / 60
    );

  if (minutes < 60) {
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


// ============================================================
// HTML SAFETY
// ============================================================

const escapeHtml = (
  value
) => {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
};


// ============================================================
// TOURIST MARKER HTML
// ============================================================

const createTouristMarker = (
  tourist
) => {

  const element =
    document.createElement(
      "div"
    );

  element.className =
    `admin-tourist-marker ${safetyClass(
      tourist.safety
    )}`;

  element.innerHTML = `
    <div class="tourist-marker-wrapper">

      <div class="tourist-location-ring"></div>

      <div class="tourist-marker-pulse"></div>

      <div class="tourist-pin">

        <div class="tourist-pin-head">
          <span>T</span>
        </div>

      </div>

      <div class="tourist-marker-label">

        <span class="tourist-label-name">
          ${escapeHtml(
            tourist.name ||
            "Tourist"
          )}
        </span>

        <span class="tourist-label-status">
          ${escapeHtml(
            tourist.safety ||
            "Safe"
          )}
        </span>

      </div>

    </div>
  `;

  element.title =
    tourist.name ||
    tourist.touristId ||
    "Tourist";

  return element;
};


// ============================================================
// UPDATE MARKER HTML
// ============================================================

const updateTouristMarker = (
  element,
  tourist,
  selected
) => {

  element.className =
    `admin-tourist-marker ${
      safetyClass(
        tourist.safety
      )
    } ${
      selected
        ? "selected"
        : ""
    }`;

  const nameElement =
    element.querySelector(
      ".tourist-label-name"
    );

  const statusElement =
    element.querySelector(
      ".tourist-label-status"
    );

  if (nameElement) {
    nameElement.textContent =
      tourist.name ||
      "Tourist";
  }

  if (statusElement) {
    statusElement.textContent =
      tourist.safety ||
      "Safe";
  }

  element.title =
    tourist.name ||
    tourist.touristId ||
    "Tourist";
};


// ============================================================
// ADD 3D BUILDINGS
// ============================================================

const add3DBuildings = (
  map
) => {

  if (!map) {
    return;
  }

  try {

    if (
      map.getLayer(
        "toursafe-3d-buildings"
      )
    ) {
      return;
    }

    const style =
      map.getStyle();

    const layers =
      style?.layers || [];

    let labelLayerId =
      undefined;

    for (
      const layer of layers
    ) {

      if (
        layer.type ===
          "symbol" &&
        layer.layout &&
        layer.layout[
          "text-field"
        ]
      ) {

        labelLayerId =
          layer.id;

        break;
      }
    }

    if (
      !map.getSource(
        "openmaptiles"
      )
    ) {
      console.warn(
        "OpenFreeMap openmaptiles source not found."
      );

      return;
    }

    map.addLayer(
      {
        id:
          "toursafe-3d-buildings",

        source:
          "openmaptiles",

        "source-layer":
          "building",

        type:
          "fill-extrusion",

        minzoom:
          14,

        paint: {

          // Normal grey buildings
          "fill-extrusion-color":
            "#9e9e9e",

          "fill-extrusion-height":
            [
              "coalesce",
              [
                "get",
                "render_height",
              ],
              10,
            ],

          "fill-extrusion-base":
            [
              "coalesce",
              [
                "get",
                "render_min_height",
              ],
              0,
            ],

          "fill-extrusion-opacity":
            0.75,
        },
      },
      labelLayerId
    );

  } catch (error) {

    console.warn(
      "Unable to add 3D buildings:",
      error
    );

  }
};


// ============================================================
// MAIN COMPONENT
// ============================================================

const LiveMap = () => {

  // ==========================================================
  // REFS
  // ==========================================================

  const mapContainerRef =
    useRef(null);

  const mapRef =
    useRef(null);

  const markersRef =
    useRef(new Map());

  const popupRef =
    useRef(null);

  const selectedIdRef =
    useRef(null);

  const hasInitialFitRef =
    useRef(false);


  // ==========================================================
  // STATE
  // ==========================================================

  const [tourists, setTourists] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [selectedTourist, setSelectedTourist] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mapReady, setMapReady] =
    useState(false);

  const [is3D, setIs3D] =
    useState(false);

  const [showStyleMenu, setShowStyleMenu] =
    useState(false);


  // ==========================================================
  // KEEP SELECTED ID IN REF
  // ==========================================================

  useEffect(() => {

    selectedIdRef.current =
      selectedTourist?.id ??
      null;

  }, [
    selectedTourist,
  ]);


  // ==========================================================
  // FETCH LIVE TOURISTS
  // ==========================================================

  const fetchLiveLocations =
    useCallback(
      async () => {

        try {

          setLoading(true);

          setError("");

          const response =
            await fetch(
              ACTIVE_LOCATION_API,
              {
                method:
                  "GET",

                headers: {
                  Accept:
                    "application/json",
                },

                cache:
                  "no-store",
              }
            );

          if (
            !response.ok
          ) {

            throw new Error(
              `Server returned ${response.status}`
            );

          }

          const data =
            await response.json();

          console.log(
            "LIVE MAP RESPONSE:",
            data
          );

          if (
            !data.success
          ) {

            throw new Error(
              data.message ||
              "Unable to fetch tourists"
            );

          }


          // ==================================================
          // GET TOURIST ARRAY
          // ==================================================

          const rawTourists =
            Array.isArray(
              data.tourists
            )
              ? data.tourists
              : Array.isArray(
                  data.data
                )
              ? data.data
              : [];


          // ==================================================
          // NORMALIZE TOURISTS
          // ==================================================

          const formattedTourists =
            rawTourists
              .map(
                (
                  tourist,
                  index
                ) => {

                  const latitude =
                    toNumber(
                      tourist.latitude ??
                      tourist.lat
                    );

                  const longitude =
                    toNumber(
                      tourist.longitude ??
                      tourist.lng ??
                      tourist.lon
                    );

                  if (
                    !isValidCoordinate(
                      latitude,
                      longitude
                    )
                  ) {
                    return null;
                  }


                  const id =
                    tourist.id ??
                    tourist.user_id ??
                    tourist.userId ??
                    tourist.tourist_id ??
                    `tourist-${index}`;


                  const touristId =
                    tourist.tourist_id ??
                    tourist.touristId ??
                    tourist.id ??
                    `TOURIST-${id}`;


                  const updatedAt =
                    tourist.updated_at ??
                    tourist.updatedAt ??
                    tourist.last_updated ??
                    null;


                  return {

                    id: String(
                      id
                    ),

                    touristId:
                      String(
                        touristId
                      ),

                    name:
                      tourist.full_name ??
                      tourist.name ??
                      "Unknown Tourist",

                    email:
                      tourist.email ??
                      "",

                    mobile:
                      tourist.phone ??
                      tourist.mobile ??
                      "",

                    latitude,

                    longitude,

                    accuracy:
                      toNumber(
                        tourist.accuracy
                      ),

                    safety:
                      normalizeSafety(
                        tourist.safety
                      ),

                    updatedAt,

                    lastUpdated:
                      formatLastUpdated(
                        updatedAt
                      ),

                    isTracking:
                      toBoolean(
                        tourist.is_tracking ??
                        tourist.isTracking
                      ),

                    isOnline:
                      toBoolean(
                        tourist.is_online ??
                        tourist.isOnline ??
                        tourist.online
                      ),

                  };
                }
              )
              .filter(Boolean);


          console.log(
            "NORMALIZED TOURISTS:",
            formattedTourists
          );


          setTourists(
            formattedTourists
          );


          // ==================================================
          // UPDATE SELECTED TOURIST DATA
          // ==================================================

          setSelectedTourist(
            current => {

              if (!current) {
                return null;
              }

              return (
                formattedTourists.find(
                  tourist =>
                    String(
                      tourist.id
                    ) ===
                    String(
                      current.id
                    )
                ) ||
                null
              );

            }
          );

        } catch (
          fetchError
        ) {

          console.error(
            "Live Map Error:",
            fetchError
          );

          setError(
            fetchError.message ||
            "Unable to connect to the backend."
          );

        } finally {

          setLoading(false);

        }

      },
      []
    );


  // ==========================================================
  // INITIAL FETCH
  // ==========================================================

  useEffect(() => {

    fetchLiveLocations();

  }, [
    fetchLiveLocations,
  ]);


  // ==========================================================
  // AUTO REFRESH
  // ==========================================================

  useEffect(() => {

    const interval =
      setInterval(
        fetchLiveLocations,
        3000
      );

    return () => {
      clearInterval(
        interval
      );
    };

  }, [
    fetchLiveLocations,
  ]);


  // ==========================================================
  // INITIALIZE MAP
  // ==========================================================

  useEffect(() => {

    if (
      !mapContainerRef.current
    ) {
      return;
    }

    if (
      mapRef.current
    ) {
      return;
    }


    const map =
      new maplibregl.Map({

        container:
          mapContainerRef.current,

        style:
          MAP_STYLE,

        center: [
          DEFAULT_LOCATION.lng,
          DEFAULT_LOCATION.lat,
        ],

        zoom:
          11,

        pitch:
          0,

        bearing:
          0,

        attributionControl:
          true,

        dragRotate:
          true,

        touchPitch:
          true,

      });


    mapRef.current =
      map;


    // ========================================================
    // NAVIGATION CONTROL
    // ========================================================

    map.addControl(
      new maplibregl.NavigationControl(
        {
          showCompass:
            true,

          showZoom:
            true,

          visualizePitch:
            true,
        }
      ),
      "top-right"
    );


    // ========================================================
    // SCALE
    // ========================================================

    map.addControl(
      new maplibregl.ScaleControl(
        {
          maxWidth:
            120,

          unit:
            "metric",
        }
      ),
      "bottom-left"
    );


    // ========================================================
    // MAP LOAD
    // ========================================================

    map.on(
      "load",
      () => {

        console.log(
          "Admin MapLibre map loaded"
        );

        setMapReady(
          true
        );

        add3DBuildings(
          map
        );

        setTimeout(
          () => {
            map.resize();
          },
          150
        );

      }
    );


    // ========================================================
    // MAP ERROR
    // ========================================================

    map.on(
      "error",
      event => {

        console.error(
          "ADMIN MAPLIBRE ERROR:",
          event
        );

      }
    );


    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {

      if (
        popupRef.current
      ) {

        popupRef.current.remove();

        popupRef.current =
          null;

      }


      markersRef.current.forEach(
        marker => {
          marker.remove();
        }
      );


      markersRef.current.clear();


      map.remove();


      mapRef.current =
        null;


      setMapReady(
        false
      );

    };

  }, []);


  // ==========================================================
  // SHOW TOURIST POPUP
  // ==========================================================

  const showTouristPopup =
    useCallback(
      (
        map,
        tourist
      ) => {

        if (
          !map ||
          !tourist
        ) {
          return;
        }


        if (
          popupRef.current
        ) {

          popupRef.current.remove();

          popupRef.current =
            null;

        }


        const status =
          normalizeSafety(
            tourist.safety
          );


        const accuracyText =
          tourist.accuracy !== null
            ? `±${tourist.accuracy.toFixed(
                1
              )} m`
            : "Not available";


        const popupContent = `
          <div class="admin-map-popup">

            <div class="admin-popup-header">

              <div class="admin-popup-avatar">
                T
              </div>

              <div class="admin-popup-title">

                <h3>
                  ${escapeHtml(
                    tourist.name ||
                    "Unknown Tourist"
                  )}
                </h3>

                <span>
                  ${escapeHtml(
                    tourist.touristId ||
                    "No Tourist ID"
                  )}
                </span>

              </div>

            </div>


            <div class="admin-popup-status ${safetyClass(
              status
            )}">

              <span></span>

              ${escapeHtml(
                status
              )}

            </div>


            <div class="admin-popup-row">

              <strong>
                Email
              </strong>

              <span>
                ${escapeHtml(
                  tourist.email ||
                  "Not available"
                )}
              </span>

            </div>


            <div class="admin-popup-row">

              <strong>
                Mobile
              </strong>

              <span>
                ${escapeHtml(
                  tourist.mobile ||
                  "Not available"
                )}
              </span>

            </div>


            <div class="admin-popup-row">

              <strong>
                Latitude
              </strong>

              <span>
                ${tourist.latitude.toFixed(
                  6
                )}
              </span>

            </div>


            <div class="admin-popup-row">

              <strong>
                Longitude
              </strong>

              <span>
                ${tourist.longitude.toFixed(
                  6
                )}
              </span>

            </div>


            <div class="admin-popup-row">

              <strong>
                Accuracy
              </strong>

              <span>
                ${accuracyText}
              </span>

            </div>


            <div class="admin-popup-row">

              <strong>
                Tracking
              </strong>

              <span>
                ${
                  tourist.isTracking
                    ? "Active"
                    : "Inactive"
                }
              </span>

            </div>


            <div class="admin-popup-row">

              <strong>
                Last Updated
              </strong>

              <span>
                ${escapeHtml(
                  tourist.lastUpdated
                )}
              </span>

            </div>

          </div>
        `;


        const popup =
          new maplibregl.Popup(
            {
              closeButton:
                true,

              closeOnClick:
                false,

              maxWidth:
                "340px",

              offset:
                32,
            }
          )
            .setLngLat([
              tourist.longitude,
              tourist.latitude,
            ])
            .setHTML(
              popupContent
            )
            .addTo(map);


        popupRef.current =
          popup;


        popup.on(
          "close",
          () => {

            if (
              popupRef.current ===
              popup
            ) {

              popupRef.current =
                null;

            }

          }
        );

      },
      []
    );


  // ==========================================================
  // ONLINE TOURISTS
  // ==========================================================

  const onlineTourists =
    tourists.filter(
      tourist =>
        tourist.isOnline
    );


  // ==========================================================
  // UPDATE MAP MARKERS
  // ==========================================================

  useEffect(() => {

    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady
    ) {
      return;
    }


    const currentIds =
      new Set(
        onlineTourists.map(
          tourist =>
            String(
              tourist.id
            )
        )
      );


    // ========================================================
    // REMOVE OLD MARKERS
    // ========================================================

    markersRef.current.forEach(
      (
        marker,
        id
      ) => {

        if (
          !currentIds.has(
            String(id)
          )
        ) {

          marker.remove();

          markersRef.current.delete(
            id
          );

        }

      }
    );


    // ========================================================
    // CREATE / UPDATE MARKERS
    // ========================================================

    onlineTourists.forEach(
      tourist => {

        const id =
          String(
            tourist.id
          );


        const coordinates = [
          tourist.longitude,
          tourist.latitude,
        ];


        let marker =
          markersRef.current.get(
            id
          );


        const isSelected =
          String(
            selectedIdRef.current
          ) ===
          String(id);


        // ====================================================
        // CREATE MARKER
        // ====================================================

        if (!marker) {

          const element =
            createTouristMarker(
              tourist
            );


          updateTouristMarker(
            element,
            tourist,
            isSelected
          );


          marker =
            new maplibregl.Marker(
              {
                element,

                anchor:
                  "center",

                offset:
                  [0, 0],
              }
            )
              .setLngLat(
                coordinates
              )
              .addTo(map);


          // ==================================================
          // MARKER CLICK
          // ==================================================

          element.addEventListener(
            "click",
            event => {

              event.stopPropagation();


              selectedIdRef.current =
                tourist.id;


              setSelectedTourist(
                tourist
              );


              // Update all marker states
              markersRef.current.forEach(
                existingMarker => {

                  const existingElement =
                    existingMarker.getElement();

                  const existingId =
                    existingElement.dataset
                      .touristId;

                  if (
                    existingId
                  ) {

                    existingElement.classList.toggle(
                      "selected",
                      String(
                        existingId
                      ) ===
                      String(
                        tourist.id
                      )
                    );

                  }

                }
              );


              element.classList.add(
                "selected"
              );


              map.flyTo(
                {
                  center: [
                    tourist.longitude,
                    tourist.latitude,
                  ],

                  zoom:
                    16,

                  pitch:
                    is3D
                      ? 55
                      : 0,

                  bearing:
                    is3D
                      ? -15
                      : 0,

                  duration:
                    900,

                  essential:
                    true,
                }
              );


              showTouristPopup(
                map,
                tourist
              );

            }
          );


          markersRef.current.set(
            id,
            marker
          );

        } else {

          // ==================================================
          // UPDATE EXISTING MARKER
          // ==================================================

          marker.setLngLat(
            coordinates
          );


          const element =
            marker.getElement();


          updateTouristMarker(
            element,
            tourist,
            isSelected
          );

        }


        // ======================================================
        // STORE TOURIST ID ON DOM ELEMENT
        // ======================================================

        const markerElement =
          marker.getElement();

        markerElement.dataset
          .touristId =
          id;

      }
    );


    // ========================================================
    // REMOVE SELECTED STATE FROM OLD MARKERS
    // ========================================================

    markersRef.current.forEach(
      marker => {

        const element =
          marker.getElement();

        const markerId =
          element.dataset
            .touristId;

        element.classList.toggle(
          "selected",
          String(
            markerId
          ) ===
          String(
            selectedIdRef.current
          )
        );

      }
    );


    // ========================================================
    // INITIAL FIT
    // ========================================================

    if (
      onlineTourists.length >
        0 &&
      !hasInitialFitRef.current
    ) {

      hasInitialFitRef.current =
        true;


      setTimeout(
        () => {

          const bounds =
            new maplibregl.LngLatBounds();


          onlineTourists.forEach(
            tourist => {

              bounds.extend([
                tourist.longitude,
                tourist.latitude,
              ]);

            }
          );


          if (
            onlineTourists.length ===
            1
          ) {

            const tourist =
              onlineTourists[0];


            map.flyTo(
              {
                center: [
                  tourist.longitude,
                  tourist.latitude,
                ],

                zoom:
                  15.5,

                pitch:
                  is3D
                    ? 55
                    : 0,

                bearing:
                  is3D
                    ? -15
                    : 0,

                duration:
                  1000,

                essential:
                  true,
              }
            );

          } else {

            map.fitBounds(
              bounds,
              {
                padding: {
                  top:
                    120,

                  right:
                    100,

                  bottom:
                    120,

                  left:
                    380,
                },

                maxZoom:
                  15,

                duration:
                  1000,

                essential:
                  true,
              }
            );

          }

        },
        250
      );

    }


  }, [
    tourists,
    mapReady,
    onlineTourists.length,
    showTouristPopup,
    is3D,
  ]);


  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredTourists =
    onlineTourists.filter(
      tourist => {

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
            .includes(
              value
            )

          ||

          tourist.email
            ?.toLowerCase()
            .includes(
              value
            )

          ||

          tourist.touristId
            ?.toLowerCase()
            .includes(
              value
            )

          ||

          tourist.mobile
            ?.toLowerCase()
            .includes(
              value
            )

        );

      }
    );


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalTourists =
    onlineTourists.length;


  const safeTourists =
    onlineTourists.filter(
      tourist =>
        tourist.safety ===
        "Safe"
    ).length;


  const warningTourists =
    onlineTourists.filter(
      tourist =>
        tourist.safety ===
        "Warning"
    ).length;


  const dangerTourists =
    onlineTourists.filter(
      tourist =>
        tourist.safety ===
        "Danger"
    ).length;


  // ==========================================================
  // SELECT TOURIST FROM LIST
  // ==========================================================

  const handleSelectTourist =
    tourist => {

      const map =
        mapRef.current;

      if (!map) {
        return;
      }


      selectedIdRef.current =
        tourist.id;


      setSelectedTourist(
        tourist
      );


      // ======================================================
      // UPDATE MARKER HIGHLIGHT
      // ======================================================

      markersRef.current.forEach(
        marker => {

          const element =
            marker.getElement();

          const markerId =
            element.dataset
              .touristId;

          element.classList.toggle(
            "selected",
            String(
              markerId
            ) ===
            String(
              tourist.id
            )
          );

        }
      );


      // ======================================================
      // MOVE MAP
      // ======================================================

      map.flyTo(
        {
          center: [
            tourist.longitude,
            tourist.latitude,
          ],

          zoom:
            16,

          pitch:
            is3D
              ? 55
              : 0,

          bearing:
            is3D
              ? -15
              : 0,

          duration:
            900,

          essential:
            true,
        }
      );


      // ======================================================
      // SHOW POPUP ONLY WHEN SELECTED
      // ======================================================

      showTouristPopup(
        map,
        tourist
      );

    };


  // ==========================================================
  // FIT ALL TOURISTS
  // ==========================================================

  const fitAllTourists =
    () => {

      const map =
        mapRef.current;

      if (
        !map ||
        onlineTourists.length ===
          0
      ) {
        return;
      }


      if (
        onlineTourists.length ===
        1
      ) {

        const tourist =
          onlineTourists[0];


        map.flyTo(
          {
            center: [
              tourist.longitude,
              tourist.latitude,
            ],

            zoom:
              15.5,

            pitch:
              is3D
                ? 55
                : 0,

            bearing:
              is3D
                ? -15
                : 0,

            duration:
              900,

            essential:
              true,
          }
        );


        return;
      }


      const bounds =
        new maplibregl.LngLatBounds();


      onlineTourists.forEach(
        tourist => {

          bounds.extend([
            tourist.longitude,
            tourist.latitude,
          ]);

        }
      );


      map.fitBounds(
        bounds,
        {
          padding: {
            top:
              120,

            right:
              100,

            bottom:
              120,

            left:
              380,
          },

          maxZoom:
            15,

          duration:
            900,

          essential:
            true,
        }
      );

    };


  // ==========================================================
  // TOGGLE 3D
  // ==========================================================

  const toggle3D =
    () => {

      const map =
        mapRef.current;

      if (!map) {
        return;
      }


      const next =
        !is3D;


      setIs3D(
        next
      );


      map.easeTo(
        {
          pitch:
            next
              ? 55
              : 0,

          bearing:
            next
              ? -15
              : 0,

          duration:
            800,

          essential:
            true,
        }
      );

    };


  // ==========================================================
  // CHANGE MAP STYLE
  // ==========================================================

  const changeMapStyle =
    style => {

      const map =
        mapRef.current;

      if (!map) {
        return;
      }


      setShowStyleMenu(
        false
      );


      map.setStyle(
        style
      );


      map.once(
        "style.load",
        () => {

          add3DBuildings(
            map
          );


          setTimeout(
            () => {
              map.resize();
            },
            100
          );

        }
      );

    };


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="admin-layout">

      <Asidebar />


      <main className="admin-main">

        <div className="live-map-page">


          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="live-map-header">

            <div>

              <h1>
                Live Map
              </h1>

              <p>
                Monitor the real-time
                location of registered
                tourists
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
              type="button"
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


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div className="live-map-error">

              {error}

            </div>

          )}


          {/* ==================================================
              STATISTICS
          ================================================== */}

          <div className="live-map-stats">


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


          {/* ==================================================
              MAP
          ================================================== */}

          <div className="live-map-container">


            {/* =================================================
                SEARCH
            ================================================= */}

            <div className="map-search-panel">

              <div className="map-search">

                <Search
                  size={18}
                />

                <input
                  type="text"
                  placeholder="Search tourist..."
                  value={search}
                  onChange={
                    event =>
                      setSearch(
                        event.target.value
                      )
                  }
                />


                {search && (

                  <button
                    className="map-search-clear"
                    onClick={() =>
                      setSearch("")
                    }
                    type="button"
                  >

                    <X
                      size={15}
                    />

                  </button>

                )}

              </div>


              <div className="map-user-list">

                {filteredTourists.length >
                0 ? (

                  filteredTourists.map(
                    tourist => (

                      <button
                        key={
                          tourist.id
                        }

                        type="button"

                        className={
                          `map-user-item ${
                            String(
                              selectedTourist?.id
                            ) ===
                            String(
                              tourist.id
                            )
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
                              safetyClass(
                                tourist.safety
                              )
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

                  <div className="map-empty">

                    {loading
                      ? "Loading tourists..."
                      : onlineTourists.length === 0
                      ? "No active tourists"
                      : "No tourist found"}

                  </div>

                )}

              </div>

            </div>


            {/* =================================================
                MAP
            ================================================= */}

            <div
              ref={
                mapContainerRef
              }

              className={
                `admin-live-map ${
                  is3D
                    ? "map-is-3d"
                    : ""
                }`
              }
            />


            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="admin-map-toolbar">

              <button
                type="button"

                className={
                  `admin-map-tool ${
                    is3D
                      ? "active"
                      : ""
                  }`
                }

                onClick={
                  toggle3D
                }

                title={
                  is3D
                    ? "2D Map"
                    : "3D Map"
                }
              >

                {is3D ? (
                  <Square
                    size={18}
                  />
                ) : (
                  <Box
                    size={18}
                  />
                )}

              </button>


              <button
                type="button"

                className="admin-map-tool"

                onClick={
                  fitAllTourists
                }

                title="Show all tourists"
              >

                <LocateFixed
                  size={18}
                />

              </button>


              <button
                type="button"

                className={
                  `admin-map-tool ${
                    showStyleMenu
                      ? "active"
                      : ""
                  }`
                }

                onClick={() =>
                  setShowStyleMenu(
                    current =>
                      !current
                  )
                }

                title="Map style"
              >

                <MapPin
                  size={18}
                />

              </button>

            </div>


            {/* =================================================
                STYLE MENU
            ================================================= */}

            {showStyleMenu && (

              <div className="admin-map-style-menu">

                <button
                  type="button"
                  onClick={() =>
                    changeMapStyle(
                      MAP_STYLE
                    )
                  }
                >
                  Liberty
                </button>


                <button
                  type="button"
                  onClick={() =>
                    changeMapStyle(
                      BRIGHT_MAP_STYLE
                    )
                  }
                >
                  Bright
                </button>

              </div>

            )}


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

                <span className="legend-dot safe" />

                Safe

              </div>


              <div>

                <span className="legend-dot warning" />

                Warning

              </div>


              <div>

                <span className="legend-dot danger" />

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