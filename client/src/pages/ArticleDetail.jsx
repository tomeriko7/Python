import React, { useState, useEffect } from "react";
import { Container, Row, Col, Badge, Spinner, Button } from "react-bootstrap";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = "http://localhost:8000/api";
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/articles/${id}/`);
        setArticle(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("Failed to load article");
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US");
  };

  // Check if current user is author of the article
  const isAuthor = () => {
    if (!isAuthenticated || !user || !article) return false;
    return (
      user.id === article.author?.id ||
      user.user_type === "admin" ||
      user.profile?.user_type === "admin"
    );
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this article?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/articles/${id}/`);
      navigate("/articles");
    } catch (err) {
      console.error("Error deleting article:", err);
      alert("Failed to delete article");
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger">{error}</div>
        <Link to="/articles" className="btn btn-primary">
          Back to Articles
        </Link>
      </Container>
    );
  }

  if (!article) {
    return (
      <Container className="py-5">
        <div className="alert alert-warning">Article not found</div>
        <Link to="/articles" className="btn btn-primary">
          Back to Articles
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Link to="/articles" className="btn btn-outline-primary">
              &larr; Back to Articles
            </Link>
            {isAuthor() && (
              <div>
                <Button
                  as={Link}
                  to={`/articles/${id}/edit`}
                  variant="outline-secondary"
                  className="me-2"
                >
                  Edit
                </Button>
                <Button variant="outline-danger" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            )}
          </div>

          <h1 className="mb-3">{article.title}</h1>

          <div className="mb-4 text-muted">
            <span>By: {article.author?.username || "Anonymous"}</span>
            <span className="mx-2">|</span>
            <span>Published: {formatDate(article.created_at)}</span>

            {article.category && (
              <>
                <span className="mx-2">|</span>
                <span>Category: {article.category.name}</span>
              </>
            )}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="mb-4">
              {article.tags.map((tag) => (
                <Badge bg="secondary" className="me-2" key={tag.id}>
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default ArticleDetail;
