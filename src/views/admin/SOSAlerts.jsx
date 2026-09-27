import React, { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
maplibregl.setWorkerUrl(workerUrl);

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  ShieldCheck,
  Siren,
  User,
  XCircle,
} from "lucide-react";

import Asidebar from "./asidebar";
import "../../style/admin.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const FILTERS = ["ALL", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"];

const formatDate = (date) => {
  if (!date) return "Unknown";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Unknown";

  return parsedDate.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStatusClass = (status) => {
  switch (status) {
    case "ACTIVE":
      return "sos-status-active";
    case "ACKNOWLEDGED":
      return "sos-status-acknowledged";
    case "RESOLVED":
      return "sos-status-resolved";
    default:
      return "";
  }
};

const SOSAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const selectedAlert =
    alerts.find((alert) => alert.id === selectedAlertId) || alerts[0] || null;

  const fetchAlerts = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(`${API_URL}/api/sos/alerts`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch SOS alerts.");
      }

      const fetchedAlerts = Array.isArray(data.alerts) ? data.alerts : [];

      setAlerts(fetchedAlerts);

      setSelectedAlertId((currentId) => {
        if (currentId && fetchedAlerts.some((item) => item.id === currentId)) {
          return currentId;
        }

        return fetchedAlerts[0]?.id ?? null;
      });
    } catch (err) {
      console.error("Fetch SOS alerts error:", err);
      setError(err.message || "Unable to load SOS alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("sos:alert", (newAlert) => {
      setAlerts((currentAlerts) => {
        const exists = currentAlerts.some(
          (alert) => alert.id === newAlert.id
        );

        if (exists) {
          return currentAlerts.map((alert) =>
            alert.id === newAlert.id ? { ...alert, ...newAlert } : alert
          );
        }

        return [newAlert, ...currentAlerts];
      });

      setSelectedAlertId(newAlert.id);
    });

    socket.on("sos:status", (updatedAlert) => {
      setAlerts((currentAlerts) =>
        currentAlerts.map((alert) =>
          alert.id === updatedAlert.id
            ? { ...alert, status: updatedAlert.status }
            : alert
        )
      );
    });

    socket.on("connect_error", (err) => {
      console.error("SOS Socket connection error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchAlerts]);

  // Initialize the MapLibre map once.
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [72.8777, 19.076],
      zoom: 10,
      attributionControl: true,
    });

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

    map.addControl(new maplibregl.FullscreenControl(), "top-right");

    map.on("load", () => {
      map.resize();
    });

    map.on("error", (event) => {
      console.error("MapLibre error:", event.error || event);
    });

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;

      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Move the map marker whenever the selected SOS alert changes.
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !selectedAlert) return;

    const latitude = Number(selectedAlert.latitude);
    const longitude = Number(selectedAlert.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return;
    }

    const coordinates = [longitude, latitude];

    map.flyTo({
      center: coordinates,
      zoom: 15,
      speed: 1.2,
      essential: true,
    });

    markerRef.current?.remove();

    const markerElement = document.createElement("div");
    markerElement.className = "sos-map-marker";

    const markerPulse = document.createElement("div");
    markerPulse.className = "sos-map-marker-pulse";

    const markerCore = document.createElement("div");
    markerCore.className = "sos-map-marker-core";
    markerCore.textContent = "!";

    markerElement.appendChild(markerPulse);
    markerElement.appendChild(markerCore);

    const popup = new maplibregl.Popup({
      offset: 24,
      closeButton: false,
    }).setHTML(`
      <div class="sos-map-popup">
        <strong>${escapeHTML(selectedAlert.full_name || "Tourist")}</strong>
        <span>${escapeHTML(selectedAlert.tourist_id || "Tourist ID unavailable")}</span>
        <span>${escapeHTML(selectedAlert.status || "ACTIVE")}</span>
      </div>
    `);

    markerRef.current = new maplibregl.Marker({
      element: markerElement,
      anchor: "center",
    })
      .setLngLat(coordinates)
      .setPopup(popup)
      .addTo(map);

    // Ensure the map sizes correctly when displayed in the dashboard.
    const resizeTimer = window.setTimeout(() => {
      map.resize();
    }, 150);

    return () => window.clearTimeout(resizeTimer);
  }, [selectedAlert]);

  const updateStatus = async (alertId, status) => {
    try {
      setUpdatingId(alertId);
      setError("");

      const response = await fetch(
        `${API_URL}/api/sos/${alertId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update SOS status.");
      }

      setAlerts((currentAlerts) =>
        currentAlerts.map((alert) =>
          alert.id === alertId
            ? { ...alert, status: data.alert?.status || status }
            : alert
        )
      );
    } catch (err) {
      console.error("Update SOS status error:", err);
      setError(err.message || "Unable to update SOS status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAlerts =
    filter === "ALL"
      ? alerts
      : alerts.filter((alert) => alert.status === filter);

  const activeCount = alerts.filter(
    (alert) => alert.status === "ACTIVE"
  ).length;

  const acknowledgedCount = alerts.filter(
    (alert) => alert.status === "ACKNOWLEDGED"
  ).length;

  const resolvedCount = alerts.filter(
    (alert) => alert.status === "RESOLVED"
  ).length;

  return (
    <div className="admin-dashboard sos-page">
      <Asidebar />

      <main className="admin-main sos-main">
        <div className="sos-page-header">
          <div>
            <div className="sos-eyebrow">
              <ShieldCheck size={15} />
              TOURSAFE ADMINISTRATION
            </div>

            <h1>SOS Alerts</h1>

            <p>
              Monitor tourist emergency alerts and manage incident status.
            </p>
          </div>

          <button
            type="button"
            className="sos-refresh-btn"
            onClick={fetchAlerts}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "sos-spinning" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="sos-error-message">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        <section className="sos-stats-grid">
          <div className="sos-stat-card">
            <div className="sos-stat-icon sos-stat-icon-total">
              <Siren size={21} />
            </div>
            <div>
              <span>Total Alerts</span>
              <strong>{alerts.length}</strong>
            </div>
          </div>

          <div className="sos-stat-card">
            <div className="sos-stat-icon sos-stat-icon-active">
              <AlertTriangle size={21} />
            </div>
            <div>
              <span>Active</span>
              <strong>{activeCount}</strong>
            </div>
          </div>

          <div className="sos-stat-card">
            <div className="sos-stat-icon sos-stat-icon-ack">
              <Clock size={21} />
            </div>
            <div>
              <span>Acknowledged</span>
              <strong>{acknowledgedCount}</strong>
            </div>
          </div>

          <div className="sos-stat-card">
            <div className="sos-stat-icon sos-stat-icon-resolved">
              <CheckCircle size={21} />
            </div>
            <div>
              <span>Resolved</span>
              <strong>{resolvedCount}</strong>
            </div>
          </div>
        </section>

        <section className="sos-content-grid">
          <div className="sos-alerts-panel">
            <div className="sos-panel-heading">
              <div>
                <h2>Emergency Reports</h2>
                <p>Select an alert to view its location.</p>
              </div>

              <span className="sos-total-badge">
                {filteredAlerts.length}
              </span>
            </div>

            <div className="sos-filter-tabs">
              {FILTERS.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={filter === item ? "active" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item === "ALL"
                    ? "All"
                    : item.charAt(0) + item.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="sos-alert-list">
              {loading ? (
                <div className="sos-empty-state">
                  <RefreshCw size={24} className="sos-spinning" />
                  <p>Loading SOS alerts...</p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="sos-empty-state">
                  <ShieldCheck size={30} />
                  <h3>No alerts found</h3>
                  <p>
                    {filter === "ALL"
                      ? "No SOS alerts have been recorded."
                      : `There are no ${filter.toLowerCase()} alerts.`}
                  </p>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const isSelected = selectedAlert?.id === alert.id;

                  return (
                    <button
                      type="button"
                      key={alert.id}
                      className={`sos-alert-item ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => setSelectedAlertId(alert.id)}
                    >
                      <div className="sos-alert-item-top">
                        <div className="sos-alert-avatar">
                          <Siren size={19} />
                        </div>

                        <span
                          className={`sos-status-badge ${getStatusClass(
                            alert.status
                          )}`}
                        >
                          <span />
                          {alert.status || "ACTIVE"}
                        </span>
                      </div>

                      <h3>{alert.full_name || "Unknown Tourist"}</h3>

                      <p className="sos-tourist-id">
                        Tourist ID: {alert.tourist_id || "N/A"}
                      </p>

                      <div className="sos-alert-meta">
                        <span>
                          <Clock size={14} />
                          {formatDate(alert.created_at)}
                        </span>

                        <span>
                          <MapPin size={14} />
                          {Number(alert.latitude).toFixed(5)},{" "}
                          {Number(alert.longitude).toFixed(5)}
                        </span>
                      </div>

                      <div className="sos-alert-item-footer">
                        <span>Alert #{alert.id}</span>
                        <span className="sos-view-location">
                          View location <Navigation size={14} />
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="sos-details-panel">
            <div className="sos-panel-heading">
              <div>
                <h2>Alert Location</h2>
                <p>MapLibre live incident view</p>
              </div>

              {selectedAlert && (
                <span
                  className={`sos-status-badge ${getStatusClass(
                    selectedAlert.status
                  )}`}
                >
                  <span />
                  {selectedAlert.status}
                </span>
              )}
            </div>

            <div className="sos-map-container" ref={mapContainerRef}>
              {!selectedAlert && (
                <div className="sos-map-empty-overlay">
                  <MapPin size={28} />
                  <span>Select an SOS alert to view its location</span>
                </div>
              )}
            </div>

            {selectedAlert ? (
              <div className="sos-selected-details">
                <div className="sos-selected-title">
                  <div className="sos-selected-avatar">
                    <User size={21} />
                  </div>

                  <div>
                    <h3>{selectedAlert.full_name || "Unknown Tourist"}</h3>
                    <p>
                      Tourist ID: {selectedAlert.tourist_id || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="sos-detail-grid">
                  <div className="sos-detail-item">
                    <span>Email</span>
                    <strong>{selectedAlert.email || "Not available"}</strong>
                  </div>

                  <div className="sos-detail-item">
                    <span>Phone</span>
                    <strong className="sos-phone-value">
                      <Phone size={14} />
                      {selectedAlert.phone || "Not available"}
                    </strong>
                  </div>

                  <div className="sos-detail-item">
                    <span>Latitude</span>
                    <strong>{selectedAlert.latitude}</strong>
                  </div>

                  <div className="sos-detail-item">
                    <span>Longitude</span>
                    <strong>{selectedAlert.longitude}</strong>
                  </div>

                  <div className="sos-detail-item">
                    <span>Risk</span>
                    <strong>
                      {selectedAlert.risk === null ||
                      selectedAlert.risk === undefined
                        ? "Not available"
                        : `${selectedAlert.risk}%`}
                    </strong>
                  </div>

                  <div className="sos-detail-item">
                    <span>Reported At</span>
                    <strong>{formatDate(selectedAlert.created_at)}</strong>
                  </div>
                </div>

                <div className="sos-message-box">
                  <span>Emergency Message</span>
                  <p>
                    {selectedAlert.message || "Tourist SOS emergency alert"}
                  </p>
                </div>

                <div className="sos-action-buttons">
                  {selectedAlert.status === "ACTIVE" && (
                    <button
                      type="button"
                      className="sos-acknowledge-btn"
                      disabled={updatingId === selectedAlert.id}
                      onClick={() =>
                        updateStatus(selectedAlert.id, "ACKNOWLEDGED")
                      }
                    >
                      <Clock size={16} />
                      {updatingId === selectedAlert.id
                        ? "Updating..."
                        : "Acknowledge"}
                    </button>
                  )}

                  {selectedAlert.status !== "RESOLVED" && (
                    <button
                      type="button"
                      className="sos-resolve-btn"
                      disabled={updatingId === selectedAlert.id}
                      onClick={() =>
                        updateStatus(selectedAlert.id, "RESOLVED")
                      }
                    >
                      <CheckCircle size={16} />
                      {updatingId === selectedAlert.id
                        ? "Updating..."
                        : "Resolve Alert"}
                    </button>
                  )}

                  {selectedAlert.status === "RESOLVED" && (
                    <div className="sos-resolved-note">
                      <CheckCircle size={17} />
                      This alert has been resolved.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="sos-no-selection">
                <MapPin size={24} />
                <p>Select an alert to see tourist details and location.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

// Prevent alert text from being interpreted as HTML inside the map popup.
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

export default SOSAlerts;