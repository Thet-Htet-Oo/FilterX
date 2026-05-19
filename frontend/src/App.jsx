import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginSignup from "./LoginSignup.jsx";
import Home from "./home.jsx";
import About from "./About.jsx";
import Profile from "./Profile.jsx";
import EditProfile from './EditProfile';
import Notification from "./Notification.jsx";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import { ToastProvider } from "./ToastContext.jsx";

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Default route - redirect to home if already authenticated */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <LoginSignup />} />

      {/* Home - all posts */}
      <Route path="/home" element={isAuthenticated ? <Home user={user} /> : <Navigate to="/" />} />

      {/* Profile - user's own posts */}
      <Route path="/profile" element={isAuthenticated ? <Profile user={user} /> : <Navigate to="/" />} />

      <Route path="/about" element={<About />} />

      <Route path="/edit-profile" element={<EditProfile />} />

      <Route path="/notifications" element={isAuthenticated ? <Notification user={user} /> : <Navigate to="/" />} />

      {/* Redirect any unknown routes */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}