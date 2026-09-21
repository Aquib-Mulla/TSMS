import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  ShieldCheck,
  Siren,
  Navigation,
  ArrowRight,
} from "lucide-react";

import "../../style/style.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Home = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const isLoggedIn =
    localStorage.getItem("token") &&
    localStorage.getItem("user");

  return (
    <div className="tour-home">
        <Navbar />


      {/* ================= HERO ================= */}
      <section className="hero">

        <div className="hero-overlay"></div>

        <div className="hero-content">

          <div className="hero-badge">
            <ShieldCheck size={16} />
            Smart Tourist Safety System
          </div>

          <h1>
            Explore Freely.
            <br />
            <span>Travel Safely.</span>
          </h1>

          <p>
            Stay connected and protected wherever your journey takes you.
            TourSafe provides real-time location tracking, geo-fencing
            alerts and emergency assistance for safer travel.
          </p>

        <div className="hero-buttons">

          {!isLoggedIn && (
            <Link to="/register" className="primary-btn">
              Start Your Journey
              <ArrowRight size={18} />
            </Link>
          )}

          <Link to="/map" className="secondary-btn">
            Explore Live Map
          </Link>

        </div>

        </div>


      </section>


      {/* ================= IMAGE CARDS ================= not showing*/}
      {/* <section className="travel-gallery">

        <div className="gallery-heading">
          <span>SMART TRAVEL</span>
          <h2>
            Your journey,
            <br />
            <em>our responsibility.</em>
          </h2>
        </div>

        <div className="gallery-grid">

          <div className="travel-card card-one">
            <img
              src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80"
              alt="Tourist destination"
            />
          </div>

          <div className="travel-card card-two">
            <img
              src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80"
              alt="Tourists travelling"
            />
          </div>

          <div className="travel-card card-three">
            <img
              src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=80"
              alt="Travel road"
            />
          </div>

          <div className="travel-card card-four">
            <img
              src="https://images.unsplash.com/photo-1521292270410-a8c4d716d518?auto=format&fit=crop&w=900&q=80"
              alt="Mountain travel"
            />
          </div>

        </div>

        <div className="gallery-line"></div>

      </section> */}


      {/* ================= FEATURES ================= */}
      <section className="features-section">

        <div className="section-title">

          <span>SAFETY FEATURES</span>

          <h2>
            Everything you need
            <br />
            <em>for a safer journey.</em>
          </h2>

          <p>
            TourSafe combines modern location technology with intelligent
            safety monitoring to keep tourists informed and protected.
          </p>

        </div>


        <div className="features-grid">

          {/* Feature 1 */}
          <div className="feature-card">

            <div className="feature-number">01</div>

            <div className="feature-icon">
              <MapPin />
            </div>

            <h3>Live Location Tracking</h3>

            <p>
              Monitor the tourist's real-time location using GPS and
              keep track of their journey.
            </p>

            <Link to="/map">
              Explore Map <ArrowRight size={16} />
            </Link>

          </div>


          {/* Feature 2 */}
          <div className="feature-card">

            <div className="feature-number">02</div>

            <div className="feature-icon">
              <ShieldCheck />
            </div>

            <h3>Geo-Fencing Alerts</h3>

            <p>
              Automatically detect when a tourist enters or leaves
              predefined safe and danger zones.
            </p>

            <Link to="/geofence">
              View Safety Zones <ArrowRight size={16} />
            </Link>

          </div>


          {/* Feature 3 */}
          <div className="feature-card">

            <div className="feature-number">03</div>

            <div className="feature-icon">
              <Siren />
            </div>

            <h3>Emergency SOS</h3>

            <p>
              Send an emergency alert when immediate assistance is
              required.
            </p>

            <Link to="/sos">
              Emergency Help <ArrowRight size={16} />
            </Link>

          </div>


          {/* Feature 4 */}
          <div className="feature-card">

            <div className="feature-number">04</div>

            <div className="feature-icon">
              <Navigation />
            </div>

            <h3>Danger Zone Detection</h3>

            <p>
              Receive warnings when entering a potentially unsafe
              geographical area.
            </p>

            <Link to="/geofence">
              Check Zones <ArrowRight size={16} />
            </Link>

          </div>

        </div>

      </section>


      {/* ================= HOW IT WORKS ================= *  we are not showing the ho section*/}
      {/* <section className="how-section">

        <div className="how-image">

          <img
            src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=85"
            alt="Tourists exploring"
          />

          <div className="floating-location">

            <div className="location-pin">
              <MapPin size={18} />
            </div>

            <div>
              <small>Live Location</small>
              <strong>Protected Area</strong>
            </div>

          </div>

        </div>


        <div className="how-content">

          <span>HOW IT WORKS</span>

          <h2>
            Safety that works
            <br />
            <em>behind the scenes.</em>
          </h2>

          <p>
            TourSafe continuously monitors tourist movement and checks
            their location against predefined geographical boundaries.
          </p>


          <div className="steps">

            <div className="step">

              <div className="step-number">01</div>

              <div>
                <h3>Register</h3>
                <p>
                  Create your tourist account and receive a unique
                  tracking identity.
                </p>
              </div>

            </div>


            <div className="step">

              <div className="step-number">02</div>

              <div>
                <h3>Start Tracking</h3>
                <p>
                  Allow GPS access to securely share your live
                  location.
                </p>
              </div>

            </div>


            <div className="step">

              <div className="step-number">03</div>

              <div>
                <h3>Get Protected</h3>
                <p>
                  Receive geo-fencing warnings and emergency
                  notifications when required.
                </p>
              </div>

            </div>

          </div>

        </div>

      </section> */}


      {/* ================= SAFETY CTA ================= */}
      <section className="cta-section">

        <div className="cta-content">

          <span>TRAVEL WITH CONFIDENCE</span>

          <h2>
            Your safety comes
            <br />
            <em>first.</em>
          </h2>

          <p>
            Start your journey with TourSafe and experience a smarter,
            safer way to explore.
          </p>

          <Link to="/register" className="cta-button">
            Start Tracking
            <ArrowRight size={18} />
          </Link>

        </div>

      </section>
      {/* footer */}
      <Footer />


    </div>
  );
};

export default Home;