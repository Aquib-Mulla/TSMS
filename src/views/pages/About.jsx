import React from "react";
import "../../style/style.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
const About = () => {
  return (
    <div className="about-page">
      <Navbar />
      {/* HERO */}
      <section
        className="about-hero"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1600&q=80')",
        }}
      >
        <div className="about-overlay"></div>

        <div className="about-hero-content">
          {/* <p>TOURSAFE</p> */}
          <h1>About</h1>
          <span>
            Smart Tourist Safety Monitoring System using Geo-Fencing
          </span>
        </div>
      </section>

      {/* WHAT IS THE SYSTEM */}
      <section className="about-info">

        <div className="about-text">
          <p className="section-label">
            WHAT IS TOURIST SAFETY MONITORING SYSTEM?
          </p>

          <h2>
            Safer tourism through
            <span> smart technology.</span>
          </h2>

          <p>
            Tourist Safety Monitoring System is a technology-based system
            designed to improve the safety of tourists while travelling.
          </p>

          <p>
            The system uses GPS location tracking and geo-fencing to monitor
            predefined geographical areas. When a tourist enters or leaves a
            monitored area, the system can detect the event and generate a
            safety alert.
          </p>

          <p>
            The system can also provide Emergency SOS and incident monitoring
            to support tourists during emergency situations.
          </p>
        </div>

        <div className="about-image">
          <img
            src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1000&q=80"
            alt="Tourist safety"
          />
        </div>

      </section>


      {/* HOW CAN YOU USE IT */}
      <section className="use-section">

        <div className="use-image">
          <img
            src="https://images.unsplash.com/photo-1504150558240-0b4fd8946624?auto=format&fit=crop&w=1000&q=80"
            alt="Tourist using navigation"
          />
        </div>

        <div className="use-content">

          <p className="section-label">
            HOW CAN YOU USE IT?
          </p>

          <h2>
            Simple steps for
            <span> safer travel.</span>
          </h2>

          <p>
            Tourists can use the system by registering their account and
            enabling location access.
          </p>

          <div className="use-step">
            <strong>01</strong>

            <div>
              <h3>Register</h3>
              <p>Create your account in the system.</p>
            </div>
          </div>

          <div className="use-step">
            <strong>02</strong>

            <div>
              <h3>Enable Location</h3>
              <p>Allow the system to access your current location.</p>
            </div>
          </div>

          <div className="use-step">
            <strong>03</strong>

            <div>
              <h3>Stay Protected</h3>
              <p>Receive alerts when entering monitored areas.</p>
            </div>
          </div>

          <div className="use-step">
            <strong>04</strong>

            <div>
              <h3>Use SOS</h3>
              <p>Send an emergency request when assistance is needed.</p>
            </div>
          </div>

        </div>

      </section>
      <Footer />
    </div>
  );
};

export default About;