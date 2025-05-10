import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // jwtDecode to decode JWT tokens and access payload data

// Importing page components
import SignupPage from './components/Signup';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  // State to track authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Store the current user’s ID
  const [userId, setUserId] = useState(null);
  
  // Store the current user’s name
  const [userName, setUserName] = useState("");

  // Check JWT on first load
  useEffect(() => {
    // Retrive token and username from local storage
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const now = Date.now();
        
        // decoded.exp is the expiry time in seconds - *1000 to convert to ms
        if (decoded.exp * 1000 > now) {
          // Check if token is still valid 
          setIsAuthenticated(true);
          setUserId(decoded.userId || storedUser); // Set userId from token or fallback to stored user
          setUserName(storedUser); // Set user name from localStorage
        } else {
          localStorage.clear();  // If not token expired then clear localStorage
        }
      } catch (err) {
        // Error message for invalid token and clearing it from local storage
        console.error("Invalid token:", err);
        localStorage.clear();
      }
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Root path for signup page */}
        <Route path="/" element={<SignupPage />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              // If already logged in, send them to dashboard page
              <Navigate to="/dashboard" replace /> // Also used replace so that user cannot go back to previou page using back button
            ) : (
              // If not, render the login page to update auth state
              <Login
                setIsAuthenticated={setIsAuthenticated}
                setUserId={setUserId}
                setUserName={setUserName}
              />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              // If authenticated, show the dashboard  page and pass user info
              <Dashboard userId={userId} userName={userName} />
            ) : (
              // If not, redirect them to login page
              <Navigate to="/login" replace />
            )
          }
        />
        {/* Catches unknown routes and sends the user either to the dashboard (if they’re logged in) or the login page */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}
