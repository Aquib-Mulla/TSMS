import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Navbar from "../components/Navbar";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

maplibregl.setWorkerUrl(workerUrl);

import {
  Search,
  X,
  MapPin,
  Navigation,
  LocateFixed,
  Play,
  Square,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Route as RouteIcon,
  Layers,
  Crosshair,
  RefreshCw,
} from "lucide-react";

import "../../style/style.css";

// ============================================================
// CONFIG
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";
      <Navbar />

const MAP_STYLE =
  "https://tiles.openfreemap.org/styles/liberty";

const BRIGHT_MAP_STYLE =
  "https://tiles.openfreemap.org/styles/bright";

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

const OSRM_URL =
  "https://router.project-osrm.org/route/v1";

// ============================================================
// DEFAULT LOCATION
// ============================================================

const DEFAULT_LOCATION = {
  lat: 19.076,
  lng: 72.8777,
};

// ============================================================
// USER ID
// ============================================================

function getStoredUserId() {
  const keys = [
    "userId",
    "user_id",
    "loggedInUser",
    "user",
  ];

  for (const key of keys) {
    const value = localStorage.getItem(key);

    if (!value) {
      continue;
    }

    try {
      const parsed = JSON.parse(value);

      if (typeof parsed === "string") {
        return parsed;
      }

      if (parsed?.id) {
        return parsed.id;
      }

      if (parsed?.userId) {
        return parsed.userId;
      }

      if (parsed?.user_id) {
        return parsed.user_id;
      }
    } catch {
      return value;

    }
  }

  return null;
}

// ============================================================
// FORMAT DISTANCE
// ============================================================

function formatDistance(meters) {
  if (
    meters === null ||
    meters === undefined ||
    !Number.isFinite(meters)
  ) {
    return "--";
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(2)} km`;
}

// ============================================================
// FORMAT TIME
// ============================================================

function formatDuration(seconds) {
  if (
    seconds === null ||
    seconds === undefined ||
    !Number.isFinite(seconds)
  ) {
    return "--";
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 1) {
    return "Less than 1 min";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  const remainingMinutes =
    minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

// ============================================================
// CALCULATE RISK
// ============================================================

function calculateRisk(accuracy) {
  if (
    accuracy === null ||
    accuracy === undefined ||
    !Number.isFinite(accuracy)
  ) {
    return 12;
  }

  if (accuracy > 100) {
    return 35;
  }

  if (accuracy > 50) {
    return 30;
  }

  if (accuracy > 30) {
    return 22;
  }

  if (accuracy > 15) {
    return 16;
  }

  return 12;
}

// ============================================================
// COMPONENT
// ============================================================

export default function Map() {
  // ==========================================================
  // REFS
  // ==========================================================

  const mapContainerRef =
    useRef(null);

  const mapRef =
    useRef(null);

  const userMarkerRef =
    useRef(null);

  const destinationMarkerRef =
    useRef(null);

  const watchIdRef =
    useRef(null);

  const heartbeatRef =
    useRef(null);

  const userLocationRef =
    useRef(DEFAULT_LOCATION);

  const lastAcceptedLocationRef =
    useRef(null);

  const lastAcceptedAccuracyRef =
    useRef(Infinity);

  const lastLocationTimeRef =
    useRef(0);

  const destinationRef =
    useRef(null);

  const routeCoordinatesRef =
    useRef([]);

  const followLocationRef =
    useRef(true);

  // ==========================================================
  // STATE
  // ==========================================================

  const [mapReady, setMapReady] =
    useState(false);

  const [userLocation, setUserLocation] =
    useState(null);

  const [accuracy, setAccuracy] =
    useState(null);

  const [searchText, setSearchText] =
    useState("");

  const [searchResults, setSearchResults] =
    useState([]);

  const [searching, setSearching] =
    useState(false);

  const [showSearchResults, setShowSearchResults] =
    useState(false);

  const [destination, setDestination] =
    useState(null);

  const [tourStarted, setTourStarted] =
    useState(false);

  const [tracking, setTracking] =
    useState(false);

  const [followLocation, setFollowLocation] =
    useState(true);

  const [risk, setRisk] =
    useState(12);

  const [distance, setDistance] =
    useState(null);

  const [duration, setDuration] =
    useState(null);

  const [routeLoading, setRouteLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [routeError, setRouteError] =
    useState("");

  const [sosLoading, setSosLoading] =
    useState(false);

  const [showLayers, setShowLayers] =
    useState(false);

  const [mapStyleMode, setMapStyleMode] =
    useState("standard");

  // ==========================================================
  // KEEP FOLLOW REF UPDATED
  // ==========================================================

  useEffect(() => {
    followLocationRef.current =
      followLocation;
  }, [followLocation]);

// ==========================================================
// GPS VALIDATION
// ==========================================================

const isReliableGPSPosition = useCallback(
  (position) => {

    if (!position?.coords) {
      return false;
    }

    const {
      latitude,
      longitude,
      accuracy,
    } = position.coords;


    // Invalid coordinates
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return false;
    }


    // Invalid accuracy
    if (
      !Number.isFinite(accuracy)
    ) {
      return false;
    }


    // GPS can still be used when accuracy is poor.
    // We will display the actual accuracy to the user.
    if (accuracy > 100) {

      console.warn(
        `GPS accuracy is currently poor: ±${Math.round(
          accuracy
        )} m`
      );

    }


    return true;

  },
  []
);

  // ==========================================================
  // DISTANCE BETWEEN GPS POINTS
  // ==========================================================

  const calculateDistanceBetweenPoints = useCallback(
    (point1, point2) => {
      const earthRadius = 6371000;

      const lat1 =
        (point1.lat * Math.PI) / 180;

      const lat2 =
        (point2.lat * Math.PI) / 180;

      const deltaLat =
        ((point2.lat - point1.lat) * Math.PI) /
        180;

      const deltaLng =
        ((point2.lng - point1.lng) * Math.PI) /
        180;

      const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(deltaLng / 2) ** 2;

      const c =
        2 *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(1 - a)
        );

      return earthRadius * c;
    },
    []
  );

  // ==========================================================
  // PREVENT GPS JUMPS
  // ==========================================================

  const isLocationJumpReasonable =
    useCallback(
      (location, currentAccuracy) => {
        const previous =
          lastAcceptedLocationRef.current;

        if (!previous) {
          return true;
        }

        const distance =
          calculateDistanceBetweenPoints(
            previous,
            location
          );

        const now = Date.now();

        const previousTime =
          lastLocationTimeRef.current ||
          now;

        const elapsedSeconds =
          Math.max(
            (now - previousTime) / 1000,
            1
          );

        const maximumReasonableSpeed =
          70;

        const maximumExpectedDistance =
          maximumReasonableSpeed *
            elapsedSeconds +
          currentAccuracy * 2;

        if (
          distance >
          maximumExpectedDistance
        ) {
          console.warn(
            "Ignoring GPS jump:",
            {
              distance,
              maximumExpectedDistance,
              accuracy:
                currentAccuracy,
            }
          );

          return false;
        }

        return true;
      },
      [calculateDistanceBetweenPoints]
    );

  // ==========================================================
  // CREATE CURRENT LOCATION MARKER
  // ==========================================================

  const createUserMarker =
    useCallback(() => {
      if (!mapRef.current) {
        return;
      }

      const map =
        mapRef.current;

      const location =
        userLocationRef.current;

      const lngLat = [
        location.lng,
        location.lat,
      ];

      // ------------------------------------------------------
      // Remove old marker
      // ------------------------------------------------------

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();

        userMarkerRef.current =
          null;
      }

      // ------------------------------------------------------
      // Create marker element
      // ------------------------------------------------------

      const element =
        document.createElement("div");

      element.className =
        "toursafe-current-marker";

      element.innerHTML = `
        <div class="toursafe-current-marker-pulse"></div>

        <div class="toursafe-current-marker-ring">
          <div class="toursafe-current-marker-dot"></div>
        </div>
      `;

      // ------------------------------------------------------
      // Add marker
      // ------------------------------------------------------

      userMarkerRef.current =
        new maplibregl.Marker({
          element,
          anchor: "center",
        })
          .setLngLat(lngLat)
          .addTo(map);

      // ------------------------------------------------------
      // Remove old accuracy layers
      // ------------------------------------------------------

      if (
        map.getLayer(
          "user-accuracy-fill"
        )
      ) {
        map.removeLayer(
          "user-accuracy-fill"
        );
      }

      if (
        map.getLayer(
          "user-accuracy-line"
        )
      ) {
        map.removeLayer(
          "user-accuracy-line"
        );
      }

      if (
        map.getSource(
          "user-accuracy"
        )
      ) {
        map.removeSource(
          "user-accuracy"
        );
      }

      // ------------------------------------------------------
      // Accuracy circle
      // ------------------------------------------------------

      const currentAccuracy =
        accuracy;

      if (
        !currentAccuracy ||
        currentAccuracy <= 0
      ) {
        return;
      }

      const radius =
        Math.min(
          Math.max(
            currentAccuracy,
            10
          ),
          500
        );

      const circlePoints = [];

      const earthRadius =
        6371000;

      const lat =
        (location.lat * Math.PI) /
        180;

      const lng =
        (location.lng * Math.PI) /
        180;

      for (
        let i = 0;
        i < 64;
        i++
      ) {
        const angle =
          (i / 64) *
          2 *
          Math.PI;

        const dx =
          radius *
          Math.cos(angle);

        const dy =
          radius *
          Math.sin(angle);

        const newLat =
          lat +
          dy / earthRadius;

        const newLng =
          lng +
          dx /
            (earthRadius *
              Math.cos(lat));

        circlePoints.push([
          (newLng * 180) /
            Math.PI,

          (newLat * 180) /
            Math.PI,
        ]);
      }

      circlePoints.push(
        circlePoints[0]
      );

      map.addSource(
        "user-accuracy",
        {
          type: "geojson",

          data: {
            type: "Feature",

            geometry: {
              type: "Polygon",

              coordinates: [
                circlePoints,
              ],
            },
          },
        }
      );

      map.addLayer({
        id: "user-accuracy-fill",

        type: "fill",

        source:
          "user-accuracy",

        paint: {
          "fill-color":
            "#0f766e",

          "fill-opacity":
            0.08,
        },
      });

      map.addLayer({
        id: "user-accuracy-line",

        type: "line",

        source:
          "user-accuracy",

        paint: {
          "line-color":
            "#0f766e",

          "line-width": 1.5,

          "line-opacity":
            0.35,
        },
      });
    }, [accuracy]);

  // ==========================================================
  // UPDATE USER MARKER
  // ==========================================================

  const updateUserMarker =
    useCallback(() => {
      if (!mapRef.current) {
        return;
      }

      if (
        !userMarkerRef.current
      ) {
        createUserMarker();
        return;
      }

      userMarkerRef.current.setLngLat([
        userLocationRef.current.lng,
        userLocationRef.current.lat,
      ]);
    }, [createUserMarker]);

  // ==========================================================
  // CREATE DESTINATION MARKER
  // ==========================================================

  const createDestinationMarker =
    useCallback((place) => {
      if (
        !mapRef.current ||
        !place
      ) {
        return;
      }

      if (
        destinationMarkerRef.current
      ) {
        destinationMarkerRef.current.remove();

        destinationMarkerRef.current =
          null;
      }

      const element =
        document.createElement("div");

      element.className =
        "toursafe-destination-marker";

      element.innerHTML = `
        <div class="toursafe-destination-pin">
          <div class="toursafe-destination-dot"></div>
        </div>
      `;

      destinationMarkerRef.current =
        new maplibregl.Marker({
          element,
          anchor: "bottom",
        })
          .setLngLat([
            Number(place.lon),
            Number(place.lat),
          ])
          .addTo(
            mapRef.current
          );
    }, []);

  // ==========================================================
  // ADD ROUTE LAYERS
  // ==========================================================

  const addRouteLayers =
    useCallback(() => {
      if (!mapRef.current) {
        return;
      }

      const map =
        mapRef.current;

      // ------------------------------------------------------
      // Source
      // ------------------------------------------------------

      if (
        !map.getSource(
          "tour-route"
        )
      ) {
        map.addSource(
          "tour-route",
          {
            type: "geojson",

            data: {
              type: "Feature",

              properties: {},

              geometry: {
                type: "LineString",

                coordinates:
                  routeCoordinatesRef.current,
              },
            },
          }
        );
      }

      // ------------------------------------------------------
      // White outline
      // ------------------------------------------------------

      if (
        !map.getLayer(
          "tour-route-outline"
        )
      ) {
        map.addLayer({
          id: "tour-route-outline",

          type: "line",

          source:
            "tour-route",

          layout: {
            "line-cap":
              "round",

            "line-join":
              "round",
          },

          paint: {
            "line-color":
              "#ffffff",

            "line-width":
              9,

            "line-opacity":
              0.95,
          },
        });
      }

      // ------------------------------------------------------
      // Main route
      // ------------------------------------------------------

      if (
        !map.getLayer(
          "tour-route-line"
        )
      ) {
        map.addLayer({
          id: "tour-route-line",

          type: "line",

          source:
            "tour-route",

          layout: {
            "line-cap":
              "round",

            "line-join":
              "round",
          },

          paint: {
            "line-color":
              "#0f766e",

            "line-width":
              5,

            "line-opacity":
              1,
          },
        });
      }
    }, []);

  // ==========================================================
  // INITIALIZE MAP
  // ==========================================================

  useEffect(() => {
    if (
      !mapContainerRef.current ||
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

        zoom: 13,

        attributionControl:
          true,
      });

    mapRef.current =
      map;

    // --------------------------------------------------------
    // Navigation controls
    // --------------------------------------------------------

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass:
          true,

        showZoom:
          true,

        visualizePitch:
          true,
      }),
      "bottom-right"
    );

    // --------------------------------------------------------
    // Scale
    // --------------------------------------------------------

    map.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 120,

        unit: "metric",
      }),
      "bottom-left"
    );

    // --------------------------------------------------------
    // Map loaded
    // --------------------------------------------------------

    map.on(
      "load",
      () => {
        setMapReady(true);

        addRouteLayers();
      }
    );

    // --------------------------------------------------------
    // Manual map movement
    // --------------------------------------------------------

    map.on(
      "dragstart",
      () => {
        setFollowLocation(
          false
        );
      }
    );

    // --------------------------------------------------------
    // Cleanup
    // --------------------------------------------------------

    return () => {
      if (
        watchIdRef.current !==
        null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current =
          null;
      }

      if (
        heartbeatRef.current
      ) {
        clearInterval(
          heartbeatRef.current
        );

        heartbeatRef.current =
          null;
      }

      if (
        userMarkerRef.current
      ) {
        userMarkerRef.current.remove();

        userMarkerRef.current =
          null;
      }

      if (
        destinationMarkerRef.current
      ) {
        destinationMarkerRef.current.remove();

        destinationMarkerRef.current =
          null;
      }

      map.remove();

      mapRef.current =
        null;
    };
  }, [addRouteLayers]);

  // ==========================================================
  // CHANGE MAP STYLE
  // ==========================================================

  const changeMapStyle =
    useCallback(
      (mode) => {
        if (!mapRef.current) {
          return;
        }

        const style =
          mode === "bright"
            ? BRIGHT_MAP_STYLE
            : MAP_STYLE;

        setMapStyleMode(
          mode
        );

        mapRef.current.setStyle(
          style
        );

        mapRef.current.once(
          "style.load",
          () => {
            addRouteLayers();

            createUserMarker();

            if (
              destinationRef.current
            ) {
              createDestinationMarker(
                destinationRef.current
              );
            }

            // Restore route
            const coordinates =
              routeCoordinatesRef.current;

            if (
              coordinates.length > 0
            ) {
              const source =
                mapRef.current.getSource(
                  "tour-route"
                );

              if (source) {
                source.setData({
                  type: "Feature",

                  properties: {},

                  geometry: {
                    type: "LineString",

                    coordinates,
                  },
                });
              }
            }
          }
        );
      },
      [
        addRouteLayers,
        createUserMarker,
        createDestinationMarker,
      ]
    );

  // ==========================================================
  // GET CURRENT LOCATION
  // ==========================================================

  const getCurrentLocation =
    useCallback(
      (moveMap = true) => {
        if (
          !navigator.geolocation
        ) {
          setMessage(
            "Your browser does not support location."
          );

          return;
        }

        setMessage(
          "Getting your current location..."
        );

        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (
              !isReliableGPSPosition(
                position
              )
            ) {
              setMessage(
                `GPS accuracy is poor (±${Math.round(
                  position.coords
                    .accuracy
                )} m). Waiting for a better signal...`
              );

              return;
            }

            const location = {
              lat:
                position.coords
                  .latitude,

              lng:
                position.coords
                  .longitude,
            };

            const currentAccuracy =
              position.coords
                .accuracy;

            if (
              !isLocationJumpReasonable(
                location,
                currentAccuracy
              )
            ) {
              setMessage(
                "GPS location changed unexpectedly. Waiting for a stable signal..."
              );

              return;
            }

            userLocationRef.current =
              location;

            lastAcceptedLocationRef.current =
              location;

            lastAcceptedAccuracyRef.current =
              currentAccuracy;

            lastLocationTimeRef.current =
              Date.now();

            setUserLocation(
              location
            );

            setAccuracy(
              currentAccuracy
            );

            setRisk(
              calculateRisk(
                currentAccuracy
              )
            );

            updateUserMarker();

            if (
              mapRef.current &&
              moveMap
            ) {
              mapRef.current.flyTo({
                center: [
                  location.lng,
                  location.lat,
                ],

                zoom: 17,

                speed: 1.1,
              });
            }

            setMessage("");
          },

          (error) => {
            console.error(
              "Location error:",
              error
            );

            setMessage(
              "Unable to get your current location."
            );
          },

          {
            enableHighAccuracy:
              true,

            timeout:
              20000,

            maximumAge:
              0,
          }
        );
      },
      [
        isReliableGPSPosition,
        isLocationJumpReasonable,
        updateUserMarker,
      ]
    );

  // ==========================================================
  // GET INITIAL LOCATION
  // ==========================================================

  useEffect(() => {
    if (!mapReady) {
      return;
    }

    getCurrentLocation(
      true
    );
  }, [
    mapReady,
    getCurrentLocation,
  ]);

  // ==========================================================
  // SEARCH PLACES
  // ==========================================================

  const searchPlaces =
    async () => {
      const query =
        searchText.trim();

      if (!query) {
        setSearchResults([]);

        setShowSearchResults(
          false
        );

        return;
      }

      try {
        setSearching(true);

        const url =
          `${NOMINATIM_URL}?` +
          new URLSearchParams({
            q: query,

            format:
              "json",

            addressdetails:
              "1",

            limit:
              "5",

            countrycodes:
              "in",
          });

        const response =
          await fetch(
            url,
            {
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        if (!response.ok) {
          throw new Error(
            "Search failed"
          );
        }

        const data =
          await response.json();

        setSearchResults(
          data
        );

        setShowSearchResults(
          true
        );
      } catch (error) {
        console.error(
          "Search error:",
          error
        );

        setMessage(
          "Unable to search this place."
        );
      } finally {
        setSearching(false);
      }
    };

  // ==========================================================
  // SEARCH KEYBOARD
  // ==========================================================

  const handleSearchKeyDown =
    (event) => {
      if (
        event.key ===
        "Enter"
      ) {
        event.preventDefault();

        searchPlaces();
      }

      if (
        event.key ===
        "Escape"
      ) {
        setShowSearchResults(
          false
        );
      }
    };

  // ==========================================================
  // SELECT DESTINATION
  // ==========================================================

  const selectPlace =
    (place) => {
      if (!mapRef.current) {
        return;
      }

      const selected = {
        ...place,

        lat:
          Number(place.lat),

        lon:
          Number(place.lon),
      };

      destinationRef.current =
        selected;

      setDestination(
        selected
      );

      setSearchText(
        place.display_name
          ?.split(",")
          .slice(0, 2)
          .join(",") ||
          place.display_name
      );

      setSearchResults([]);

      setShowSearchResults(
        false
      );

      // Only show destination.
      // Do NOT calculate route here.
      createDestinationMarker(
        selected
      );

      mapRef.current.flyTo({
        center: [
          selected.lon,
          selected.lat,
        ],

        zoom: 15,

        speed: 1.1,
      });

      setDistance(null);

      setDuration(null);

      setRouteError("");

      clearRoute();
    };

  // ==========================================================
  // CLEAR DESTINATION
  // ==========================================================

  const clearDestination =
    () => {
      destinationRef.current =
        null;

      setDestination(
        null
      );

      setSearchText("");

      setSearchResults([]);

      setShowSearchResults(
        false
      );

      if (
        destinationMarkerRef.current
      ) {
        destinationMarkerRef.current.remove();

        destinationMarkerRef.current =
          null;
      }

      clearRoute();
    };

  // ==========================================================
  // CLEAR ROUTE
  // ==========================================================

  const clearRoute =
    () => {
      routeCoordinatesRef.current =
        [];

      setDistance(null);

      setDuration(null);

      if (!mapRef.current) {
        return;
      }

      const source =
        mapRef.current.getSource(
          "tour-route"
        );

      if (source) {
        source.setData({
          type: "Feature",

          properties: {},

          geometry: {
            type: "LineString",

            coordinates: [],
          },
        });
      }
    };

  // ==========================================================
  // CALCULATE ROUTE
  // ==========================================================

  const calculateRoute =
    async (
      from,
      to
    ) => {
      if (
        !mapRef.current
      ) {
        return null;
      }

      try {
        setRouteLoading(
          true
        );

        setRouteError("");

        const coordinates =
          `${from.lng},${from.lat};` +
          `${to.lon},${to.lat}`;

        const url =
          `${OSRM_URL}/driving/${coordinates}` +
          `?overview=full&geometries=geojson`;

        const response =
          await fetch(url);

        if (!response.ok) {
          throw new Error(
            "Route request failed"
          );
        }

        const data =
          await response.json();

        if (
          data.code !==
            "Ok" ||
          !data.routes?.length
        ) {
          throw new Error(
            "No route found"
          );
        }

        const route =
          data.routes[0];

        const coordinatesArray =
          route.geometry
            .coordinates;

        routeCoordinatesRef.current =
          coordinatesArray;

        setDistance(
          route.distance
        );

        setDuration(
          route.duration
        );

        addRouteLayers();

        const source =
          mapRef.current.getSource(
            "tour-route"
          );

        if (source) {
          source.setData({
            type: "Feature",

            properties: {},

            geometry: {
              type: "LineString",

              coordinates:
                coordinatesArray,
            },
          });
        }

        const bounds =
          new maplibregl.LngLatBounds();

        coordinatesArray.forEach(
          (coordinate) => {
            bounds.extend(
              coordinate
            );
          }
        );

        mapRef.current.fitBounds(
          bounds,
          {
            padding: {
              top: 170,

              bottom: 220,

              left: 70,

              right: 70,
            },

            duration: 1200,
          }
        );

        return route;
      } catch (error) {
        console.error(
          "Route error:",
          error
        );

        setRouteError(
          "Unable to calculate route."
        );

        return null;
      } finally {
        setRouteLoading(
          false
        );
      }
    };

  // ==========================================================
  // BACKEND LOCATION UPDATE
  // ==========================================================

  const sendLocationToBackend =
    async (
      location,
      currentAccuracy
    ) => {
      const userId =
        getStoredUserId();

      if (
        !userId ||
        !location
      ) {
        return;
      }

      try {
        await fetch(
          `${API_URL}/api/location/update`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              userId,

              latitude:
                location.lat,

              longitude:
                location.lng,

              accuracy:
                currentAccuracy ??
                null,
            }),
          }
        );
      } catch (error) {
        console.error(
          "Location update error:",
          error
        );
      }
    };

  // ==========================================================
  // GPS POSITION UPDATE
  // ==========================================================

  const handlePositionUpdate =
    useCallback(
      (position) => {
        if (
          !isReliableGPSPosition(
            position
          )
        ) {
          setMessage(
            "GPS accuracy is poor. Waiting for a better signal..."
          );

          return;
        }

        const location = {
          lat:
            position.coords
              .latitude,

          lng:
            position.coords
              .longitude,
        };

        const currentAccuracy =
          position.coords
            .accuracy;

        if (
          !isLocationJumpReasonable(
            location,
            currentAccuracy
          )
        ) {
          setMessage(
            "GPS location changed unexpectedly. Waiting for a stable signal..."
          );

          return;
        }

        const previousAccuracy =
          lastAcceptedAccuracyRef.current;

        if (
          previousAccuracy !==
            Infinity &&
          currentAccuracy >
            previousAccuracy *
              3 &&
          currentAccuracy >
            50
        ) {
          console.warn(
            "Ignoring worse GPS reading:",
            currentAccuracy
          );

          return;
        }

        userLocationRef.current =
          location;

        lastAcceptedLocationRef.current =
          location;

        lastAcceptedAccuracyRef.current =
          currentAccuracy;

        lastLocationTimeRef.current =
          Date.now();

        setUserLocation(
          location
        );

        setAccuracy(
          currentAccuracy
        );

        setRisk(
          calculateRisk(
            currentAccuracy
          )
        );

        updateUserMarker();

        if (
          mapRef.current &&
          followLocationRef.current
        ) {
          mapRef.current.easeTo({
            center: [
              location.lng,
              location.lat,
            ],

            duration: 600,
          });
        }

        sendLocationToBackend(
          location,
          currentAccuracy
        );

        setMessage("");
      },
      [
        isReliableGPSPosition,
        isLocationJumpReasonable,
        updateUserMarker,
      ]
    );

  // ==========================================================
  // GPS ERROR
  // ==========================================================

  const handlePositionError =
    useCallback((error) => {
      console.error(
        "GPS error:",
        error
      );

      setMessage(
        "GPS signal is unavailable."
      );
    }, []);

  // ==========================================================
  // START TOUR
  // ==========================================================

  const startTour =
    () => {
      if (!destination) {
        setMessage(
          "Search for a destination first."
        );

        return;
      }

      if (
        !navigator.geolocation
      ) {
        setMessage(
          "Geolocation is not supported."
        );

        return;
      }

      setMessage("");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (
            !isReliableGPSPosition(
              position
            )
          ) {
            setMessage(
              `GPS accuracy is poor (±${Math.round(
                position.coords
                  .accuracy
              )} m). Please wait for a better GPS signal.`
            );

            return;
          }

          const location = {
            lat:
              position.coords
                .latitude,

            lng:
              position.coords
                .longitude,
          };

          const currentAccuracy =
            position.coords
              .accuracy;

          if (
            !isLocationJumpReasonable(
              location,
              currentAccuracy
            )
          ) {
            setMessage(
              "GPS location is unstable. Please try again."
            );

            return;
          }

          userLocationRef.current =
            location;

          lastAcceptedLocationRef.current =
            location;

          lastAcceptedAccuracyRef.current =
            currentAccuracy;

          lastLocationTimeRef.current =
            Date.now();

          setUserLocation(
            location
          );

          setAccuracy(
            currentAccuracy
          );

          setRisk(
            calculateRisk(
              currentAccuracy
            )
          );

          updateUserMarker();

          // --------------------------------------------------
          // Calculate route
          // --------------------------------------------------

          const route =
            await calculateRoute(
              location,
              destination
            );

          if (!route) {
            return;
          }

          // --------------------------------------------------
          // Backend start
          // --------------------------------------------------

          const userId =
            getStoredUserId();

          if (userId) {
            try {
              await fetch(
                `${API_URL}/api/location/start`,
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify({
                      userId,

                      latitude:
                        location.lat,

                      longitude:
                        location.lng,

                      accuracy:
                        currentAccuracy,
                    }),
                }
              );
            } catch (error) {
              console.error(
                "Backend start error:",
                error
              );
            }
          }

          // --------------------------------------------------
          // Stop old watcher
          // --------------------------------------------------

          if (
            watchIdRef.current !==
            null
          ) {
            navigator.geolocation.clearWatch(
              watchIdRef.current
            );
          }

          // --------------------------------------------------
          // Start GPS watcher
          // --------------------------------------------------

        watchIdRef.current =
          navigator.geolocation.watchPosition(
            handlePositionUpdate,

            handlePositionError,

            {
              enableHighAccuracy: true,

              maximumAge: 0,

              timeout: 30000,
            }
          );         
   // --------------------------------------------------
          // Heartbeat
          // --------------------------------------------------

          if (
            heartbeatRef.current
          ) {
            clearInterval(
              heartbeatRef.current
            );
          }

          heartbeatRef.current =
            setInterval(() => {
              sendLocationToBackend(
                userLocationRef.current,
                lastAcceptedAccuracyRef.current !==
                  Infinity
                  ? lastAcceptedAccuracyRef.current
                  : accuracy
              );
            }, 5000);

          setTourStarted(
            true
          );

          setTracking(
            true
          );

          setMessage(
            "Tour started."
          );
        },

        (error) => {
          console.error(
            "Start location error:",
            error
          );

          setMessage(
            "Please allow location access to start your tour."
          );
        },

        {
          enableHighAccuracy:
            true,

          timeout:
            15000,

          maximumAge:
            0,
        }
      );
    };

  // ==========================================================
  // STOP TOUR
  // ==========================================================

  const stopTour =
    async () => {
      if (
        watchIdRef.current !==
        null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current =
          null;
      }

      if (
        heartbeatRef.current
      ) {
        clearInterval(
          heartbeatRef.current
        );

        heartbeatRef.current =
          null;
      }

      const userId =
        getStoredUserId();

      if (userId) {
        try {
          await fetch(
            `${API_URL}/api/location/stop`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  userId,
                }),
            }
          );
        } catch (error) {
          console.error(
            "Stop error:",
            error
          );
        }
      }

      setTourStarted(
        false
      );

      setTracking(
        false
      );

      // Keep destination.
      // Remove only route.
      clearRoute();

      setMessage(
        "Tour stopped."
      );
    };

  // ==========================================================
  // MY LOCATION
  // ==========================================================

  const goToMyLocation =
    () => {
      setFollowLocation(
        true
      );

      followLocationRef.current =
        true;

      getCurrentLocation(
        true
      );
    };

  // ==========================================================
  // TOGGLE FOLLOW
  // ==========================================================

  const toggleFollow =
    () => {
      setFollowLocation(
        (previous) => {
          const next =
            !previous;

          followLocationRef.current =
            next;

          return next;
        }
      );
    };

  // ==========================================================
  // SEND SOS
  // ==========================================================

  const sendSOS =
    async () => {
      if (sosLoading) {
        return;
      }

      try {
        setSosLoading(
          true
        );

        const userId =
          getStoredUserId();

        const location =
          userLocationRef.current;

        if (!userId) {
          setMessage(
            "Please login before sending SOS."
          );

          return;
        }

        try {
          const response =
            await fetch(
              `${API_URL}/api/sos`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    userId,

                    latitude:
                      location.lat,

                    longitude:
                      location.lng,

                    risk,

                    message:
                      "Tourist SOS emergency alert",
                  }),
              }
            );

          if (!response.ok) {
            throw new Error(
              "SOS request failed"
            );
          }
        } catch (error) {
          console.error(
            "SOS backend error:",
            error
          );
        }

        setMessage(
          "SOS alert sent."
        );
      } finally {
        setSosLoading(
          false
        );
      }
    };

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      if (
        watchIdRef.current !==
        null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );
      }

      if (
        heartbeatRef.current
      ) {
        clearInterval(
          heartbeatRef.current
        );
      }
    };
  }, []);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    
    <div className="toursafe-map-page">

      {/* ====================================================
          MAP
      ===================================================== */}

      <div
        ref={mapContainerRef}
        className="toursafe-map"
      />

      {/* ====================================================
          SEARCH
      ===================================================== */}

      <div className="toursafe-search-wrapper">

        <div className="toursafe-search-box">

          <Search
            size={20}
            className="toursafe-search-icon"
          />

          <input
            type="text"
            value={searchText}
            placeholder="Search destination..."
            onChange={(event) => {
              const value =
                event.target.value;

              setSearchText(
                value
              );

              if (!value.trim()) {
                setSearchResults([]);

                setShowSearchResults(
                  false
                );
              }
            }}
            onKeyDown={
              handleSearchKeyDown
            }
          />

          {searchText && (
            <button
              type="button"
              className="toursafe-search-clear"
              onClick={() => {
                setSearchText("");

                setSearchResults([]);

                setShowSearchResults(
                  false
                );
              }}
            >
              <X size={17} />
            </button>
          )}

          <button
            type="button"
            className="toursafe-search-button"
            onClick={
              searchPlaces
            }
            disabled={searching}
          >
            {searching ? (
              <RefreshCw
                size={17}
                className="toursafe-spin"
              />
            ) : (
              "Search"
            )}
          </button>

        </div>

        {/* ==================================================
            SEARCH RESULTS
        =================================================== */}

        {showSearchResults &&
          searchResults.length >
            0 && (
            <div className="toursafe-search-results">

              {searchResults.map(
                (place) => (
                  <button
                    type="button"
                    key={
                      place.place_id
                    }
                    className="toursafe-search-result"
                    onClick={() =>
                      selectPlace(
                        place
                      )
                    }
                  >

                    <div className="toursafe-result-icon">
                      <MapPin
                        size={17}
                      />
                    </div>

                    <div className="toursafe-result-text">

                      <strong>
                        {
                          place.display_name
                            ?.split(",")
                            ?.slice(
                              0,
                              2
                            )
                            ?.join(
                              ","
                            )
                        }
                      </strong>

                      <span>
                        {
                          place.display_name
                        }
                      </span>

                    </div>

                  </button>
                )
              )}

            </div>
          )}

      </div>

      {/* ====================================================
          STATUS CARD
      ===================================================== */}

      <div className="toursafe-status-card">

        <div className="toursafe-status-main">

          <div
            className={
              tourStarted
                ? "toursafe-status-indicator active"
                : "toursafe-status-indicator"
            }
          />

          <div>

            <strong>
              {tourStarted
                ? "Tour Active"
                : "Ready to Explore"}
            </strong>

            <span>
              {tracking
                ? "Live location tracking"
                : "Location available"}
            </span>

          </div>

        </div>

        <div className="toursafe-risk">

          {risk < 20 ? (
            <ShieldCheck
              size={18}
            />
          ) : (
            <ShieldAlert
              size={18}
            />
          )}

          <strong>
            {risk}%
          </strong>

        </div>

      </div>

      {/* ====================================================
          DESTINATION CARD
      ===================================================== */}

      {destination && (
        <div className="toursafe-destination-card">

          <div className="toursafe-destination-top">

            <div className="toursafe-destination-symbol">
              <MapPin
                size={19}
              />
            </div>

            <div className="toursafe-destination-details">

              <small>
                DESTINATION
              </small>

              <strong>
                {
                  destination.display_name
                }
              </strong>

            </div>

            <button
              type="button"
              className="toursafe-destination-close"
              onClick={
                clearDestination
              }
            >
              <X size={17} />
            </button>

          </div>

          {/* Route summary */}

          {(
            distance !== null ||
            duration !== null
          ) && (
            <div className="toursafe-route-summary">

              <div>

                <RouteIcon
                  size={18}
                />

                <div>

                  <small>
                    Distance
                  </small>

                  <strong>
                    {formatDistance(
                      distance
                    )}
                  </strong>

                </div>

              </div>

              <div>

                <Clock
                  size={18}
                />

                <div>

                  <small>
                    Estimated time
                  </small>

                  <strong>
                    {formatDuration(
                      duration
                    )}
                  </strong>

                </div>

              </div>

            </div>
          )}

          {routeLoading && (
            <div className="toursafe-route-loading">

              <RefreshCw
                size={16}
                className="toursafe-spin"
              />

              Calculating route...

            </div>
          )}

          {routeError && (
            <div className="toursafe-route-error">
              {routeError}
            </div>
          )}

        </div>
      )}

      {/* ====================================================
          MESSAGE
      ===================================================== */}

      {message && (
        <div className="toursafe-message">
          {message}
        </div>
      )}

      {/* ====================================================
          MAP TOOLS
      ===================================================== */}

      <div className="toursafe-map-tools">

        {/* My location */}

        <button
          type="button"
          className={
            followLocation
              ? "toursafe-map-tool active"
              : "toursafe-map-tool"
          }
          title="My Location"
          onClick={
            goToMyLocation
          }
        >
          <LocateFixed
            size={20}
          />
        </button>

        {/* Follow */}

        <button
          type="button"
          className={
            followLocation
              ? "toursafe-map-tool active"
              : "toursafe-map-tool"
          }
          title="Follow location"
          onClick={
            toggleFollow
          }
        >
          <Navigation
            size={20}
          />
        </button>

        {/* Layers */}

        <button
          type="button"
          className={
            showLayers
              ? "toursafe-map-tool active"
              : "toursafe-map-tool"
          }
          title="Map style"
          onClick={() =>
            setShowLayers(
              (previous) =>
                !previous
            )
          }
        >
          <Layers
            size={20}
          />
        </button>

        {/* Refresh location */}

        <button
          type="button"
          className="toursafe-map-tool"
          title="Refresh location"
          onClick={() =>
            getCurrentLocation(
              true
            )
          }
        >
          <Crosshair
            size={20}
          />
        </button>

      </div>

      {/* ====================================================
          STYLE MENU
      ===================================================== */}

      {showLayers && (
        <div className="toursafe-style-menu">

          <strong>
            Map Style
          </strong>

          <button
            type="button"
            className={
              mapStyleMode ===
              "standard"
                ? "active"
                : ""
            }
            onClick={() => {
              changeMapStyle(
                "standard"
              );

              setShowLayers(
                false
              );
            }}
          >
            Standard
          </button>

          <button
            type="button"
            className={
              mapStyleMode ===
              "bright"
                ? "active"
                : ""
            }
            onClick={() => {
              changeMapStyle(
                "bright"
              );

              setShowLayers(
                false
              );
            }}
          >
            Bright
          </button>

        </div>
      )}

      {/* ====================================================
          BOTTOM PANEL
      ===================================================== */}

      <div className="toursafe-bottom-panel">

        {!tourStarted ? (
          <button
            type="button"
            className="toursafe-start-button"
            disabled={
              !destination ||
              routeLoading
            }
            onClick={
              startTour
            }
          >

            <Play
              size={19}
              fill="currentColor"
            />

            <span>
              {routeLoading
                ? "Preparing Route..."
                : "Start Tour"}
            </span>

          </button>
        ) : (
          <button
            type="button"
            className="toursafe-stop-button"
            onClick={
              stopTour
            }
          >

            <Square
              size={18}
              fill="currentColor"
            />

            <span>
              Stop Tour
            </span>

          </button>
        )}

        {/* SOS */}

        <button
          type="button"
          className="toursafe-sos-button"
          onClick={
            sendSOS
          }
          disabled={
            sosLoading
          }
        >

          <AlertTriangle
            size={18}
          />

          <span>
            {sosLoading
              ? "Sending..."
              : "SOS"}
          </span>

        </button>

      </div>

      {/* ====================================================
          CURRENT LOCATION LABEL
      ===================================================== */}

      <div className="toursafe-location-label">

        <div className="toursafe-location-label-dot" />

        <div>

          <strong>
            Your Location
          </strong>

          <span>
            {accuracy
              ? `Accuracy ±${Math.round(
                  accuracy
                )} m`
              : "Getting location..."}
          </span>

        </div>

      </div>

    </div>
  );
}