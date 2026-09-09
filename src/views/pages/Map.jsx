import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";

import {
  PlayArrow,
  Stop,
  Warning,
  Settings,
  MyLocation,
  Close,
  LocationOn,
  Security,
  Emergency,
  Map as MapIcon,
  Satellite,
  Terrain,
} from "@mui/icons-material";

import "../../style/style.css";
import Navbar from "../components/Navbar";

// ======================================================
// GOOGLE MAPS API KEY
// ======================================================

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// ======================================================
// BACKEND API
// ======================================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

// ======================================================
// FALLBACK LOCATION
// ======================================================

const FALLBACK_LOCATION = {
  lat: 19.076,
  lng: 72.8777,
  accuracy: null,
};

// ======================================================
// LOCATION HEARTBEAT
//
// Sends latest location to backend even if GPS does
// not generate a new watchPosition event.
// ======================================================

const LOCATION_HEARTBEAT_INTERVAL = 5000;

// ======================================================
// GET LOGGED-IN USER ID
// ======================================================

const getUserId = () => {
  // ----------------------------------------------------
  // 1. userId
  // ----------------------------------------------------

  const directUserId =
    localStorage.getItem("userId");

  if (directUserId) {
    const id = Number(directUserId);

    if (
      Number.isInteger(id) &&
      id > 0
    ) {
      return id;
    }
  }

  // ----------------------------------------------------
  // 2. user_id
  // ----------------------------------------------------

  const userId =
    localStorage.getItem("user_id");

  if (userId) {
    const id = Number(userId);

    if (
      Number.isInteger(id) &&
      id > 0
    ) {
      return id;
    }
  }

  // ----------------------------------------------------
  // 3. user object
  // ----------------------------------------------------

  const storedUser =
    localStorage.getItem("user");

  if (storedUser) {
    try {
      const user =
        JSON.parse(storedUser);

      if (user?.id) {
        const id = Number(user.id);

        if (
          Number.isInteger(id) &&
          id > 0
        ) {
          return id;
        }
      }

      if (user?.userId) {
        const id =
          Number(user.userId);

        if (
          Number.isInteger(id) &&
          id > 0
        ) {
          return id;
        }
      }
    } catch (error) {
      console.error(
        "Unable to parse stored user:",
        error
      );
    }
  }

  // ----------------------------------------------------
  // 4. loggedInUser object
  // ----------------------------------------------------

  const loggedInUser =
    localStorage.getItem(
      "loggedInUser"
    );

  if (loggedInUser) {
    try {
      const user =
        JSON.parse(loggedInUser);

      if (user?.id) {
        const id = Number(user.id);

        if (
          Number.isInteger(id) &&
          id > 0
        ) {
          return id;
        }
      }

      if (user?.userId) {
        const id =
          Number(user.userId);

        if (
          Number.isInteger(id) &&
          id > 0
        ) {
          return id;
        }
      }
    } catch (error) {
      console.error(
        "Unable to parse loggedInUser:",
        error
      );
    }
  }

  return null;
};

// ======================================================
// CURRENT LOCATION MARKER
// ======================================================

const CurrentLocationMarker = ({
  location,
}) => {
  if (!location) {
    return null;
  }

  return (
    <AdvancedMarker
      position={{
        lat: location.lat,
        lng: location.lng,
      }}
      title="Your Current Location"
    >
      <div className="current-location-marker">
        <div className="location-accuracy-circle">
          <div className="location-dot"></div>
        </div>
      </div>
    </AdvancedMarker>
  );
};

// ======================================================
// MAP CONTROLLER
// ======================================================

const MapController = ({
  onMapReady,
}) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      console.log(
        "TourSafe: Google Map loaded."
      );

      onMapReady(map);
    }
  }, [
    map,
    onMapReady,
  ]);

  return null;
};

// ======================================================
// MAIN MAP COMPONENT
// ======================================================

const Map = () => {

  // ====================================================
  // LOCATION
  // ====================================================

  const [location, setLocation] =
    useState(null);

  const [locationError, setLocationError] =
    useState("");

  const [locationLoading, setLocationLoading] =
    useState(true);

  // ====================================================
  // TOUR
  // ====================================================

  const [tourStarted, setTourStarted] =
    useState(false);

  // ====================================================
  // SOS
  // ====================================================

  const [sosActive, setSosActive] =
    useState(false);

  // ====================================================
  // SETTINGS
  // ====================================================

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [mapType, setMapType] =
    useState("roadmap");

  const [showLocation, setShowLocation] =
    useState(true);

  const [followLocation, setFollowLocation] =
    useState(false);

  // ====================================================
  // RISK
  // ====================================================

  const [riskPercentage, setRiskPercentage] =
    useState(12);

  // ====================================================
  // API ERROR
  // ====================================================

  const [apiError, setApiError] =
    useState("");

  // ====================================================
  // BUTTON LOADING
  // ====================================================

  const [startingTour, setStartingTour] =
    useState(false);

  const [stoppingTour, setStoppingTour] =
    useState(false);

  // ====================================================
  // REFS
  // ====================================================

  const mapRef = useRef(null);

  const watchIdRef = useRef(null);

  const heartbeatRef = useRef(null);

  const latestLocationRef =
    useRef(null);

  const mountedRef =
    useRef(true);

  const followLocationRef =
    useRef(false);

  // ====================================================
  // GOOGLE MAPS API KEY
  // ====================================================

  const hasGoogleMapsKey =
    Boolean(
      GOOGLE_MAPS_API_KEY
    );

  // ====================================================
  // KEEP FOLLOW LOCATION REF UPDATED
  // ====================================================

  useEffect(() => {
    followLocationRef.current =
      followLocation;
  }, [
    followLocation,
  ]);

  // ====================================================
  // COMPONENT MOUNT / UNMOUNT
  // ====================================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ====================================================
  // MAP READY
  // ====================================================

  const handleMapReady =
    useCallback((map) => {
      mapRef.current = map;
    }, []);

  // ====================================================
  // LOCATION ERROR HANDLER
  // ====================================================

  const handleLocationError =
    useCallback((error) => {

      console.error(
        "TourSafe Geolocation Error:",
        error
      );

      if (
        error.code ===
        error.PERMISSION_DENIED
      ) {
        setLocationError(
          "Location permission was denied. Please allow location access in your browser."
        );

      } else if (
        error.code ===
        error.POSITION_UNAVAILABLE
      ) {
        setLocationError(
          "Your current location is unavailable."
        );

      } else if (
        error.code ===
        error.TIMEOUT
      ) {
        setLocationError(
          "Location request timed out. Please try again."
        );

      } else {
        setLocationError(
          "Unable to access your current location."
        );
      }

    }, []);

  // ====================================================
  // GET INITIAL LOCATION
  //
  // IMPORTANT:
  // This does NOT start continuous tracking.
  // ====================================================

  useEffect(() => {

    let isMounted = true;

    if (!navigator.geolocation) {

      console.warn(
        "TourSafe: Geolocation is not supported."
      );

      if (isMounted) {

        setLocation(
          FALLBACK_LOCATION
        );

        setLocationError(
          "Geolocation is not supported. Showing default map location."
        );

        setLocationLoading(false);
      }

      return;
    }

    console.log(
      "================================="
    );

    console.log(
      "TOURSAFE - GETTING INITIAL LOCATION"
    );

    console.log(
      "================================="
    );

    navigator.geolocation.getCurrentPosition(

      (position) => {

        if (!isMounted) {
          return;
        }

        const currentLocation = {
          lat:
            position.coords.latitude,

          lng:
            position.coords.longitude,

          accuracy:
            position.coords.accuracy,
        };

        console.log(
          "================================="
        );

        console.log(
          "TOURSAFE - INITIAL LOCATION"
        );

        console.log(
          "Latitude :",
          currentLocation.lat
        );

        console.log(
          "Longitude:",
          currentLocation.lng
        );

        console.log(
          "Accuracy :",
          currentLocation.accuracy,
          "meters"
        );

        console.log(
          "================================="
        );

        setLocation(
          currentLocation
        );

        latestLocationRef.current =
          currentLocation;

        setLocationError("");

        setLocationLoading(false);
      },

      (error) => {

        if (!isMounted) {
          return;
        }

        handleLocationError(
          error
        );

        setLocation(
          FALLBACK_LOCATION
        );

        setLocationLoading(false);
      },

      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );

    return () => {
      isMounted = false;
    };

  }, [
    handleLocationError,
  ]);

  // ====================================================
  // CALCULATE RISK
  // ====================================================

  const calculateRisk = (
    accuracy
  ) => {

    if (
      typeof accuracy !==
      "number"
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
  };

  // ====================================================
  // START TOUR ON BACKEND
  // ====================================================

  const startTourOnServer =
    async () => {

      const userId =
        getUserId();

      if (!userId) {
        throw new Error(
          "User ID not found. Please login again."
        );
      }

      if (!location) {
        throw new Error(
          "Current location is not available."
        );
      }

      console.log(
        "================================="
      );

      console.log(
        "TOURSAFE - START TOUR REQUEST"
      );

      console.log(
        "API URL:",
        `${API_URL}/api/location/start`
      );

      console.log(
        "User ID:",
        userId
      );

      console.log(
        "Latitude:",
        location.lat
      );

      console.log(
        "Longitude:",
        location.lng
      );

      console.log(
        "Accuracy:",
        location.accuracy
      );

      console.log(
        "================================="
      );

      const response =
        await fetch(
          `${API_URL}/api/location/start`,
          {
            method: "POST",

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
                location.accuracy ??
                null,
            }),
          }
        );

      let data;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      console.log(
        "START TOUR RESPONSE:",
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Unable to start tour."
        );
      }

      console.log(
        "TourSafe: Tour started on server."
      );

      return data;
    };

  // ====================================================
  // UPDATE LOCATION ON BACKEND
  // ====================================================

  const updateLocationOnServer =
    useCallback(
      async (currentLocation) => {

        const userId =
          getUserId();

        if (!userId) {

          console.error(
            "TourSafe: User ID not found."
          );

          return false;
        }

        if (!currentLocation) {

          console.error(
            "TourSafe: No location available."
          );

          return false;
        }

        try {

          console.log(
            "---------------------------------"
          );

          console.log(
            "TOURSAFE - SENDING LOCATION"
          );

          console.log(
            "User ID:",
            userId
          );

          console.log(
            "Latitude:",
            currentLocation.lat
          );

          console.log(
            "Longitude:",
            currentLocation.lng
          );

          console.log(
            "Accuracy:",
            currentLocation.accuracy
          );

          console.log(
            "URL:",
            `${API_URL}/api/location/update`
          );

          console.log(
            "---------------------------------"
          );

          const response =
            await fetch(
              `${API_URL}/api/location/update`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  userId,

                  latitude:
                    currentLocation.lat,

                  longitude:
                    currentLocation.lng,

                  accuracy:
                    currentLocation.accuracy ??
                    null,
                }),
              }
            );

          let data;

          try {
            data =
              await response.json();
          } catch {
            console.error(
              "TourSafe: Invalid JSON from location update."
            );

            return false;
          }

          console.log(
            "UPDATE LOCATION RESPONSE:",
            data
          );

          if (
            !response.ok ||
            !data.success
          ) {

            console.error(
              "TourSafe: Location update failed:",
              data.message
            );

            return false;
          }

          console.log(
            "TourSafe: Location saved to database."
          );

          return true;

        } catch (error) {

          console.error(
            "TourSafe: Location update network error:",
            error
          );

          return false;
        }

      },
      []
    );

  // ====================================================
  // START CONTINUOUS LOCATION MONITORING
  // ====================================================

  const startLocationMonitoring =
    () => {

      if (!navigator.geolocation) {

        setLocationError(
          "Geolocation is not supported by your browser."
        );

        return false;
      }

      // ------------------------------------------------
      // PREVENT DUPLICATE WATCHERS
      // ------------------------------------------------

      if (
        watchIdRef.current !== null
      ) {

        console.log(
          "TourSafe: Location monitoring already active."
        );

        return true;
      }

      console.log(
        "================================="
      );

      console.log(
        "TOURSAFE - MONITORING STARTED"
      );

      console.log(
        "Continuous location tracking is active."
      );

      console.log(
        "================================="
      );

      // ------------------------------------------------
      // GPS WATCH
      // ------------------------------------------------

      const watchId =
        navigator.geolocation.watchPosition(

          async (position) => {

            if (
              !mountedRef.current
            ) {
              return;
            }

            const currentLocation = {

              lat:
                position.coords.latitude,

              lng:
                position.coords.longitude,

              accuracy:
                position.coords.accuracy,
            };

            // ------------------------------------------
            // SAVE LATEST LOCATION IN REF
            // ------------------------------------------

            latestLocationRef.current =
              currentLocation;

            // ------------------------------------------
            // CONSOLE
            // ------------------------------------------

            console.log(
              "================================="
            );

            console.log(
              "TOURSAFE - LIVE GPS UPDATE"
            );

            console.log(
              "Latitude :",
              currentLocation.lat
            );

            console.log(
              "Longitude:",
              currentLocation.lng
            );

            console.log(
              "Accuracy :",
              currentLocation.accuracy,
              "meters"
            );

            console.log(
              "================================="
            );

            // ------------------------------------------
            // UPDATE FRONTEND
            // ------------------------------------------

            setLocation(
              currentLocation
            );

            setLocationError("");

            // ------------------------------------------
            // UPDATE RISK
            // ------------------------------------------

            const risk =
              calculateRisk(
                currentLocation.accuracy
              );

            setRiskPercentage(
              risk
            );

            // ------------------------------------------
            // SAVE TO DATABASE
            // ------------------------------------------

            await updateLocationOnServer(
              currentLocation
            );

            // ------------------------------------------
            // FOLLOW LOCATION
            // ------------------------------------------

            if (
              followLocationRef.current &&
              mapRef.current
            ) {

              mapRef.current.panTo({
                lat:
                  currentLocation.lat,

                lng:
                  currentLocation.lng,
              });
            }

          },

          (error) => {

            console.error(
              "TourSafe Monitoring Error:",
              error
            );

            handleLocationError(
              error
            );

          },

          {
            enableHighAccuracy: true,

            maximumAge: 5000,

            timeout: 15000,
          }
        );

      watchIdRef.current =
        watchId;

      // =================================================
      // HEARTBEAT
      //
      // Even if the tourist is standing still and
      // watchPosition does not fire, this updates
      // updated_at in MySQL every 5 seconds.
      // =================================================

      heartbeatRef.current =
        setInterval(
          async () => {

            if (
              !mountedRef.current
            ) {
              return;
            }

            if (
              !latestLocationRef.current
            ) {
              console.log(
                "TourSafe: Waiting for GPS location..."
              );

              return;
            }

            console.log(
              "================================="
            );

            console.log(
              "TOURSAFE - LOCATION HEARTBEAT"
            );

            console.log(
              "Sending latest location..."
            );

            console.log(
              "Latitude:",
              latestLocationRef.current.lat
            );

            console.log(
              "Longitude:",
              latestLocationRef.current.lng
            );

            console.log(
              "================================="
            );

            await updateLocationOnServer(
              latestLocationRef.current
            );

          },
          LOCATION_HEARTBEAT_INTERVAL
        );

      return true;
    };

  // ====================================================
  // STOP CONTINUOUS LOCATION MONITORING
  // ====================================================

  const stopLocationMonitoring =
    () => {

      // ------------------------------------------------
      // STOP GPS WATCH
      // ------------------------------------------------

      if (
        watchIdRef.current !== null
      ) {

        console.log(
          "TourSafe: Stopping GPS monitoring..."
        );

        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current =
          null;
      }

      // ------------------------------------------------
      // STOP HEARTBEAT
      // ------------------------------------------------

      if (
        heartbeatRef.current !== null
      ) {

        clearInterval(
          heartbeatRef.current
        );

        heartbeatRef.current =
          null;
      }

      console.log(
        "================================="
      );

      console.log(
        "TOURSAFE - MONITORING STOPPED"
      );

      console.log(
        "Continuous location tracking disabled."
      );

      console.log(
        "================================="
      );
    };

  // ====================================================
  // STOP TOUR ON BACKEND
  // ====================================================

  const stopTourOnServer =
    async () => {

      const userId =
        getUserId();

      if (!userId) {

        console.error(
          "TourSafe: User ID not found."
        );

        return;
      }

      try {

        console.log(
          "TourSafe: Sending STOP request..."
        );

        const response =
          await fetch(
            `${API_URL}/api/location/stop`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                userId,
              }),
            }
          );

        let data;

        try {
          data =
            await response.json();
        } catch {
          console.error(
            "TourSafe: Stop tour returned invalid JSON."
          );

          return;
        }

        console.log(
          "STOP TOUR RESPONSE:",
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {

          console.error(
            "TourSafe: Stop tour failed:",
            data.message
          );

          return;
        }

        console.log(
          "TourSafe: Tour stopped on server."
        );

      } catch (error) {

        console.error(
          "TourSafe: Stop tour network error:",
          error
        );
      }
    };

  // ====================================================
  // START TOUR
  // ====================================================

  const startTour =
    async () => {

      if (startingTour) {
        return;
      }

      try {

        setStartingTour(true);

        setApiError("");

        setLocationError("");

        // ---------------------------------------------
        // CHECK LOCATION
        // ---------------------------------------------

        if (!location) {

          throw new Error(
            "Current location is not available."
          );
        }

        // ---------------------------------------------
        // CHECK USER
        // ---------------------------------------------

        const userId =
          getUserId();

        if (!userId) {

          throw new Error(
            "User ID not found. Please login again."
          );
        }

        console.log(
          "================================="
        );

        console.log(
          "TOURSAFE - STARTING TOUR"
        );

        console.log(
          "User ID:",
          userId
        );

        console.log(
          "================================="
        );

        // ---------------------------------------------
        // SAVE LATEST LOCATION
        // ---------------------------------------------

        latestLocationRef.current =
          location;

        // ---------------------------------------------
        // START DATABASE TOUR
        // ---------------------------------------------

        await startTourOnServer();

        // ---------------------------------------------
        // UPDATE UI
        // ---------------------------------------------

        setTourStarted(true);

        // ---------------------------------------------
        // START GPS MONITORING
        // ---------------------------------------------

        const monitoringStarted =
          startLocationMonitoring();

        if (!monitoringStarted) {

          await stopTourOnServer();

          setTourStarted(false);

          throw new Error(
            "Unable to start location monitoring."
          );
        }

        console.log(
          "================================="
        );

        console.log(
          "TOURSAFE - TOUR STARTED"
        );

        console.log(
          "Live location is now being sent to server."
        );

        console.log(
          "================================="
        );

      } catch (error) {

        console.error(
          "TourSafe Start Tour Error:",
          error
        );

        setTourStarted(false);

        setApiError(
          error.message ||
          "Unable to start tour."
        );

      } finally {

        setStartingTour(false);
      }
    };

  // ====================================================
  // STOP TOUR
  // ====================================================

  const stopTour =
    async () => {

      if (stoppingTour) {
        return;
      }

      setStoppingTour(true);

      setApiError("");

      try {

        // ---------------------------------------------
        // STOP GPS IMMEDIATELY
        // ---------------------------------------------

        stopLocationMonitoring();

        // ---------------------------------------------
        // UPDATE UI
        // ---------------------------------------------

        setTourStarted(false);

        setRiskPercentage(12);

        // ---------------------------------------------
        // STOP DATABASE TRACKING
        // ---------------------------------------------

        await stopTourOnServer();

        console.log(
          "================================="
        );

        console.log(
          "TOURSAFE - TOUR STOPPED"
        );

        console.log(
          "================================="
        );

      } catch (error) {

        console.error(
          "TourSafe Stop Tour Error:",
          error
        );

        setApiError(
          error.message ||
          "Unable to stop tour."
        );

      } finally {

        setStoppingTour(false);
      }
    };

  // ====================================================
  // CLEANUP GPS + HEARTBEAT
  // ====================================================

  useEffect(() => {

    return () => {

      if (
        watchIdRef.current !== null
      ) {

        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current =
          null;
      }

      if (
        heartbeatRef.current !== null
      ) {

        clearInterval(
          heartbeatRef.current
        );

        heartbeatRef.current =
          null;
      }

    };

  }, []);

  // ====================================================
  // GO TO CURRENT LOCATION
  // ====================================================

  const goToCurrentLocation =
    () => {

      if (
        !location ||
        !mapRef.current
      ) {
        return;
      }

      mapRef.current.panTo({
        lat:
          location.lat,

        lng:
          location.lng,
      });

      mapRef.current.setZoom(
        16
      );

      console.log(
        "TourSafe: Map moved to current location."
      );
    };

  // ====================================================
  // SOS
  // ====================================================

  const activateSOS =
    () => {

      setSosActive(true);

      console.log(
        "================================="
      );

      console.log(
        "TOURSAFE - SOS ALERT"
      );

      console.log(
        "SOS ACTIVATED"
      );

      if (location) {

        console.log(
          "SOS Latitude:",
          location.lat
        );

        console.log(
          "SOS Longitude:",
          location.lng
        );

        console.log(
          "SOS Accuracy:",
          location.accuracy,
          "meters"
        );
      }

      console.log(
        "================================="
      );
    };

  // ====================================================
  // CANCEL SOS
  // ====================================================

  const cancelSOS =
    () => {

      setSosActive(false);

      console.log(
        "TourSafe: SOS cancelled."
      );
    };

  // ====================================================
  // MISSING GOOGLE MAP API KEY
  // ====================================================

  if (!hasGoogleMapsKey) {

    return (
      <div className="map-error">

        <h3>
          Google Maps API Key Missing
        </h3>

        <p>
          Please add{" "}
          <strong>
            VITE_GOOGLE_MAPS_API_KEY
          </strong>{" "}
          to your .env file.
        </p>

      </div>
    );
  }

  // ====================================================
  // LOCATION LOADING
  // ====================================================

  if (locationLoading) {

    return (
      <div className="map-loading">

        <div className="map-loading-content">

          <div className="loading-spinner"></div>

          <p>
            Getting your current location...
          </p>

        </div>

      </div>
    );
  }

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <>
      <Navbar />

      <div className="tour-map-page">

        {/* ==================================================
            GOOGLE MAP
        ================================================== */}

        <APIProvider
          apiKey={
            GOOGLE_MAPS_API_KEY
          }
        >

          <GoogleMap
            defaultCenter={
              location ||
              FALLBACK_LOCATION
            }

            defaultZoom={16}

            mapId="TOURSAFE_MAP"

            gestureHandling="greedy"

            mapTypeId={
              mapType
            }

            fullscreenControl={true}

            zoomControl={true}

            streetViewControl={false}

            mapTypeControl={false}
          >

            {/* MAP CONTROLLER */}

            <MapController
              onMapReady={
                handleMapReady
              }
            />

            {/* CURRENT LOCATION */}

            {showLocation &&
              location && (

                <CurrentLocationMarker
                  location={
                    location
                  }
                />

              )}

          </GoogleMap>

        </APIProvider>

        {/* ==================================================
            TOP BAR
        ================================================== */}

        <div className="map-top-bar">

          <div className="tour-safe-title">

            <div className="tour-safe-logo">
              TS
            </div>

            <div>

              <h2>
                TourSafe
              </h2>

              <span>
                Tourist Safety Monitoring
              </span>

            </div>

          </div>

          <div
            className={`tour-status ${
              tourStarted
                ? "tour-active"
                : "tour-inactive"
            }`}
          >

            <span className="status-dot"></span>

            {tourStarted
              ? "Tour Active"
              : "Ready to Start"}

          </div>

        </div>

        {/* ==================================================
            API ERROR
        ================================================== */}

        {apiError && (

          <div className="location-error">

            <Warning />

            <span>
              {apiError}
            </span>

            <button
              onClick={() =>
                setApiError("")
              }
              aria-label="Close error"
            >
              <Close />
            </button>

          </div>

        )}

        {/* ==================================================
            RISK CARD
        ================================================== */}

        <div className="risk-card">

          <div className="risk-card-header">

            <div className="risk-icon">
              <Security />
            </div>

            <div>

              <span className="risk-label">
                Current Risk
              </span>

              <h3>
                {riskPercentage}%
              </h3>

            </div>

          </div>

          <div className="risk-progress">

            <div
              className="risk-progress-value"
              style={{
                width:
                  `${riskPercentage}%`,
              }}
            />

          </div>

          <span className="risk-description">

            {tourStarted
              ? riskPercentage < 20
                ? "Low Risk Area"
                : riskPercentage < 50
                  ? "Moderate Risk"
                  : "High Risk Area"
              : "Monitoring inactive"}

          </span>

        </div>

        {/* ==================================================
            START / STOP TOUR
        ================================================== */}

        <div className="tour-control">

          {!tourStarted ? (

            <button
              className="start-tour-button"
              onClick={
                startTour
              }
              disabled={
                startingTour ||
                !location
              }
            >

              <PlayArrow />

              <span>
                {startingTour
                  ? "Starting..."
                  : "Start Tour"}
              </span>

            </button>

          ) : (

            <button
              className="stop-tour-button"
              onClick={
                stopTour
              }
              disabled={
                stoppingTour
              }
            >

              <Stop />

              <span>
                {stoppingTour
                  ? "Stopping..."
                  : "Stop Tour"}
              </span>

            </button>

          )}

        </div>

        {/* ==================================================
            SOS
        ================================================== */}

        <button
          className={`sos-button ${
            sosActive
              ? "sos-active"
              : ""
          }`}
          onClick={
            activateSOS
          }
        >

          <Emergency />

          <span>
            {sosActive
              ? "SOS ACTIVE"
              : "SOS ALERT"}
          </span>

        </button>

        {/* ==================================================
            MAP CONTROLS
        ================================================== */}

        <div className="map-controls">

          {/* MY LOCATION */}

          <button
            className="map-control-button"
            onClick={
              goToCurrentLocation
            }
            disabled={
              !location
            }
            title="My Location"
            aria-label="Go to my location"
          >

            <MyLocation />

          </button>

          {/* SETTINGS */}

          <button
            className={`map-control-button ${
              settingsOpen
                ? "control-active"
                : ""
            }`}
            onClick={() =>
              setSettingsOpen(
                (previous) =>
                  !previous
              )
            }
            title="Map Settings"
            aria-label="Map settings"
          >

            <Settings />

          </button>

        </div>

        {/* ==================================================
            SETTINGS PANEL
        ================================================== */}

        {settingsOpen && (

          <div className="map-settings-panel">

            {/* HEADER */}

            <div className="settings-header">

              <div>

                <h3>
                  Map Settings
                </h3>

                <span>
                  Customize your map
                </span>

              </div>

              <button
                className="settings-close"
                onClick={() =>
                  setSettingsOpen(
                    false
                  )
                }
                aria-label="Close settings"
              >

                <Close />

              </button>

            </div>

            {/* MAP TYPE */}

            <div className="settings-section">

              <h4>
                Map Type
              </h4>

              <div className="map-type-options">

                <button
                  className={
                    mapType ===
                    "roadmap"
                      ? "map-type-active"
                      : ""
                  }
                  onClick={() =>
                    setMapType(
                      "roadmap"
                    )
                  }
                >

                  <MapIcon />

                  <span>
                    Roadmap
                  </span>

                </button>

                <button
                  className={
                    mapType ===
                    "satellite"
                      ? "map-type-active"
                      : ""
                  }
                  onClick={() =>
                    setMapType(
                      "satellite"
                    )
                  }
                >

                  <Satellite />

                  <span>
                    Satellite
                  </span>

                </button>

                <button
                  className={
                    mapType ===
                    "terrain"
                      ? "map-type-active"
                      : ""
                  }
                  onClick={() =>
                    setMapType(
                      "terrain"
                    )
                  }
                >

                  <Terrain />

                  <span>
                    Terrain
                  </span>

                </button>

              </div>

            </div>

            {/* LOCATION SETTINGS */}

            <div className="settings-section">

              <h4>
                Location
              </h4>

              <label className="setting-toggle">

                <div>

                  <LocationOn />

                  <span>
                    Show My Location
                  </span>

                </div>

                <input
                  type="checkbox"
                  checked={
                    showLocation
                  }
                  onChange={(e) =>
                    setShowLocation(
                      e.target.checked
                    )
                  }
                />

              </label>

              <label className="setting-toggle">

                <div>

                  <MyLocation />

                  <span>
                    Follow My Location
                  </span>

                </div>

                <input
                  type="checkbox"
                  checked={
                    followLocation
                  }
                  onChange={(e) =>
                    setFollowLocation(
                      e.target.checked
                    )
                  }
                />

              </label>

            </div>

            {/* MONITORING STATUS */}

            <div className="settings-monitoring">

              <div className="monitoring-icon">

                {tourStarted
                  ? <LocationOn />
                  : <Warning />}

              </div>

              <div>

                <strong>
                  Location Monitoring
                </strong>

                <span>

                  {tourStarted
                    ? "Currently active"
                    : "Inactive until tour starts"}

                </span>

              </div>

            </div>

          </div>

        )}

        {/* ==================================================
            LOCATION ERROR
        ================================================== */}

        {locationError && (

          <div className="location-error">

            <Warning />

            <span>
              {locationError}
            </span>

            <button
              onClick={() =>
                setLocationError("")
              }
              aria-label="Close location error"
            >

              <Close />

            </button>

          </div>

        )}

        {/* ==================================================
            SOS ACTIVE PANEL
        ================================================== */}

        {sosActive && (

          <div className="sos-alert-panel">

            <div className="sos-alert-icon">
              <Emergency />
            </div>

            <div>

              <strong>
                SOS Alert Active
              </strong>

              <span>
                Emergency assistance has been requested.
              </span>

            </div>

            <button
              onClick={
                cancelSOS
              }
            >
              Cancel
            </button>

          </div>

        )}

      </div>
    </>
  );
};

// ======================================================
// EXPORT
// ======================================================

export default Map;