import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "./ToastContext.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./home.css";
import 'react-phone-input-2/lib/style.css';
import PhoneInput from "react-phone-input-2";

function EditProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    phoneNumber: "",
    countryCode: "MM",
    password: ""
  });

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        countryCode: user.countryCode || "MM",
        password: ""
      });
    }
  }, [user]);

  // Load Bootstrap JS for navbar toggler
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // Password validation (only if user entered a new one)
    if (formData.password) {
      if (formData.password.length < 6) {
        addToast("Password must be at least 6 characters long", "warning");
        setIsLoading(false);
        return;
      }

      if (!/[A-Z]/.test(formData.password)) {
        addToast("Password must contain at least one uppercase letter", "warning");
        setIsLoading(false);
        return;
      }

      if (!/[0-9]/.test(formData.password)) {
        addToast("Password must contain at least one number", "warning");
        setIsLoading(false);
        return;
      }
    }

    // Only include password if user entered one
    const payload = { ...formData };
    if (!payload.password) delete payload.password;

    const response = await fetch(`http://localhost:8080/api/auth/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      if (!response.ok) throw new Error(responseText || `Server error: ${response.status}`);
      data = { message: responseText };
    }

    if (response.ok) {
      if (data.success) {
        updateUser(data.user); // Update context
        addToast("Profile updated successfully!", "success");
        navigate("/profile");
      } else {
        addToast(data.message || "Failed to update profile", "error");
      }
    } else {
      addToast(data.message || "Failed to update profile. Please try again.", "error");
    }
  } catch (error) {
    console.error('Update profile error:', error);
    addToast("A network error occurred. Please check your connection and try again.", "error");
  } finally {
    setIsLoading(false);
  }
};


  const handleLogout = () => {
    navigate("/");
  };

  if (!user) {
    return (
      <div className="hp-container">
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hp-container">
      <div className="hp-home d-flex flex-column min-vh-100">
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg hp-navbar-custom" style={{ position: "sticky", top: 0, zIndex: 1030 }}>
          <div className="container">
            <Link className="hp-navbar-brand navbar-brand" to="/home">
              <i className="bi bi-mortarboard-fill"></i> Filter X
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
              style={{ borderColor: "#d4af37" }}
            >
              <i className="bi bi-list" style={{ color: "#d4af37", fontSize: "1.5rem" }}></i>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="hp-navbar-nav navbar-nav ms-auto align-items-lg-center">
                <li className="hp-nav-item nav-item"><Link className="hp-nav-link nav-link" to="/home">Home</Link></li>
                <li className="hp-nav-item nav-item"><Link className="hp-nav-link nav-link" to="/about">About</Link></li>
                <li className="hp-nav-item nav-item"><Link className="hp-nav-link nav-link" to="/profile">Profile</Link></li>
                <li className="hp-nav-item nav-item"><span className="hp-nav-link nav-link text-warning">Edit Profile</span></li>
                <li className="hp-nav-item nav-item"><a className="hp-nav-link nav-link" href="#" onClick={handleLogout}>Logout</a></li>
              </ul>
            </div>
          </div>
        </nav>

        <main className="hp-main container-fluid flex-grow-1 py-3 d-flex flex-column">
          <div className="hp-content-wrapper">
            <header className="hp-page-header">Edit Profile</header>
            <div className="hp-page-tagline">Update your personal information</div>

            {/* Profile Edit Form */}
            <section className="hp-glass-card mb-4">
              <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: "700px" }}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input type="text" className="form-control" id="username" name="username" value={formData.username} onChange={handleInputChange} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input type="email" className="form-control" id="email" name="email" value={formData.email} onChange={handleInputChange} required  disabled/>
                </div>
                <div className="mb-3">
                  <label htmlFor="fullName" className="form-label">Full Name</label>
                  <input type="text" className="form-control" id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} />
                </div>
                <div className="mb-3">
                    <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                    <PhoneInput
                      country={"mm"} // default Myanmar
                      value={formData.phoneNumber}
                      onChange={(value, data) => {
                        setFormData(prev => ({
                          ...prev,
                          phoneNumber: "+" + value,
                          countryCode: data.countryCode.toUpperCase() // store country code for backend
                        }));
                      }}
                      inputStyle={{ width: "100%" }}
                      disabled={isLoading}
                    />
                  </div>

                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Leave blank to keep current password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(prev => !prev)}
                      >
                        <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                      </button>
                    </div>
                  </div>


                <div className="d-flex justify-content-end gap-2">
                  <Link to="/profile" className="hp-btn hp-btn-outline-custom btn">Cancel</Link>
                  <button type="submit" className="hp-btn hp-btn-glass btn" disabled={isLoading}>
                    {isLoading ? <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Saving...</> : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default EditProfile;
