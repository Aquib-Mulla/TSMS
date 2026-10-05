import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import {
  MapPin,
  Plus,
  Trash2,
  Eye,
  Upload,
  Map as MapIcon,
  FileSpreadsheet,
  CircleAlert,
} from "lucide-react";

import Asidebar from "./asidebar";

import "../../style/admin.css";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";


// =====================================================
// MAPLIBRE WORKER
// =====================================================

maplibregl.setWorkerUrl(workerUrl);


// =====================================================
// API
// =====================================================

const API_URL =
  import.meta.env.VITE_API_URL || "";


// =====================================================
// DEFAULT LOCATION
// =====================================================

const DEFAULT_LOCATION = {
  lat: 19.076,
  lng: 72.8777,
};


// =====================================================
// MAP STYLE
// =====================================================

const MAP_STYLE =
  "https://tiles.openfreemap.org/styles/liberty";


// =====================================================
// CREATE CIRCLE COORDINATES
// =====================================================

const createCircleCoordinates = (
  latitude,
  longitude,
  radius
) => {

  const earthRadius = 6371000;

  const centerLat =
    latitude * Math.PI / 180;

  const centerLon =
    longitude * Math.PI / 180;

  const angularDistance =
    radius / earthRadius;

  const points = 128;

  const coordinates = [];

  for (
    let i = 0;
    i <= points;
    i++
  ) {

    const bearing =
      (i / points) * 2 * Math.PI;

    const circleLat =
      Math.asin(
        Math.sin(centerLat) *
          Math.cos(angularDistance) +

        Math.cos(centerLat) *
          Math.sin(angularDistance) *
          Math.cos(bearing)
      );

    const circleLon =
      centerLon +

      Math.atan2(
        Math.sin(bearing) *
          Math.sin(angularDistance) *
          Math.cos(centerLat),

        Math.cos(angularDistance) -
          Math.sin(centerLat) *
            Math.sin(circleLat)
      );

    coordinates.push([
      circleLon * 180 / Math.PI,
      circleLat * 180 / Math.PI,
    ]);
  }

  return coordinates;
};


// =====================================================
// GEO-FENCE PAGE
// =====================================================

const GeoFence = () => {

  // ===================================================
  // MAP REFS
  // ===================================================

  const mapContainerRef =
    useRef(null);

  const mapRef =
    useRef(null);

  const markerRef =
    useRef(null);

  const popupRef =
    useRef(null);


  // ===================================================
  // STATE
  // ===================================================

  const [mode, setMode] =
    useState("manual");


  const [formData, setFormData] =
    useState({

      name: "",

      latitude: "",

      longitude: "",

      radius: "500",

      zoneType: "SAFE",

      riskLevel: "LOW",

      description: "",

      status: "ACTIVE",

      alertOnEntry: true,

      alertOnExit: true,

    });


  const [file, setFile] =
    useState(null);


  const [geofences, setGeofences] =
    useState([]);


  const [mapReady, setMapReady] =
    useState(false);


  const [loading, setLoading] =
    useState(false);


  const [saving, setSaving] =
    useState(false);


  // ===================================================
  // HANDLE FORM CHANGE
  // ===================================================

  const handleChange = (event) => {

    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData(
      previous => ({

        ...previous,

        [name]:
          type === "checkbox"
            ? checked
            : value,

      })
    );
  };


  // ===================================================
  // MAP INITIALIZATION
  // ===================================================

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

        style: MAP_STYLE,

        center: [
          DEFAULT_LOCATION.lng,
          DEFAULT_LOCATION.lat,
        ],

        zoom: 11,

      });


    mapRef.current = map;


    // -----------------------------------------------
    // NAVIGATION CONTROL
    // -----------------------------------------------

    map.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );


    // -----------------------------------------------
    // SCALE CONTROL
    // -----------------------------------------------

    map.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 150,
        unit: "metric",
      })
    );


    // -----------------------------------------------
    // MAP LOAD
    // -----------------------------------------------

    map.on("load", () => {

      setMapReady(true);

    });


    // -----------------------------------------------
    // MAP CLICK
    // -----------------------------------------------

    map.on("click", (event) => {

      const {
        lng,
        lat,
      } = event.lngLat;


      setFormData(
        previous => ({

          ...previous,

          latitude:
            lat.toFixed(7),

          longitude:
            lng.toFixed(7),

        })
      );


      showSelectedLocation(
        lat,
        lng,
        Number(formData.radius) || 500
      );

    });


    // -----------------------------------------------
    // CLEANUP
    // -----------------------------------------------

    return () => {

      if (markerRef.current) {

        markerRef.current.remove();

        markerRef.current = null;

      }


      if (popupRef.current) {

        popupRef.current.remove();

        popupRef.current = null;

      }


      map.remove();

      mapRef.current = null;

    };

  }, []);


  // ===================================================
  // SHOW SELECTED LOCATION
  // ===================================================

  const showSelectedLocation = (
    latitude,
    longitude,
    radius
  ) => {

    const map =
      mapRef.current;

    if (!map) {
      return;
    }


    // -----------------------------------------------
    // REMOVE OLD MARKER
    // -----------------------------------------------

    if (markerRef.current) {

      markerRef.current.remove();

      markerRef.current = null;

    }


    // -----------------------------------------------
    // REMOVE OLD POPUP
    // -----------------------------------------------

    if (popupRef.current) {

      popupRef.current.remove();

      popupRef.current = null;

    }


    // -----------------------------------------------
    // CREATE MARKER
    // -----------------------------------------------

    const markerElement =
      document.createElement("div");

    markerElement.style.width =
      "18px";

    markerElement.style.height =
      "18px";

    markerElement.style.background =
      "#0f766e";

    markerElement.style.border =
      "3px solid #ffffff";

    markerElement.style.borderRadius =
      "50%";

    markerElement.style.boxShadow =
      "0 2px 8px rgba(0,0,0,0.35)";


    markerRef.current =
      new maplibregl.Marker({
        element: markerElement,
      })

        .setLngLat([
          longitude,
          latitude,
        ])

        .addTo(map);


    // -----------------------------------------------
    // POPUP
    // -----------------------------------------------

    popupRef.current =
      new maplibregl.Popup({
        offset: 20,
        closeButton: true,
      })

        .setLngLat([
          longitude,
          latitude,
        ])

        .setHTML(`
          <div style="
            padding: 4px;
            font-family: Arial, sans-serif;
          ">
            <strong>
              Selected Location
            </strong>

            <div style="
              margin-top: 5px;
              font-size: 12px;
            ">
              Latitude:
              ${latitude.toFixed(7)}
            </div>

            <div style="
              font-size: 12px;
            ">
              Longitude:
              ${longitude.toFixed(7)}
            </div>

            <div style="
              font-size: 12px;
            ">
              Radius:
              ${radius} m
            </div>
          </div>
        `)

        .addTo(map);


    // -----------------------------------------------
    // MOVE MAP
    // -----------------------------------------------

    map.flyTo({

      center: [
        longitude,
        latitude,
      ],

      zoom: 14,

      duration: 700,

    });


    // -----------------------------------------------
    // PREVIEW CIRCLE
    // -----------------------------------------------

    drawPreviewCircle(
      latitude,
      longitude,
      radius
    );
  };


  // ===================================================
  // DRAW PREVIEW CIRCLE
  // ===================================================

  const drawPreviewCircle = (
    latitude,
    longitude,
    radius
  ) => {

    const map =
      mapRef.current;

    if (!map) {
      return;
    }


    const coordinates =
      createCircleCoordinates(
        latitude,
        longitude,
        radius
      );


    const geoJson = {

      type: "Feature",

      geometry: {

        type: "Polygon",

        coordinates: [
          coordinates,
        ],

      },

    };


    // -----------------------------------------------
    // UPDATE SOURCE IF IT EXISTS
    // -----------------------------------------------

    if (
      map.getSource(
        "geofence-preview"
      )
    ) {

      map.getSource(
        "geofence-preview"
      ).setData(geoJson);

      return;

    }


    // -----------------------------------------------
    // ADD SOURCE
    // -----------------------------------------------

    map.addSource(
      "geofence-preview",
      {

        type: "geojson",

        data: geoJson,

      }
    );


    // -----------------------------------------------
    // FILL
    // -----------------------------------------------

    map.addLayer({

      id:
        "geofence-preview-fill",

      type:
        "fill",

      source:
        "geofence-preview",

      paint: {

        "fill-color":
          "#0f766e",

        "fill-opacity":
          0.14,

      },

    });


    // -----------------------------------------------
    // BORDER
    // -----------------------------------------------

    map.addLayer({

      id:
        "geofence-preview-line",

      type:
        "line",

      source:
        "geofence-preview",

      paint: {

        "line-color":
          "#0f766e",

        "line-width":
          3,

        "line-opacity":
          0.9,

      },

    });

  };


  // ===================================================
  // UPDATE PREVIEW WHEN FORM CHANGES
  // ===================================================

  useEffect(() => {

    if (!mapReady) {
      return;
    }


    const latitude =
      Number(formData.latitude);

    const longitude =
      Number(formData.longitude);

    const radius =
      Number(formData.radius);


    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(radius) ||
      radius <= 0
    ) {

      return;

    }


    if (
      latitude < -90 ||
      latitude > 90
    ) {

      return;

    }


    if (
      longitude < -180 ||
      longitude > 180
    ) {

      return;

    }


    showSelectedLocation(
      latitude,
      longitude,
      radius
    );

  }, [
    formData.latitude,
    formData.longitude,
    formData.radius,
    mapReady,
  ]);


  // ===================================================
  // FETCH GEO-FENCES
  // ===================================================

  const fetchGeofences = async () => {

    try {

      setLoading(true);


      const response =
        await fetch(
          `${API_URL}/api/geofence`
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to fetch Geo-Fences."
        );

      }


      const normalized =
        (data.geofences || []).map(
          fence => ({

            id:
              fence.id,

            name:
              fence.name,

            latitude:
              Number(fence.latitude),

            longitude:
              Number(fence.longitude),

            radius:
              Number(fence.radius),

            zoneType:
              fence.zone_type,

            riskLevel:
              fence.risk_level,

            description:
              fence.description || "",

            status:
              fence.status,

            alertOnEntry:
              Boolean(
                fence.alert_on_entry
              ),

            alertOnExit:
              Boolean(
                fence.alert_on_exit
              ),

            createdAt:
              fence.created_at,

          })
        );


      setGeofences(normalized);

    } catch (error) {

      console.error(
        "Fetch Geo-Fences Error:",
        error
      );

      alert(
        error.message ||
        "Unable to load Geo-Fences."
      );

    } finally {

      setLoading(false);

    }

  };


  // ===================================================
  // LOAD GEO-FENCES WHEN PAGE OPENS
  // ===================================================

  useEffect(() => {

    fetchGeofences();

  }, []);


  // ===================================================
  // DRAW SAVED GEO-FENCES
  // ===================================================

  useEffect(() => {

    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady
    ) {
      return;
    }


    const drawSavedGeofences = () => {

      // ---------------------------------------------
      // REMOVE OLD LAYERS
      // ---------------------------------------------

      if (
        map.getLayer(
          "saved-geofences-fill"
        )
      ) {

        map.removeLayer(
          "saved-geofences-fill"
        );

      }


      if (
        map.getLayer(
          "saved-geofences-line"
        )
      ) {

        map.removeLayer(
          "saved-geofences-line"
        );

      }


      // ---------------------------------------------
      // REMOVE OLD SOURCE
      // ---------------------------------------------

      if (
        map.getSource(
          "saved-geofences"
        )
      ) {

        map.removeSource(
          "saved-geofences"
        );

      }


      // ---------------------------------------------
      // CREATE GEOJSON
      // ---------------------------------------------

      const geoJson = {

        type:
          "FeatureCollection",

        features:
          geofences.map(
            fence => ({

              type:
                "Feature",

              properties: {

                id:
                  fence.id,

                name:
                  fence.name,

                zoneType:
                  fence.zoneType,

                riskLevel:
                  fence.riskLevel,

                radius:
                  fence.radius,

              },

              geometry: {

                type:
                  "Polygon",

                coordinates: [

                  createCircleCoordinates(

                    fence.latitude,

                    fence.longitude,

                    fence.radius

                  ),

                ],

              },

            })
          ),

      };


      // ---------------------------------------------
      // ADD SOURCE
      // ---------------------------------------------

      map.addSource(
        "saved-geofences",
        {

          type:
            "geojson",

          data:
            geoJson,

        }
      );


      // ---------------------------------------------
      // FILL
      // ---------------------------------------------

      map.addLayer({

        id:
          "saved-geofences-fill",

        type:
          "fill",

        source:
          "saved-geofences",

        paint: {

          "fill-color":
            "#0f766e",

          "fill-opacity":
            0.12,

        },

      });


      // ---------------------------------------------
      // BORDER
      // ---------------------------------------------

      map.addLayer({

        id:
          "saved-geofences-line",

        type:
          "line",

        source:
          "saved-geofences",

        paint: {

          "line-color":
            "#0f766e",

          "line-width":
            3,

          "line-opacity":
            0.85,

        },

      });

    };


    if (map.isStyleLoaded()) {

      drawSavedGeofences();

    } else {

      map.once(
        "load",
        drawSavedGeofences
      );

    }


    // ---------------------------------------------
    // CLICK SAVED GEOFENCE
    // ---------------------------------------------

    const handleFenceClick =
      (event) => {

        const features =
          map.queryRenderedFeatures(
            event.point,
            {
              layers: [
                "saved-geofences-fill",
              ],
            }
          );


        if (
          !features.length
        ) {
          return;
        }


        const properties =
          features[0].properties;


        const fence =
          geofences.find(
            item =>
              String(item.id) ===
              String(properties.id)
          );


        if (!fence) {
          return;
        }


        showSelectedLocation(

          fence.latitude,

          fence.longitude,

          fence.radius

        );


        setFormData(
          previous => ({

            ...previous,

            latitude:
              fence.latitude.toFixed(7),

            longitude:
              fence.longitude.toFixed(7),

            radius:
              String(fence.radius),

          })
        );

      };


    map.on(
      "click",
      "saved-geofences-fill",
      handleFenceClick
    );


    map.on(
      "mouseenter",
      "saved-geofences-fill",
      () => {

        map.getCanvas().style.cursor =
          "pointer";

      }
    );


    map.on(
      "mouseleave",
      "saved-geofences-fill",
      () => {

        map.getCanvas().style.cursor =
          "";

      }
    );


    return () => {

      map.off(
        "click",
        "saved-geofences-fill",
        handleFenceClick
      );

      map.off(
        "mouseenter",
        "saved-geofences-fill"
      );

      map.off(
        "mouseleave",
        "saved-geofences-fill"
      );

    };

  }, [
    geofences,
    mapReady,
  ]);


  // ===================================================
  // CREATE GEO-FENCE
  // ===================================================

  const handleCreate = async () => {

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (
      !formData.name.trim()
    ) {

      alert(
        "Please enter Geo-Fence name."
      );

      return;

    }


    const latitude =
      Number(formData.latitude);

    const longitude =
      Number(formData.longitude);

    const radius =
      Number(formData.radius);


    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {

      alert(
        "Please enter a valid latitude."
      );

      return;

    }


    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {

      alert(
        "Please enter a valid longitude."
      );

      return;

    }


    if (
      !Number.isFinite(radius) ||
      radius <= 0
    ) {

      alert(
        "Please enter a valid radius."
      );

      return;

    }


    try {

      setSaving(true);


      const response =
        await fetch(
          `${API_URL}/api/geofence`,
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify({

                name:
                  formData.name.trim(),

                latitude,

                longitude,

                radius,

                zoneType:
                  formData.zoneType,

                riskLevel:
                  formData.riskLevel,

                description:
                  formData.description.trim(),

                status:
                  formData.status,

                alertOnEntry:
                  formData.alertOnEntry,

                alertOnExit:
                  formData.alertOnExit,

              }),

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to create Geo-Fence."
        );

      }


      alert(
        "Geo-Fence created successfully."
      );


      // ---------------------------------------------
      // RELOAD FROM DATABASE
      // ---------------------------------------------

      await fetchGeofences();


      // ---------------------------------------------
      // RESET FORM
      // ---------------------------------------------

      setFormData({

        name: "",

        latitude: "",

        longitude: "",

        radius: "500",

        zoneType: "SAFE",

        riskLevel: "LOW",

        description: "",

        status: "ACTIVE",

        alertOnEntry: true,

        alertOnExit: true,

      });


      // ---------------------------------------------
      // REMOVE MARKER
      // ---------------------------------------------

      if (markerRef.current) {

        markerRef.current.remove();

        markerRef.current = null;

      }


      // ---------------------------------------------
      // REMOVE POPUP
      // ---------------------------------------------

      if (popupRef.current) {

        popupRef.current.remove();

        popupRef.current = null;

      }


      // ---------------------------------------------
      // REMOVE PREVIEW CIRCLE
      // ---------------------------------------------

      const map =
        mapRef.current;

      if (map) {

        if (
          map.getLayer(
            "geofence-preview-fill"
          )
        ) {

          map.removeLayer(
            "geofence-preview-fill"
          );

        }


        if (
          map.getLayer(
            "geofence-preview-line"
          )
        ) {

          map.removeLayer(
            "geofence-preview-line"
          );

        }


        if (
          map.getSource(
            "geofence-preview"
          )
        ) {

          map.removeSource(
            "geofence-preview"
          );

        }

      }

    } catch (error) {

      console.error(
        "Create Geo-Fence Error:",
        error
      );

      alert(
        error.message ||
        "Failed to create Geo-Fence."
      );

    } finally {

      setSaving(false);

    }

  };


  // ===================================================
  // DELETE GEO-FENCE
  // ===================================================

  const handleDelete = async (
    id
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this Geo-Fence?"
      );


    if (!confirmed) {
      return;
    }


    try {

      const response =
        await fetch(
          `${API_URL}/api/geofence/${id}`,
          {

            method:
              "DELETE",

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to delete Geo-Fence."
        );

      }


      // ---------------------------------------------
      // REMOVE FROM UI
      // ---------------------------------------------

      setGeofences(
        previous =>
          previous.filter(
            fence =>
              fence.id !== id
          )
      );


      // ---------------------------------------------
      // REMOVE SELECTED MARKER
      // ---------------------------------------------

      if (markerRef.current) {

        markerRef.current.remove();

        markerRef.current = null;

      }


      if (popupRef.current) {

        popupRef.current.remove();

        popupRef.current = null;

      }


      alert(
        "Geo-Fence deleted successfully."
      );

    } catch (error) {

      console.error(
        "Delete Geo-Fence Error:",
        error
      );

      alert(
        error.message ||
        "Failed to delete Geo-Fence."
      );

    }

  };


  // ===================================================
  // VIEW GEO-FENCE
  // ===================================================

  const handleViewFence = (
    fence
  ) => {

    const map =
      mapRef.current;

    if (!map) {
      return;
    }


    setFormData(
      previous => ({

        ...previous,

        latitude:
          fence.latitude.toFixed(7),

        longitude:
          fence.longitude.toFixed(7),

        radius:
          String(fence.radius),

      })
    );


    showSelectedLocation(

      fence.latitude,

      fence.longitude,

      fence.radius

    );

  };


  // ===================================================
  // FILE SELECT
  // ===================================================

  const handleFileChange = (
    event
  ) => {

    const selectedFile =
      event.target.files?.[0];


    if (!selectedFile) {
      return;
    }


    const fileName =
      selectedFile.name.toLowerCase();


    if (
      !fileName.endsWith(".xlsx") &&
      !fileName.endsWith(".xls")
    ) {

      alert(
        "Please select an Excel file (.xls or .xlsx)."
      );

      event.target.value = "";

      setFile(null);

      return;

    }


    setFile(
      selectedFile
    );

  };


  // ===================================================
  // IMPORT EXCEL
  // ===================================================

  const handleExcelImport = () => {

    if (!file) {

      alert(
        "Please select an Excel file first."
      );

      return;

    }


    alert(
      "Excel file selected successfully. Excel database import can be connected next."
    );

  };


  // ===================================================
  // JSX
  // ===================================================

return (
  <div className="admin-layout">

    <Asidebar />

    <main className="admin-main">

      {/* =========================================
          GEO-FENCE PAGE
      ========================================= */}

      <div className="geofence-page">

        {/* =======================================
            HEADER
        ======================================= */}

        <div className="geofence-header">

          <div>
            <h1>Geo-Fence Management</h1>

            <p>
              Create and manage tourist safety zones.
            </p>
          </div>

          <div className="geofence-count">

            <strong>
              {geofences.length}
            </strong>

            <span>
              Total Geo-Fences
            </span>

          </div>

        </div>


        {/* =======================================
            MAIN CONTENT
        ======================================= */}

        <div className="geofence-content">

          {/* =====================================
              LEFT CARD
          ===================================== */}

          <section className="geofence-card">

            {/* TABS */}

            <div className="geofence-tabs">

              <button
                type="button"
                className={
                  `geofence-tab ${
                    mode === "manual"
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  setMode("manual")
                }
              >

                <MapIcon size={18} />

                Manual

              </button>


              <button
                type="button"
                className={
                  `geofence-tab ${
                    mode === "excel"
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  setMode("excel")
                }
              >

                <FileSpreadsheet size={18} />

                Excel

              </button>

            </div>


            {/* ===================================
                MANUAL MODE
            =================================== */}

            {mode === "manual" && (

              <div className="geofence-form">

                {/* FORM TITLE */}

                <div className="geofence-form-title">

                  <h2>
                    Create Geo-Fence
                  </h2>

                  <p>
                    Define a safety zone using location
                    and radius.
                  </p>

                </div>


                {/* MAP HELP */}

                <div className="geofence-map-help">

                  <MapPin size={18} />

                  <div>

                    <strong>
                      Select location from map
                    </strong>

                    <span>
                      You can enter coordinates manually
                      or click anywhere on the map.
                    </span>

                  </div>

                </div>


                {/* NAME */}

                <div className="geofence-form-group">

                  <label>
                    Geo-Fence Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Gateway of India"
                  />

                </div>


                {/* COORDINATES */}

                <div className="geofence-coordinate-row">

                  <div className="geofence-form-group">

                    <label>
                      Latitude
                    </label>

                    <input
                      type="number"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="19.0760000"
                      step="any"
                    />

                  </div>


                  <div className="geofence-form-group">

                    <label>
                      Longitude
                    </label>

                    <input
                      type="number"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="72.8777000"
                      step="any"
                    />

                  </div>

                </div>


                {/* RADIUS */}

                <div className="geofence-form-group">

                  <label>
                    Radius
                  </label>

                  <div className="geofence-radius-wrapper">

                    <input
                      type="number"
                      name="radius"
                      value={formData.radius}
                      onChange={handleChange}
                      min="1"
                      placeholder="500"
                    />

                    <span>
                      meters
                    </span>

                  </div>

                </div>


                {/* ZONE + RISK */}

                <div className="geofence-coordinate-row">

                  <div className="geofence-form-group">

                    <label>
                      Zone Type
                    </label>

                    <select
                      name="zoneType"
                      value={formData.zoneType}
                      onChange={handleChange}
                    >

                      <option value="SAFE">
                        Safe
                      </option>

                      <option value="CAUTION">
                        Caution
                      </option>

                      <option value="RESTRICTED">
                        Restricted
                      </option>

                      <option value="DANGER">
                        Danger
                      </option>

                    </select>

                  </div>


                  <div className="geofence-form-group">

                    <label>
                      Risk Level
                    </label>

                    <select
                      name="riskLevel"
                      value={formData.riskLevel}
                      onChange={handleChange}
                    >

                      <option value="LOW">
                        Low
                      </option>

                      <option value="MEDIUM">
                        Medium
                      </option>

                      <option value="HIGH">
                        High
                      </option>

                      <option value="CRITICAL">
                        Critical
                      </option>

                    </select>

                  </div>

                </div>


                {/* STATUS */}

                <div className="geofence-form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >

                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>

                  </select>

                </div>


                {/* DESCRIPTION */}

                <div className="geofence-form-group">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Enter Geo-Fence description..."
                  />

                </div>


                {/* ALERT OPTIONS */}

                <div className="geofence-alert-options">

                  <label>

                    <input
                      type="checkbox"
                      name="alertOnEntry"
                      checked={formData.alertOnEntry}
                      onChange={handleChange}
                    />

                    <span>
                      Alert on Entry
                    </span>

                  </label>


                  <label>

                    <input
                      type="checkbox"
                      name="alertOnExit"
                      checked={formData.alertOnExit}
                      onChange={handleChange}
                    />

                    <span>
                      Alert on Exit
                    </span>

                  </label>

                </div>


                {/* CREATE */}

                <button
                  type="button"
                  className="geofence-create-btn"
                  onClick={handleCreate}
                  disabled={saving}
                >

                  <Plus size={18} />

                  {saving
                    ? "Creating..."
                    : "Create Geo-Fence"}

                </button>

              </div>

            )}


            {/* ===================================
                EXCEL MODE
            =================================== */}

            {mode === "excel" && (

              <div className="geofence-excel-section">

                <div className="geofence-upload-box">

                  <Upload size={32} />

                  <h3>
                    Upload Excel File
                  </h3>

                  <p>
                    Upload an .xls or .xlsx file
                    containing Geo-Fence data.
                  </p>


                  {/* HIDDEN FILE INPUT */}

                  <input
                    id="geofence-excel-file"
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />


                  {/* CHOOSE FILE */}

                  <label
                    htmlFor="geofence-excel-file"
                    className="geofence-file-btn"
                  >

                    <FileSpreadsheet size={16} />

                    Choose Excel File

                  </label>


                  {/* SELECTED FILE */}

                  {file && (

                    <div className="geofence-selected-file">

                      <FileSpreadsheet size={18} />

                      <span>
                        {file.name}
                      </span>

                    </div>

                  )}

                </div>


                {/* EXCEL FORMAT */}

                <div className="geofence-excel-format">

                  <h3>
                    Expected Excel Columns
                  </h3>

                  <div className="geofence-column-list">

                    <span>name</span>

                    <span>latitude</span>

                    <span>longitude</span>

                    <span>radius</span>

                    <span>zone_type</span>

                    <span>risk_level</span>

                    <span>description</span>

                  </div>

                  <p>
                    Make sure the Excel file contains
                    these columns before importing.
                  </p>

                </div>


                {/* IMPORT BUTTON */}

                <button
                  type="button"
                  className="geofence-create-btn"
                  onClick={handleExcelImport}
                >

                  <Upload size={18} />

                  Import Geo-Fences

                </button>

              </div>

            )}

          </section>


          {/* =====================================
              MAP CARD
          ===================================== */}

          <section className="geofence-map-card">

            {/* MAP HEADER */}

            <div className="geofence-map-header">

              <div>

                <h2>
                  Map Preview
                </h2>

                <p>
                  Click anywhere on the map to select
                  a Geo-Fence location.
                </p>

              </div>


              <div className="geofence-map-status">

                <span />

                Map Ready

              </div>

            </div>


            {/* MAP */}

            <div
              ref={mapContainerRef}
              className="geofence-map"
            />


            {/* MAP INFO */}

            <div className="geofence-map-info">

              <div>

                <MapPin size={14} />

                <span>
                  Click on the map to choose location
                </span>

              </div>


              {formData.latitude &&
                formData.longitude && (

                  <div className="geofence-selected-coordinates">

                    <strong>
                      Selected:
                    </strong>

                    {Number(
                      formData.latitude
                    ).toFixed(6)}
                    {" , "}
                    {Number(
                      formData.longitude
                    ).toFixed(6)}

                  </div>

                )}

            </div>

          </section>

        </div>


        {/* =======================================
            SAVED GEO-FENCES
        ======================================= */}

        <section className="geofence-table-card">

          {/* TABLE HEADER */}

          <div className="geofence-table-header">

            <div>

              <h2>
                Saved Geo-Fences
              </h2>

              <p>
                Geo-Fences stored in the database.
              </p>

            </div>


            <div className="geofence-table-count">

              {loading
                ? "Loading..."
                : `${geofences.length} Geo-Fence${
                    geofences.length === 1
                      ? ""
                      : "s"
                  }`}

            </div>

          </div>


          {/* TABLE */}

          <div className="geofence-table-wrapper">

            <table className="geofence-table">

              <thead>

                <tr>

                  <th>
                    Name
                  </th>

                  <th>
                    Location
                  </th>

                  <th>
                    Radius
                  </th>

                  <th>
                    Zone
                  </th>

                  <th>
                    Risk
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {geofences.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="geofence-empty"
                    >

                      <MapPin size={28} />

                      <h3>
                        No Geo-Fences Found
                      </h3>

                      <p>
                        Create your first Geo-Fence
                        using the form above.
                      </p>

                    </td>

                  </tr>

                ) : (

                  geofences.map(
                    fence => (

                      <tr
                        key={fence.id}
                      >

                        {/* NAME */}

                        <td>

                          <strong>
                            {fence.name}
                          </strong>

                        </td>


                        {/* LOCATION */}

                        <td>

                          <div>
                            {fence.latitude.toFixed(6)}
                          </div>

                          <div>
                            {fence.longitude.toFixed(6)}
                          </div>

                        </td>


                        {/* RADIUS */}

                        <td>
                          {fence.radius} m
                        </td>


                        {/* ZONE */}

                        <td>

                          <span className="geofence-zone-badge">

                            {fence.zoneType}

                          </span>

                        </td>


                        {/* RISK */}

                        <td>

                          <span className="geofence-risk-badge">

                            {fence.riskLevel}

                          </span>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={
                              `geofence-status-badge ${
                                fence.status ===
                                "ACTIVE"
                                  ? "active"
                                  : "inactive"
                              }`
                            }
                          >

                            <span />

                            {fence.status}

                          </span>

                        </td>


                        {/* ACTIONS */}

                        <td>

                          <div className="geofence-actions">

                            <button
                              type="button"
                              className="geofence-view-btn"
                              title="View Geo-Fence"
                              onClick={() =>
                                handleViewFence(
                                  fence
                                )
                              }
                            >

                              <Eye size={17} />

                            </button>


                            <button
                              type="button"
                              className="geofence-delete-btn"
                              title="Delete Geo-Fence"
                              onClick={() =>
                                handleDelete(
                                  fence.id
                                )
                              }
                            >

                              <Trash2 size={17} />

                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>

    </main>

  </div>
);
};


export default GeoFence;