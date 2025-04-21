import { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    clearError();
    // Clear validation errors for the field being edited
    setValidationErrors({
      ...validationErrors,
      [e.target.name]: ''
    });
    
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    // Username validation
    if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Email validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle server-side validation errors
      if (err.response && err.response.data) {
        const serverErrors = err.response.data;
        const newValidationErrors = {};
        
        // Process server errors into our validation format
        if (serverErrors.username) {
          newValidationErrors.username = serverErrors.username[0];
        }
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
            <h2 className="text-center mb-4">Register</h2>

            {error && (
              <Alert variant="danger" dismissible onClose={clearError}>
                {error}
              </Alert>
            )}
            
            {validationErrors.general && (
              <Alert variant="danger">
                {validationErrors.general}
              </Alert>
            )}

            <Form onSubmit={handleSubmit} noValidate>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  isInvalid={!!validationErrors.username}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.username}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Username must be at least 3 characters and can only contain letters, numbers, and underscores.
                </Form.Text>
              </Form.Group>

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

              <Form.Group className="mb-3">
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
                <Form.Text className="text-muted">
                  Password must be at least 8 characters long and include uppercase, lowercase, and numbers.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  isInvalid={!!validationErrors.confirmPassword}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.confirmPassword}
                </Form.Control.Feedback>
              </Form.Group>

              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 mb-3"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Register'}
              </Button>

              <div className="text-center">
                <small>
                  Already have an account?{' '}
                  <Link to="/login">Login here</Link>
                </small>
              </div>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;