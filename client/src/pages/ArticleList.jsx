import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Form,
  InputGroup,
} from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const ArticleList = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  // Use environment variable for API URL
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5173/api";

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Extract search query from URL parameters
    const queryParams = new URLSearchParams(location.search);
    const searchParam = queryParams.get("q");

    if (searchParam) {
      setSearchTerm(searchParam);
    }

    fetchArticles(searchParam);
  }, [location.search]);

  const fetchArticles = async (search = "") => {
    try {
      setLoading(true);
      // Add search parameter to API request if present
      const url = search
        ? `${API_URL}/articles/search/?q=${encodeURIComponent(search)}`
        : `${API_URL}/articles/`;
      const response = await axios.get(url);
      setArticles(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Failed to load articles");
      setLoading(false);
    }
  };

  // Handle local search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/articles?q=${encodeURIComponent(searchTerm)}`);
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US");
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4 text-center">All Articles</h1>

      {/* Local search form */}
      <div className="mb-4">
        <Form onSubmit={handleSearch}>
          <InputGroup>
            <Form.Control
              type="search"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="primary" type="submit">
              Search
            </Button>
          </InputGroup>
        </Form>
      </div>

      {/* Display search results heading if search was performed */}
      {location.search && (
        <div className="mb-3">
          <h5>Search results: "{searchTerm}"</h5>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              navigate("/articles");
              setSearchTerm("");
            }}
          >
            Clear Search
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : articles.length === 0 ? (
        <div className="alert alert-info">
          {location.search
            ? `No articles found for "${searchTerm}"`
            : "No articles to display."}
        </div>
      ) : (
        <Row xs={1} md={2} xl={3} className="g-4">
          {articles.map((article) => (
            <Col key={article.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>{article.title}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {article.author?.username || "Anonymous"} |{" "}
                    {formatDate(article.created_at)}
                  </Card.Subtitle>
                  <Card.Text>
                    {truncateText(article.content.replace(/<[^>]*>/g, ""))}
                  </Card.Text>
                </Card.Body>
                <Card.Footer className="bg-white">
                  <Button
                    as={Link}
                    to={`/articles/${article.id}`}
                    variant="primary"
                  >
                    Read More
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ArticleList;
