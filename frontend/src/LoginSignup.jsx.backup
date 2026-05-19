import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./LoginSignup.css"; 

export default function LoginSignup() {
  const [active, setActive] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    phoneNumber: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      alert("Please enter both username and password");
      return;
    }
    
    // Password validation
    if (loginPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Attempting login with:", { username: loginUsername, password: loginPassword });
      
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Login response:", data);
      
      if (data.success) {
        login(data.user); // Use AuthContext login
        navigate("/home"); // Navigate immediately
      } else {
        alert("Login failed: " + data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert("Login failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupData.username || !signupData.email || !signupData.password || !signupData.fullName) {
      alert("Please fill in all required fields");
      return;
    }
    
    // Password validation
    if (signupData.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }
    
    if (!/[A-Z]/.test(signupData.password)) {
      alert("Password must contain at least one uppercase letter");
      return;
    }
    
    if (!/[0-9]/.test(signupData.password)) {
      alert("Password must contain at least one number");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Attempting signup with:", signupData);
      
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Signup response:", data);
      
      if (data.success) {
        // Auto-login after successful registration
        login(data.user); // Use AuthContext login
        navigate("/home"); // Navigate immediately
      } else {
        alert("Registration failed: " + data.message);
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert("Registration failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupInputChange = (field, value) => {
    setSignupData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="ls-container">
      <div className={`ls-main-container ${active ? "ls-active" : ""}`}>
        {/* Sign Up Form */}
        <div className="ls-form-container ls-sign-up">
          <form onSubmit={handleSignup}>
            <h1>Create Account</h1>
            <span>or use your email for registration</span>
            <input 
              type="text" 
              placeholder="Full Name *" 
              value={signupData.fullName}
              onChange={(e) => handleSignupInputChange('fullName', e.target.value)}
              required
              disabled={isLoading}
            />
            <input 
              type="text" 
              placeholder="Username *" 
              value={signupData.username}
              onChange={(e) => handleSignupInputChange('username', e.target.value)}
              required
              disabled={isLoading}
            />
            <input 
              type="email" 
              placeholder="Email *" 
              value={signupData.email}
              onChange={(e) => handleSignupInputChange('email', e.target.value)}
              required
              disabled={isLoading}
            />
            <input 
              type="password" 
              placeholder="Password *" 
              value={signupData.password}
              onChange={(e) => handleSignupInputChange('password', e.target.value)}
              required
              disabled={isLoading}
            />
            <input 
              type="tel" 
              placeholder="Phone Number (Optional)" 
              value={signupData.phoneNumber}
              onChange={(e) => handleSignupInputChange('phoneNumber', e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className="ls-form-container ls-sign-in">
          <form onSubmit={handleLogin}>
            <h1>Log In</h1>
            <span>or use your username and password</span>
            <input 
              type="text" 
              placeholder="Username *" 
              value={loginUsername} 
              onChange={(e) => setLoginUsername(e.target.value)} 
              required
              disabled={isLoading}
            />
            <input 
              type="password" 
              placeholder="Password *" 
              value={loginPassword} 
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <a href="#" className="forget">Forget Your Password?</a>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Logging In..." : "Log In"}
            </button>
          </form>
        </div>

        {/* Toggle Container */}
        <div className="ls-toggle-container">
          <div className="ls-toggle">
            <div className="ls-toggle-panel ls-toggle-left">
              <h1>Welcome Back!</h1>
              <p>Log in to share your thoughts and connect with fellow writers.</p>
              <button
                type="button"
                className="ls-hidden"
                onClick={() => setActive(false)}
                disabled={isLoading}
              >
                Log In
              </button>
            </div>
            <div className="ls-toggle-panel ls-toggle-right">
              <h1>Hello, Friend!</h1>
              <p>
                Create an account to start sharing your texts and explore others'
                work.
              </p>
              <button
                type="button"
                className="ls-hidden"
                onClick={() => setActive(true)}
                disabled={isLoading}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
