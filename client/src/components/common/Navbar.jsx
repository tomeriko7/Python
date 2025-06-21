import {
  Navbar,
  Nav,
  Container,
  Button,
  Form,
  InputGroup,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import React, { useEffect, useState } from "react";

const Navigation = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Detailed log of user permissions
  useEffect(() => {
    if (user) {
      console.log("=== USER PERMISSIONS DEBUG ===");
      console.log("User object:", user);
      console.log("User type from user object:", user.user_type);
      console.log("User type from profile:", user.profile?.user_type);
      console.log(
        "Username check:",
        user.username === "admin" || user.username === "oshri000"
      );
      console.log(
        "Is admin check:",
        user.user_type === "admin" ||
          user.profile?.user_type === "admin" ||
          user.username === "admin" ||
          user.username === "oshri000"
      );
      console.log("=============================");
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/articles?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <Navbar bg="white" expand="lg" className="navbar" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img
            src="logo.svg"
            alt="Blog Logo"
            height="30"
            className="d-inline-block align-top me-2"
          />
          Alpaca Blog App
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/articles">
              Articles
            </Nav.Link>
            {isAuthenticated && (
              <>
                {/* Article creation - access for admins and authors and specific users */}
                {user &&
                  (user.user_type === "admin" ||
                    user.profile?.user_type === "admin" ||
                    user.user_type === "author" ||
                    user.profile?.user_type === "author" ||
                    user.username === "admin" ||
                    user.username === "oshri000") && (
                    <Nav.Link as={Link} to="/create-article">
                      Create Article
                    </Nav.Link>
                  )}

                {/* Admin dashboard - access for admins only and specific users */}
                {user &&
                  (user.user_type === "admin" ||
                    user.profile?.user_type === "admin" ||
                    user.username === "admin" ||
                    user.username === "oshri000") && (
                    <Nav.Link as={Link} to="/admin-dashboard">
                      Admin Dashboard
                    </Nav.Link>
                  )}
              </>
            )}
          </Nav>

          {/* Search Form */}
          <Form className="d-flex mx-auto" onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="search"
                placeholder="Search articles..."
                className="me-2"
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline-primary" type="submit">
                Search
              </Button>
            </InputGroup>
          </Form>

          <Nav>
            {isAuthenticated ? (
              <>
                {/* Debug information */}
                {console.log("Navbar User Data:", user)}

                <span className="navbar-text me-3 fw-bold text-primary">
                  Welcome, {user?.username || "User"}
                </span>
                <Button variant="outline-danger" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  <Button variant="primary">Sign Up</Button>
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
