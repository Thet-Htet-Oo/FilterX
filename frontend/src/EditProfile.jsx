import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "./ToastContext.jsx";
import { DEFAULT_AVATAR, getAvatarUrl } from "./avatarUtils.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./home.css";
import Navbar from "./Navbar.jsx";
import 'react-phone-input-2/lib/style.css';
import PhoneInput from "react-phone-input-2";

function EditProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [removeAvatarFlag, setRemoveAvatarFlag] = useState(false);
  const fileInputRef = useRef(null);

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
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
      setRemoveAvatarFlag(false);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      addToast("Only JPG, PNG, WEBP, and GIF images are allowed.", "warning");
      e.target.value = "";
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxSize) {
      addToast("Profile picture must be smaller than 2 MB.", "warning");
      e.target.value = "";
      return;
    }

    setSelectedAvatarFile(file);
    setRemoveAvatarFlag(false);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatarFile(null);
    setRemoveAvatarFlag(true);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

      // 1. Update text details
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

      if (!response.ok || !data.success) {
        addToast(data.message || "Failed to update profile", "error");
        setIsLoading(false);
        return;
      }

      let updatedUserData = data.user;

      // 2. Handle Avatar Upload or Remove if changed
      if (selectedAvatarFile) {
        const avatarFormData = new FormData();
        avatarFormData.append("file", selectedAvatarFile);

        const avatarRes = await fetch(`http://localhost:8080/api/users/${user.id}/avatar`, {
          method: "POST",
          body: avatarFormData
        });

        if (avatarRes.ok) {
          const avatarData = await avatarRes.json();
          if (avatarData.user) {
            updatedUserData = { ...updatedUserData, ...avatarData.user };
          } else {
            updatedUserData = {
              ...updatedUserData,
              hasProfilePicture: true,
              profilePictureUrl: avatarData.profilePictureUrl,
              updatedAt: new Date().toISOString()
            };
          }
        } else {
          const errData = await avatarRes.json().catch(() => ({}));
          addToast(errData.message || "Profile text saved, but avatar upload failed.", "warning");
        }
      } else if (removeAvatarFlag) {
        const delRes = await fetch(`http://localhost:8080/api/users/${user.id}/avatar`, {
          method: "DELETE"
        });

        if (delRes.ok) {
          const delData = await delRes.json();
          if (delData.user) {
            updatedUserData = { ...updatedUserData, ...delData.user };
          } else {
            updatedUserData = {
              ...updatedUserData,
              hasProfilePicture: false,
              profilePictureUrl: null,
              updatedAt: new Date().toISOString()
            };
          }
        }
      }

      // 3. Sync AuthContext & LocalStorage
      updateUser(updatedUserData);
      addToast("Profile updated successfully!", "success");
      navigate("/profile");
    } catch (error) {
      console.error('Update profile error:', error);
      addToast("A network error occurred. Please check your connection and try again.", "error");
    } finally {
      setIsLoading(false);
    }
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
        <Navbar />

        <main className="hp-main container-fluid flex-grow-1 py-3 d-flex flex-column">
          <div className="hp-content-wrapper">
            <header className="hp-page-header">Edit Profile</header>
            <div className="hp-page-tagline">Update your personal information</div>

            {/* Profile Edit Form */}
            <section className="hp-glass-card mb-4">
              <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: "700px" }}>
                {/* Profile Picture Section */}
                <div className="d-flex flex-column align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
                  <div className="position-relative d-inline-block">
                    <img
                      src={
                        avatarPreview
                          ? avatarPreview
                          : (removeAvatarFlag ? DEFAULT_AVATAR : getAvatarUrl(user))
                      }
                      alt="Profile Avatar"
                      className="hp-profile-img shadow"
                      style={{ width: "105px", height: "105px", objectFit: "cover" }}
                      onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-warning position-absolute bottom-0 end-0 rounded-circle p-1 shadow"
                      style={{ width: "32px", height: "32px", lineHeight: "1" }}
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload new photo"
                    >
                      <i className="bi bi-camera-fill text-dark" style={{ fontSize: "0.85rem" }}></i>
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="d-none"
                  />

                  <div className="mt-2 text-muted" style={{ fontSize: "0.8rem" }}>
                    Allowed: JPG, PNG, WEBP, GIF (Max 2 MB)
                  </div>

                  <div className="mt-2 d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-warning btn-sm"
                      style={{ borderRadius: "9999px" }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <i className="bi bi-upload me-1"></i> Choose Photo
                    </button>
                    {((user?.hasProfilePicture && !removeAvatarFlag) || avatarPreview) && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        style={{ borderRadius: "9999px" }}
                        onClick={handleRemoveAvatar}
                        disabled={isLoading}
                      >
                        <i className="bi bi-trash me-1"></i> Remove Photo
                      </button>
                    )}
                  </div>
                </div>

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
