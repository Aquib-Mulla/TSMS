import React from "react";

function AppRoutes() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#ffffff",
        color: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            color: "#0f766e",
            marginBottom: "10px",
          }}
        >
          TourSafe
        </h1>

        <p>
          AppRoutes is working.
        </p>

        <p>
          React + Vite + BrowserRouter are working correctly.
        </p>
      </div>
    </div>
  );
}

export default AppRoutes;