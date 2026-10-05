import { Routes, Route } from "react-router-dom";

import Home from "../views/pages/Home";
import Login from "../views/auth/Login";
import Register from "../views/auth/Register";
import About from "../views/pages/About";
import Map from "../views/pages/Map";
import Contact from "../views/pages/Contact";
// for admin
import AdminLogin from "../views/admin/AdminLogin";
import AdminDashboard from "../views/admin/AdminDashboard";
import Tourists from "../views/admin/Tourists";
import LiveMap from "../views/admin/LiveMap";
import SOSAlerts from "../views/admin/SOSAlerts";
import GeoFence from "../views/admin/GeoFence";
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<About />} />
      <Route path="/map" element={<Map />} />
      <Route path="/contact" element={<Contact />} />
      {/* ===========admin============ */}
      <Route path="/adminlogin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/tourists" element={<Tourists />} />
      <Route path="/admin/livemap" element={<LiveMap />}/>
      <Route path="/admin/sos-alerts" element={<SOSAlerts />}/>
      <Route path="/admin/geofences" element={<GeoFence />}/>
    </Routes>
  );
}

export default AppRoutes;