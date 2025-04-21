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
  const API_URL = "http://localhost:8000/api";

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
    (error) => {
      if (error.response?.status === 401) {
        handleLogout();
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
    setUser(null);
    setAuthHeader(null);
    setError(null);
  };

  const clearError = () => setError(null);

  const handleAuthResponse = async (data) => {
    const { token, user: userData } = data;

    if (!token || !userData) {
      throw new Error("Invalid response from server");
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (!decoded.exp || decoded.exp < currentTime) {
        throw new Error("Token is expired or invalid");
      }

      Cookies.set("token", token, COOKIE_OPTIONS);
      setUser(userData);
      setAuthHeader(token);
    } catch (error) {
      handleLogout();
      throw new Error("Invalid token received");
    }
  };

  useEffect(() => {
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

            // שילוב הנתונים מהטוקן והפרופיל
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

    initializeAuth();

    return () => {
      setAuthHeader(null);
    };
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      console.log("Attempting login with:", { email });

      // Ensure proper headers are set
      const { data } = await axios.post(
        `${API_URL}/auth/login/`,
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

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
      const { data } = await axios.post(`${API_URL}/auth/register/`, userData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      await handleAuthResponse(data);
      return data;
    } catch (error) {
      console.error("Registration error details:", error.response?.data);
      console.error("Full error object:", error);

      // Django Rest Framework שולח שגיאות בפורמט מורכב
      let errorMessage = "Registration failed";

      if (error.response?.data) {
        // נסה לחלץ את הודעות השגיאה מהתגובה
        const errorData = error.response.data;

        if (typeof errorData === "object") {
          // אם יש שדות ספציפיים עם שגיאות
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
