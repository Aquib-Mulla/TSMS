import React, { useEffect, useRef, useState } from "react";

import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
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
// FALLBACK LOCATION
// Used only if browser location cannot be obtained.
// ======================================================

const FALLBACK_LOCATION = {
  lat: 19.0760,
  lng: 72.8777,
};


// ======================================================
// CURRENT LOCATION MARKER
// ======================================================

const CurrentLocationMarker = ({ location }) => {

  if (!location) {
    return null;
  }
  return (
    <AdvancedMarker
      position={{
        lat: location.lat,
        lng: location.lng,
      }}
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
  // MAP REF
  // ====================================================

  const mapRef = useRef(null);


  // ====================================================
  // WATCH ID
  // This stores continuous monitoring.
  // ====================================================

  const watchIdRef = useRef(null);


  // ====================================================
  // GET CURRENT LOCATION ON PAGE LOAD
  //
  // IMPORTANT:
  // This runs ONLY ONCE.
  // It does NOT continuously monitor the user.
  // ====================================================

  useEffect(() => {

    if (!navigator.geolocation) {

      console.warn(
        "Geolocation is not supported."
      );

      setLocation(
        FALLBACK_LOCATION
      );

      setLocationLoading(false);

      return;
    }


    console.log(
      "TourSafe: Getting current location..."
    );


    navigator.geolocation.getCurrentPosition(

      (position) => {

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

        setLocationError("");

        setLocationLoading(false);

      },


      (error) => {

        console.error(
          "Initial Location Error:",
          error
        );


        setLocation(
          FALLBACK_LOCATION
        );

        setLocationError(
          "Unable to access your exact location. Showing default map location."
        );

        setLocationLoading(false);

      },


      {
        enableHighAccuracy: true,

        maximumAge: 0,

        timeout: 15000,
      }

    );

  }, []);


  // ====================================================
  // START CONTINUOUS MONITORING
  //
  // THIS FUNCTION IS CALLED ONLY WHEN
  // USER CLICKS "START TOUR".
  // ====================================================

  const startLocationMonitoring = () => {

    if (!navigator.geolocation) {

      setLocationError(
        "Geolocation is not supported by your browser."
      );

      return;
    }


    // Prevent duplicate watchers

    if (watchIdRef.current !== null) {

      console.log(
        "TourSafe: Location monitoring is already active."
      );

      return;
    }


    console.log(
      "================================="
    );

    console.log(
      "TOURSAFE - MONITORING STARTED"
    );

    console.log(
      "Continuous location tracking is now active."
    );

    console.log(
      "================================="
    );


    // ==================================================
    // START WATCH POSITION
    // ==================================================

    const watchId =
      navigator.geolocation.watchPosition(

        (position) => {

          const currentLocation = {

            lat:
              position.coords.latitude,

            lng:
              position.coords.longitude,

            accuracy:
              position.coords.accuracy,

          };


          // ============================================
          // CONSOLE
          // ============================================

          console.log(
            "---------------------------------"
          );

          console.log(
            "TOURSAFE - LIVE MONITORING"
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
            "Coordinates:",
            `${currentLocation.lat}, ${currentLocation.lng}`
          );

          console.log(
            "---------------------------------"
          );


          // ============================================
          // UPDATE LOCATION
          // ============================================

          setLocation(
            currentLocation
          );


          // ============================================
          // FOLLOW LOCATION
          // ============================================

          if (
            followLocation &&
            mapRef.current
          ) {

            mapRef.current.panTo({

              lat:
                currentLocation.lat,

              lng:
                currentLocation.lng,

            });

          }


          // ============================================
          // DEMO RISK CALCULATION
          // ============================================

          let risk = 12;


          if (
            currentLocation.accuracy > 50
          ) {

            risk = 30;

          }

          else if (
            currentLocation.accuracy > 30
          ) {

            risk = 22;

          }

          else if (
            currentLocation.accuracy > 15
          ) {

            risk = 16;

          }


          setRiskPercentage(risk);

        },


        (error) => {

          console.error(
            "TourSafe Monitoring Error:",
            error
          );


          if (
            error.code ===
            error.PERMISSION_DENIED
          ) {

            setLocationError(
              "Location permission was denied."
            );

          }

          else if (
            error.code ===
            error.POSITION_UNAVAILABLE
          ) {

            setLocationError(
              "Current location is unavailable."
            );

          }

          else if (
            error.code ===
            error.TIMEOUT
          ) {

            setLocationError(
              "Location request timed out."
            );

          }

        },


        {
          enableHighAccuracy: true,

          maximumAge: 5000,

          timeout: 15000,
        }

      );


    // Save watcher ID

    watchIdRef.current =
      watchId;

  };


  // ====================================================
  // STOP CONTINUOUS MONITORING
  // ====================================================

  const stopLocationMonitoring = () => {

    if (
      watchIdRef.current !== null
    ) {

      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;


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

    }

  };


  // ====================================================
  // START TOUR
  // ====================================================

  const startTour = () => {

    setTourStarted(true);

    setLocationError("");

    startLocationMonitoring();

  };


  // ====================================================
  // STOP TOUR
  // ====================================================

  const stopTour = () => {

    stopLocationMonitoring();

    setTourStarted(false);

    setRiskPercentage(12);

  };


  // ====================================================
  // CLEANUP
  // ====================================================

  useEffect(() => {

    return () => {

      if (
        watchIdRef.current !== null
      ) {

        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

      }

    };

  }, []);


  // ====================================================
  // MAP LOAD
  // ====================================================

  const handleMapLoad = (map) => {

    mapRef.current = map;

  };


  // ====================================================
  // GO TO CURRENT LOCATION
  // ====================================================

  const goToCurrentLocation = () => {

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


    mapRef.current.setZoom(16);

  };


  // ====================================================
  // SOS
  // ====================================================

  const activateSOS = () => {

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

    }


    console.log(
      "================================="
    );

  };


  // ====================================================
  // API KEY
  // ====================================================

  if (!GOOGLE_MAPS_API_KEY) {

    return (
      <div className="map-error">

        <h3>
          Google Maps API Key Missing
        </h3>

        <p>
          Check VITE_GOOGLE_MAPS_API_KEY.
        </p>

      </div>
    );

  }


  // ====================================================
  // LOADING
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
  // MAP
  // ====================================================

  return (
    <>
      <Navbar />

    <div className="tour-map-page">

      {/* ==================================================
          GOOGLE MAP
      ================================================== */}

      <APIProvider
        apiKey={GOOGLE_MAPS_API_KEY}
      >

        <GoogleMap

          defaultCenter={location}

          defaultZoom={16}

          mapId="TOURSAFE_MAP"

          gestureHandling="greedy"

          mapTypeId={mapType}

          fullscreenControl={true}

          zoomControl={true}

          streetViewControl={false}

          mapTypeControl={false}

          onLoad={handleMapLoad}

        >

          {/* ============================================
              LOCATION INDICATOR
              Visible before and during tour.
              But it only UPDATES continuously
              when tour is active.
          ============================================ */}

          {showLocation && location && (

            <CurrentLocationMarker
              location={location}
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
          ></div>

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
            onClick={startTour}
          >

            <PlayArrow />

            <span>
              Start Tour
            </span>

          </button>

        ) : (

          <button
            className="stop-tour-button"
            onClick={stopTour}
          >

            <Stop />

            <span>
              Stop Tour
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
        onClick={activateSOS}
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

        <button
          className="map-control-button"
          onClick={
            goToCurrentLocation
          }
          disabled={!location}
          title="My Location"
        >

          <MyLocation />

        </button>


        <button
          className={`map-control-button ${
            settingsOpen
              ? "control-active"
              : ""
          }`}
          onClick={() =>
            setSettingsOpen(
              !settingsOpen
            )
          }
          title="Map Settings"
        >

          <Settings />

        </button>

      </div>


      {/* ==================================================
          SETTINGS
      ================================================== */}

      {settingsOpen && (

        <div className="map-settings-panel">

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
                setSettingsOpen(false)
              }
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
                  mapType === "roadmap"
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
                  mapType === "satellite"
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
                  mapType === "terrain"
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


          {/* LOCATION */}

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
                checked={showLocation}
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
                checked={followLocation}
                onChange={(e) =>
                  setFollowLocation(
                    e.target.checked
                  )
                }
              />

            </label>

          </div>


          {/* MONITORING */}

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
          >

            <Close />

          </button>

        </div>

      )}


      {/* ==================================================
          SOS ACTIVE
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
            onClick={() =>
              setSosActive(false)
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


export default Map;