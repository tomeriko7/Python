import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

// Types for context values
const defaultContextValue = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateProfile: async () => {},
  clearError: () => {},
};

const AuthContext = createContext(defaultContextValue);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use environment variable for API URL
  // Use environment variable for API URL
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5173/api";

  // Cookie configuration
  const COOKIE_OPTIONS = {
    expires: 7,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  };

  // Set default headers for axios
  axios.defaults.headers.post["Content-Type"] = "application/json";

  // Handle axios errors
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // If the error is due to an expired token (401) and we haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token
          const newToken = await refreshAccessToken();
          
          // Update the request header with the new token
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          // Retry the original request
          return axios(originalRequest);
        } catch (refreshError) {
          // If refresh fails, logout the user
          handleLogout();
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );

  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  const handleLogout = () => {
    Cookies.remove("token", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });
    setUser(null);
    setAuthHeader(null);
    setError(null);
  };

  const clearError = () => setError(null);

  const handleAuthResponse = async (data) => {
    const { token, refresh, user: userData } = data;

    if (!token || !userData) {
      throw new Error("Invalid response from server");
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (!decoded.exp || decoded.exp < currentTime) {
        throw new Error("Token is expired or invalid");
      }

      // Store both access and refresh tokens
      Cookies.set("token", token, COOKIE_OPTIONS);
      if (refresh) {
        Cookies.set("refreshToken", refresh, COOKIE_OPTIONS);
      }
      
      setUser(userData);
      setAuthHeader(token);
    } catch (error) {
      handleLogout();
      throw new Error("Invalid token received");
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = Cookies.get("refreshToken");
      if (!refreshToken) {
        console.warn("No refresh token in cookies, checking localStorage as fallback");
        // Check localStorage as fallback
        const localRefreshToken = localStorage.getItem("refreshToken");
        if (localRefreshToken) {
          // If found in localStorage, move it to cookie for consistency
          Cookies.set("refreshToken", localRefreshToken, COOKIE_OPTIONS);
          console.log("Migrated refresh token from localStorage to cookies");
        } else {
          throw new Error("No refresh token available in any storage");
        }
      }
      
      // Updated to try multiple possible refresh token endpoints
      let data;
      try {
        // Try first endpoint
        const response = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh: refreshToken });
        data = response.data;
      } catch (err) {
        console.log("First refresh endpoint failed, trying alternative");
        // Try alternative endpoint
        const response = await axios.post(`${API_URL}/token/refresh/`, { refresh: refreshToken });
        data = response.data;
      }
      
      if (!data || !data.access) throw new Error("Failed to refresh token - no access token in response");
      
      // Update access token
      Cookies.set("token", data.access, COOKIE_OPTIONS);
      setAuthHeader(data.access);
      
      // Log success for debugging
      console.log("Token successfully refreshed");
      return data.access;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Don't immediately logout on first failure 
      if (error.message === "No refresh token available in any storage") {
        handleLogout();
      }
      throw error;
    }
  };

  // עדכון לפונקציית אתחול האימות
  const initializeAuth = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        setLoading(false);
        return;
      }

        try {
          // Check if token is valid by decoding it
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          if (!decoded.exp || decoded.exp < currentTime) {
            throw new Error("Token expired");
          }

          // שימוש בפרטים בסיסיים מהטוקן
          const userId = decoded.user_id || decoded.id;

          // הגדרת כותרת האימות לשימוש בקריאה לשרת
          setAuthHeader(token);

          // שליחת בקשה לשרת להבאת פרטי המשתמש המלאים
          try {
            console.log("Fetching user profile for ID:", userId);
            const response = await axios.get(`${API_URL}/profiles/${userId}/`);
            console.log("User profile response:", response.data);

            const userData = {
              id: userId,
              username:
                response.data.user?.username || decoded.username || "User",
              email: response.data.user?.email || decoded.email || "",
              ...decoded,
              profile: response.data,
            };

            // עדכון פרטי המשתמש במערכת
            console.log("Complete user data:", userData);
            setUser(userData);
          } catch (profileError) {
            console.warn(
              "Could not fetch user profile, using token data only:",
              profileError
            );

            // במקרה של שגיאה בקריאה לשרת, נשתמש רק בנתונים מהטוקן
            const userData = {
              id: userId,
              username: decoded.username || "User",
              email: decoded.email || "",
              ...decoded,
            };
            setUser(userData);
          }
        } catch (error) {
          console.error("Token validation error:", error);
          handleLogout();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        handleLogout();
      } finally {
        setLoading(false);
      }
  };

  // שימוש בהוק useEffect להפעלת פונקציית האתחול בטעינת הקומפוננטה
  useEffect(() => {
    initializeAuth();
    
    return () => {
      setAuthHeader(null);
    };
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      console.log("Attempting login with:", { email });
      
      // Try both endpoints - first the auth/login then fallback to login if needed
      let data;
      
      try {
        // Try the first endpoint
        const response1 = await axios.post(
          `${API_URL}/auth/login/`,
          { email, password },
          { headers: { "Content-Type": "application/json" } }
        );
        data = response1.data;
        console.log("Login successful with first endpoint");
      } catch (firstError) {
        console.log("First login endpoint failed, trying alternative endpoint");
        // Try the alternative endpoint
        const response2 = await axios.post(
          `${API_URL}/login/`,
          { email, password },
          { headers: { "Content-Type": "application/json" } }
        );
        data = response2.data;
        console.log("Login successful with alternative endpoint");
      }

      console.log("Login response:", data);
      await handleAuthResponse(data);
      return data;
    } catch (error) {
      console.error("Login error details:", error.response?.data);

      // Extract error message from response
      let message = "Login failed";

      if (error.response?.data) {
        const errorData = error.response.data;

        if (typeof errorData === "object") {
          // Handle field-specific errors
          const errorMessages = [];

          Object.keys(errorData).forEach((key) => {
            const fieldErrors = errorData[key];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach((err) => {
                errorMessages.push(
                  `${key === "non_field_errors" ? "" : key + ": "}${err}`
                );
              });
            } else if (typeof fieldErrors === "string") {
              errorMessages.push(`${key}: ${fieldErrors}`);
            }
          });

          if (errorMessages.length > 0) {
            message = errorMessages.join("; ");
          }
        } else if (typeof errorData === "string") {
          message = errorData;
        }
      }

      setError(message);
      throw new Error(message);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      // Try both endpoints - first the auth/register then fallback to register if needed
      let response;
      
      try {
        response = await axios.post(`${API_URL}/auth/register/`, userData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (firstError) {
        console.log("First register attempt failed, trying alternative endpoint");
        response = await axios.post(`${API_URL}/register/`, userData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      
      await handleAuthResponse(response.data);
      return response.data;
    } catch (error) {
      console.error("Registration error details:", error.response?.data);
      console.error("Full error object:", error);

      // Handle complex error format from Django Rest Framework
      let errorMessage = "Registration failed";

      if (error.response?.data) {
        // Try to extract error messages from the response
        const errorData = error.response.data;

        if (typeof errorData === "object") {
          // If there are specific fields with errors
          const errorMessages = [];

          Object.keys(errorData).forEach((key) => {
            const fieldErrors = errorData[key];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach((err) => {
                if (typeof err === "object" && err.message) {
                  errorMessages.push(`${key}: ${err.message}`);
                } else {
                  errorMessages.push(`${key}: ${err}`);
                }
              });
            } else if (typeof fieldErrors === "string") {
              errorMessages.push(`${key}: ${fieldErrors}`);
            } else if (typeof fieldErrors === "object") {
              errorMessages.push(`${key}: ${JSON.stringify(fieldErrors)}`);
            }
          });

          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join("; ");
          }
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateProfile = async (userData) => {
    try {
      setError(null);
      const { data } = await axios.patch(`${API_URL}/auth/profile/`, userData);
      setUser((prev) => ({ ...prev, ...data }));
      return data;
    } catch (error) {
      console.error("Profile update error details:", error.response?.data);

      // טיפול בשגיאות בדומה לפונקציית register
      let errorMessage = "Profile update failed";

      if (error.response?.data) {
        const errorData = error.response.data;

        if (typeof errorData === "object") {
          const errorMessages = [];

          Object.keys(errorData).forEach((key) => {
            const fieldErrors = errorData[key];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach((err) => {
                if (typeof err === "object" && err.message) {
                  errorMessages.push(`${key}: ${err.message}`);
                } else {
                  errorMessages.push(`${key}: ${err}`);
                }
              });
            } else if (typeof fieldErrors === "string") {
              errorMessages.push(`${key}: ${fieldErrors}`);
            } else if (typeof fieldErrors === "object") {
              errorMessages.push(`${key}: ${JSON.stringify(fieldErrors)}`);
            }
          });

          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join("; ");
          }
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout: handleLogout,
    updateProfile,
    clearError,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
