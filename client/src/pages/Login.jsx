import { useState } from "react";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    clearError();
    // Clear validation errors for the field being edited
    setValidationErrors({
      ...validationErrors,
      [e.target.name]: "",
    });

    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 1) {
      errors.password = "Password must be at least 8 characters long";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);

      // Handle server-side validation errors
      if (err.response && err.response.data) {
        const serverErrors = err.response.data;
        const newValidationErrors = {};

        // Process server errors into our validation format
        if (serverErrors.email) {
          newValidationErrors.email = serverErrors.email[0];
        }
        if (serverErrors.password) {
          newValidationErrors.password = serverErrors.password[0];
        }
        if (serverErrors.non_field_errors) {
          newValidationErrors.general = serverErrors.non_field_errors[0];
        }

        setValidationErrors(newValidationErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center my-5">
        <Col md={6} lg={5}>
          <div className="bg-white p-4 p-md-5 rounded shadow">
            <h2 className="text-center mb-4">Login</h2>

            {error && (
              <Alert variant="danger" dismissible onClose={clearError}>
                {error}
              </Alert>
            )}

            {validationErrors.general && (
              <Alert variant="danger">{validationErrors.general}</Alert>
            )}

            <Form onSubmit={handleSubmit} noValidate>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  isInvalid={!!validationErrors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.email}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  isInvalid={!!validationErrors.password}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.password}
                </Form.Control.Feedback>
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 mb-3"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <div className="text-center">
                <small>
                  Don't have an account?{" "}
                  <Link to="/register">Register here</Link>
                </small>
              </div>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
