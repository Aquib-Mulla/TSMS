
import React from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import "../../style/style.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


const Contact = () => {
  return (
    <div className="contact-page">
        <Navbar/>
      {/* ================= CONTACT HEADING ================= */}
      <section className="contact-heading">
        <div className="contact-heading-overlay">
          <h1>Contact</h1>
          <p>
            We are here to help. Get in touch with us.
          </p>
        </div>
      </section>


      {/* ================= CONTACT SECTION ================= */}
      <section className="contact-section">

        <div className="contact-container">

          {/* ================= GET IN TOUCH ================= */}
          <div className="get-touch">

            <h2>Get in Touch</h2>

            <p className="get-touch-text">
              Have a question or need assistance? Contact us through
              any of the options below.
            </p>

            {/* ================= THREE CARDS ================= */}
            <div className="contact-cards">

              {/* EMAIL CARD */}
              <div className="contact-card">
                <div className="card-icon">
                  <Mail size={25} />
                </div>

                <h3>Email Us</h3>

                <p>
                  support@toursafe.com
                </p>
              </div>


              {/* PHONE CARD */}
              <div className="contact-card">
                <div className="card-icon">
                  <Phone size={25} />
                </div>

                <h3>Call Us</h3>

                <p>
                  +91 98765 43210
                </p>
              </div>


              {/* LOCATION CARD */}
              <div className="contact-card">
                <div className="card-icon">
                  <MapPin size={25} />
                </div>

                <h3>Visit Us</h3>

                <p>
                  Mumbai, Maharashtra, India
                </p>
              </div>

            </div>
          </div>


          {/* ================= SEND MESSAGE ================= */}
          <div className="message-section">

            <div className="message-content">

              <h2>Send Us a Message</h2>

              <p>
                Fill out the form below and our team will get back
                to you as soon as possible.
              </p>


              <form className="contact-form">

                {/* NAME */}
                <div className="form-group">
                  <label>Name</label>

                  <input
                    type="text"
                    placeholder="Enter your name"
                    required
                  />
                </div>


                {/* EMAIL */}
                <div className="form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>


                {/* SUBJECT */}
                <div className="form-group">
                  <label>Subject</label>

                  <input
                    type="text"
                    placeholder="Enter subject"
                    required
                  />
                </div>


                {/* MESSAGE */}
                <div className="form-group">
                  <label>Message</label>

                  <textarea
                    rows="6"
                    placeholder="Write your message..."
                    required
                  ></textarea>
                </div>


                {/* BUTTON */}
                <button
                  type="submit"
                  className="send-btn"
                >
                  <Send size={18} />
                  Send Message
                </button>

              </form>

            </div>

          </div>

        </div>

      </section>
    <Footer/>
    </div>
  );
};

export default Contact;

