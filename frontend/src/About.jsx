// src/components/About.jsx
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const About = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
  useEffect(() => {
    // Load Bootstrap JS for navbar toggler and toast
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up the script when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleJoinClick = () => {
    const toastEl = document.createElement("div");
    toastEl.className =
      "toast align-items-center text-bg-success border-0 position-fixed bottom-0 end-0 m-4";
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ✅ You've successfully joined Filter X. Welcome aboard!
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;
    document.body.appendChild(toastEl);
     // Check if Bootstrap is available before creating toast
    if (window.bootstrap) {
      new window.bootstrap.Toast(toastEl).show();
    }
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#fdfaf6", color: "#333", minHeight: "100vh" }}>
      {/* Inline Styles */}
      <style>{`
        h1,h2,h3 { font-family: "Merriweather", serif; color:#2c3e50; }
        .navbar-custom { background-color: #0b2545; box-shadow: 0 3px 8px rgba(0,0,0,0.2); padding:1rem 0; font-family: 'Merriweather', serif; font-weight:700; }
        .navbar-custom .navbar-brand { color: #d4af37; font-size:1.7rem; display:flex; align-items:center; gap:0.5rem; user-select:none; }
        .navbar-custom .navbar-brand i { font-size:1.8rem; }
        .navbar-custom .nav-link { color:#fdfaf6; font-weight:600; transition: color 0.3s ease; }
        .navbar-custom .nav-link:hover { color:#d4af37; }
        .navbar-custom .navbar-toggler { border: 1px solid #d4af37; }
        .navbar-custom .navbar-toggler:focus { box-shadow: 0 0 0 0.2rem rgba(212, 175, 55, 0.25); }
        .hero { text-align:center; padding:100px 20px 80px; background: linear-gradient(135deg,#fefdc7,#fffde0,#feeec7); border-radius:0 0 50% 50% / 20%; position:relative; overflow:hidden; }
        .hero h1 { font-size:3rem; font-weight:700; color:#0b2545; }
        .hero p { max-width:700px; margin:15px auto; font-size:1.2rem; color:#1a1a1a; }
        .section-title { font-weight:700; margin-bottom:30px; text-align:center; color:#0b2545; }
        .glass-card { background:#fff; border-radius:12px; border:1.5px solid #ccc; box-shadow:0 4px 16px rgba(0,0,0,0.08); padding:24px; margin:1.5rem auto; max-width:720px; color:#1a1a1a; transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
        .glass-card:hover { transform: translateY(-5px); box-shadow:0 8px 24px rgba(0,0,0,0.15); border-color:#d4af37; cursor:default; }
        .btn-accent { background:linear-gradient(135deg,#4f46e5,#6366f1); color:white; padding:12px 28px; border-radius:30px; border:none; font-weight:600; transition: all 0.3s ease; }
        .btn-accent:hover { background:linear-gradient(135deg,#3730a3,#4f46e5); transform: translateY(-3px); box-shadow: 0 8px 15px rgba(79,70,229,0.3); }
        .stats { text-align:center; padding:60px 20px; background:#f9fafb; border-radius:20px; }
        .stat { font-size:2rem; font-weight:700; color:#d4af37; }
        .stat-label { font-size:1rem; color:#555; }
      `}</style>

      {/* Sticky Navbar */}
      <nav className="navbar navbar-expand-lg navbar-custom" 
           style={{ position: 'sticky', top: 0, zIndex: 1030 }}>
        <div className="container">
          <Link className="navbar-brand" to="/home">
            <i className="bi bi-mortarboard-fill"></i>
            Filter X
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
            style={{ borderColor: "#d4af37" }}>
            <i className="bi bi-list" style={{ color: "#d4af37", fontSize: "1.5rem" }}></i>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-lg-center">
              <li className="nav-item"><Link className="nav-link" to="/home">Home</Link></li>
              <li className="nav-item "><Link className="nav-link" to="/about">
                <span className="text-warning">About</span>
              </Link></li>
              <li className="nav-item"><Link className="nav-link" to="/profile">Profile</Link></li>
              <li className="hp-nav-item nav-item">
                                <Link className="hp-nav-link nav-link" to="/notifications">
                                  Notifications
                                </Link>
                              </li>
              <li className="nav-item"><a className="nav-link" href="#" onClick={handleLogout}>Logout</a></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <h1>Filter X</h1>
        <p>
          A platform where learning meets innovation. We are dedicated to making 
          education accessible, engaging, and empowering for students, educators, 
          and lifelong learners worldwide.
        </p>
      </section>

      {/* Mission */}
      <div className="container my-5">
        <h2 className="section-title"><i className="bi bi-bullseye"></i> Our Mission</h2>
        <p className="text-center mx-auto" style={{ maxWidth: "800px" }}>
          Our mission is to bridge the gap between traditional education and digital learning. 
          We aim to foster curiosity, critical thinking, and collaboration through a platform 
          that empowers learners to grow academically and personally.
        </p>
      </div>

      {/* Offerings */}
      <div className="container my-5">
        <h2 className="section-title"><i className="bi bi-lightbulb"></i> What We Offer</h2>
        <div className="row g-4">
          {[
            { icon: "bi-share-fill", title: "Easy Knowledge Sharing", text: "Students and educators can share knowledge seamlessly across the platform." },
            { icon: "bi-funnel-fill", title: "Content Filter", text: "Keep learning safe and focused with advanced content filtering features." },
            { icon: "bi-award-fill", title: "Achieving", text: "Highlighting students who inspire and support their peers every week." }
          ].map((offer, idx) => (
            <div className="col-md-6 col-lg-4" key={idx}>
              <div className="glass-card text-center">
                <i className={`bi ${offer.icon}`} style={{ fontSize: "2.5rem", color: "#d4af37", marginBottom: "15px" }}></i>
                <h5>{offer.title}</h5>
                <p>{offer.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="container my-5">
        <div className="stats row g-4 text-center">
          {[
            { icon: "bi-journal-bookmark", label: "Learning Resources" },
            { icon: "bi-people-fill", label: "Collaborative Community" },
            { icon: "bi-lightbulb-fill", label: "Innovative Ideas" },
            { icon: "bi-rocket-takeoff", label: "Growth & Launch" }
          ].map((stat, idx) => (
            <div className="col-md-3 col-6" key={idx}>
              <div className="stat"><i className={`bi ${stat.icon}`}></i></div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="container my-5 text-center">
        <h2 className="section-title"><i className="bi bi-people"></i> Why Choose Filter X?</h2>
        <p className="mx-auto" style={{ maxWidth: "800px" }}>
          We go beyond traditional learning. Filter X is not just a platform — it's a community. 
          With us, learners experience personalized growth, educators reach more students, and 
          knowledge becomes truly global. 
        </p>
      </div>

      {/* Contact */}
      <div className="container my-5 text-center">
        <h2 className="section-title"><i className="bi bi-envelope-fill"></i> Contact Us</h2>
        <p className="mx-auto" style={{ maxWidth: "800px" }}>
          Have questions or suggestions? Reach out to us and we'll get back to you soon.
        </p>
        <div className="row justify-content-center my-4">
          <div className="col-md-4 mb-3">
            <i className="bi bi-envelope" style={{ fontSize: "1.5rem", color: "#0b2545" }}></i>
            <p className="mt-2">hr.admin@uit.edu.mm</p>
          </div>
          <div className="col-md-4 mb-3">
            <i className="bi bi-telephone" style={{ fontSize: "1.5rem", color: "#0b2545" }}></i>
            <p className="mt-2">+95 1 966 4254</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default About;
