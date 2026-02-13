import "./contactUs.css";
import React, { useState } from "react";
import goldenImg from "../../assets/img/contact-banner.jpg";
import customerIcon from "../../assets/img/icons/customer-support.png";
import lineImg from "../../assets/img/Line 37.png";
import phoneIcon from "../../assets/img/icons/phone 1.png";
import locationIcon from "../../assets/img/icons/location 1.png";
import emailIcon from "../../assets/img/icons/email 2.png";
import { useNotification } from "../../context/NotificationContext";
import axios from "axios";
import { useDynamicLinks } from "../../hooks/useDynamicLinks";
import {
  getTelURL,
  getMailtoURL,
  getGoogleMapsURL,
} from "../../utils/dynamicLinks";

import PvjMember from "../../components/pvj-member/PvjMember";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ContactUs = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const { showNotification } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const { links } = useDynamicLinks();

  const handleChange = (e) => {
    const { name, value } = e.target;

    // For phone field, only allow numbers
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setForm({ ...form, [name]: numericValue });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/contact-us`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message,
      });
      const data = res.data;
      if (!data.success) {
        showNotification(data.message || "Something went wrong", "error");
      } else {
        showNotification("Thank you for contacting us!", "success");
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      }
    } catch (err) {
      showNotification(
        err.response?.data?.message ||
          err.message ||
          "Network error. Please try again.",
        "error"
      );
    }
    setSubmitting(false);
  };

  return (
    <div className="contactUs-container">
      <div className="contactus-banner">
        <img src={goldenImg} alt="Banner" loading="lazy" decoding="async" />
        <h2>CONTACT US</h2>
      </div>
      <div className="contactus-content">
        {/* Left Section */}
        <div className="contactus-left">
          <div className="contactus-help">
            <div className="contactus-help-icon">
              <img
                src={customerIcon}
                alt="Help"
                loading="lazy"
                decoding="async"
              />
            </div>
            <span className="contactus-help-text">Need Any Help ?</span>
          </div>
          <h3 className="contactus-title">GET IN TOUCH WITH US</h3>
          <p className="contactus-desc">
            Have a question or custom request? Fill out the form below — we're
            here to help. Thank you
          </p>
          <img
            src={lineImg}
            alt="line"
            className="contactus-line1"
            loading="lazy"
            decoding="async"
          />
          <div className="contactus-contact-block">
            <div className="contactus-contact-label">
              <b>Contact-</b>
            </div>
            <div className="contactus-contact-info">
              <div className="contactus-contact-row">
                <img
                  src={locationIcon}
                  alt="Location"
                  className="contactus-contact-icon"
                  loading="lazy"
                />
                <a
                  href={getGoogleMapsURL(links.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {links.address}
                </a>
              </div>
              <div className="contactus-contact-row">
                <img
                  src={phoneIcon}
                  alt="Phone"
                  className="contactus-contact-icon"
                  loading="lazy"
                />
                <a
                  href={getTelURL(links.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "none" }}
                  aria-label={`Call us at ${links.whatsapp}`}
                >
                  {links.whatsapp}
                </a>
              </div>
              <div className="contactus-contact-row">
                <img
                  src={emailIcon}
                  alt="Email"
                  className="contactus-contact-icon"
                  loading="lazy"
                />
                <a
                  href={getMailtoURL(links.email)}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {links.email}
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* Right Section */}
        <div className="contactus-right">
          <form className="contactus-form" onSubmit={handleSubmit}>
            <h3 className="contactus-form-title">Send Us a Message</h3>
            <label htmlFor="contact-name">Name*</label>
            <input
              id="contact-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Name"
              required
              autoComplete="name"
              loading="lazy"
            />
            <label htmlFor="contact-email">Email*</label>
            <input
              id="contact-email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              type="email"
              required
              autoComplete="email"
              loading="lazy"
            />
            <label htmlFor="contact-phone">Phone Number*</label>
            <input
              id="contact-phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              onKeyDown={(e) => {
                // Prevent non-numeric characters
                if (
                  !/[0-9]/.test(e.key) &&
                  ![
                    "Backspace",
                    "Delete",
                    "Tab",
                    "ArrowLeft",
                    "ArrowRight",
                    "Home",
                    "End",
                  ].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
              placeholder="Phone Number"
              required
              autoComplete="tel"
              pattern="[0-9]{10}"
              maxLength={10}
              inputMode="numeric"
            />
            <label htmlFor="contact-subject">Subject*</label>
            <input
              id="contact-subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Enter subject"
              required
              loading="lazy"
            />
            <label htmlFor="contact-message">Message*</label>
            <textarea
              id="contact-message"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Type your message here..."
              required
              rows={5}
              className="contactus-message-textarea"
            />
            <button
              type="submit"
              className="contactus-submit-btn"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>

      {/* map */}
      <div id="map" className="contactus-googlemap">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3559.4137!2d75.6722642!3d26.910673!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db49dcab22e65%3A0xc92c680188db4f38!2sP%20V%20Jewellers%20%26%20Sons!5e0!3m2!1sen!2sin!4v0000000000000!5m2!1sen!2sin"
          width="100%"
          height="400"
          style={{ border: 0, borderRadius: "10px" }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};

export default ContactUs;
