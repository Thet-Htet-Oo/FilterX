import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const checkUser = async () => {
    const auth = localStorage.getItem('auth');
    const userData = localStorage.getItem('user');

    if (auth === 'true' && userData) {
      const parsedUser = JSON.parse(userData);

      try {
        const response = await fetch(`http://localhost:8080/api/auth/users/${parsedUser.id}`);
        if (response.ok) {
          const freshUser = await response.json();
          setUser(freshUser);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } else {
          // User not found in DB → log out
          logout();
        }
      } catch (error) {
        console.error("Error checking user:", error);
        logout();
      }
    }
    setLoading(false);
  };

  checkUser();
}, []);


  const login = (userData) => {
    localStorage.setItem('auth', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
