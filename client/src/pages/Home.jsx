import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Badge, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  // Comments states
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSuccess, setCommentSuccess] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  
  // API URL
  // Use environment variable for API URL
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5173/api";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch articles
        const articlesResponse = await axios.get(`${API_URL}/articles/`);
        
        // Get all articles
        const allArticles = articlesResponse.data;
        
        // Sort by created_at for recent articles (newest first)
        const sortedArticles = [...allArticles].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        
        // Get recent articles (newest 6)
        setRecentArticles(sortedArticles.slice(0, 6));
        
        // Get featured articles (random 3 if we have enough)
        if (allArticles.length >= 3) {
          // Shuffle array and take first 3
          const shuffled = [...allArticles].sort(() => 0.5 - Math.random());
          setFeaturedArticles(shuffled.slice(0, 3));
        } else {
          setFeaturedArticles(allArticles);
        }

        // Fetch categories
        const categoriesResponse = await axios.get(`${API_URL}/categories/`);
        setCategories(categoriesResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load content. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handler for opening article modal
  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setShowModal(true);
    fetchComments(article.id);
  };

  // Handler for closing article modal
  const handleCloseModal = () => {
    setShowModal(false);
    setComments([]);
    setNewComment('');
    setEditingCommentId(null);
    setEditCommentText('');
    setCommentSuccess('');
    setCommentError(null);
  };

  // Fetch comments for an article
  const fetchComments = async (articleId) => {
    setCommentsLoading(true);
    try {
      console.log("Fetching comments for article ID:", articleId);
      
      const response = await axios.get(`${API_URL}/comments/`, {
        params: {
          article: articleId
        }
      });
      
      console.log("Comments data from server:", response.data);
      
      // Filter approved comments for this article
      const articleComments = response.data.filter(comment => 
        comment.article === articleId && comment.is_approved === true
      );
      
      console.log("Filtered comments for display:", articleComments);
      
      setComments(articleComments);
      setCommentsLoading(false);
    } catch (err) {
      console.error("Error fetching comments:", err);
      
      // More detailed error info
      if (err.response) {
        console.error("Response data:", err.response.data);
      }
      
      setCommentsLoading(false);
    }
  };

  // Submit a new comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setCommentError("Comment cannot be empty");
      return;
    }
    
    try {
      const payload = {
        content: newComment,
        article: selectedArticle.id,
      };
      
      // Include authorization token in the request if user is authenticated
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Log the payload for debugging
      console.log("Sending comment with payload:", payload);
      
      const response = await axios.post(`${API_URL}/comments/`, payload, config);
      console.log("Server comment response:", response.data);
      
      setCommentSuccess("Comment submitted for approval!");
      setNewComment('');
      
      // Refresh comments to show the new one if it's auto-approved
      fetchComments(selectedArticle.id);
    } catch (err) {
      console.error("Error posting comment:", err);
      
      // More detailed error info for debugging
      if (err.response) {
        console.error("Comment response data:", err.response.data);
        console.error("Comment response status:", err.response.status);
      }
      
      setCommentError("Failed to post comment. Please try again.");
    }
  };

  // Start editing a comment
  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };
  
  // Cancel editing a comment
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };
  
  // Save edited comment
  const handleSaveEdit = async (commentId) => {
    if (!editCommentText.trim()) {
      setCommentError("Comment cannot be empty");
      return;
    }
    
    try {
      const payload = {
        content: editCommentText,
      };
      
      // Log for debugging
      console.log("Updating comment ID:", commentId, "with payload:", payload);
      
      // Include content type header
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.patch(`${API_URL}/comments/${commentId}/`, payload, config);
      console.log("Update response:", response.data);
      
      setCommentSuccess("Comment updated successfully!");
      setEditingCommentId(null);
      setEditCommentText('');
      
      // Refresh comments
      fetchComments(selectedArticle.id);
    } catch (err) {
      console.error("Error updating comment:", err);
      
      // More detailed error info
      if (err.response) {
        console.error("Update response data:", err.response.data);
        console.error("Update response status:", err.response.status);
      }
      
      setCommentError("Failed to update comment. Please try again.");
    }
  };
  
  // Delete a comment
  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        console.log("Deleting comment ID:", commentId);
        
        const response = await axios.delete(`${API_URL}/comments/${commentId}/`);
        console.log("Delete response:", response.data);
        
        setCommentSuccess("Comment deleted successfully!");
        
        // Refresh comments
        fetchComments(selectedArticle.id);
      } catch (err) {
        console.error("Error deleting comment:", err);
        
        // More detailed error info
        if (err.response) {
          console.error("Delete response data:", err.response.data);
          console.error("Delete response status:", err.response.status);
        }
        
        setCommentError("Failed to delete comment. Please try again.");
      }
    }
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Format date helper
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading blog content...</p>
      </div>
    );
  }

  // Show error message if there was an error
  if (error) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section d-flex align-items-center py-5 bg-light">
        <Container>
          <Row className="justify-content-center text-center">
            <Col md={8}>
              <h1 className="display-4 mb-4">Welcome to Our Blog</h1>
              <p className="lead mb-4">Discover fascinating content, interesting articles, and industry news</p>
              <Button variant="primary" size="lg" onClick={() => window.scrollTo(0, document.getElementById('articles-section').offsetTop)}>
                Browse Articles
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Articles Section */}
      <Container className="py-5" id="articles-section">
        <h2 className="text-center mb-5">Featured Articles</h2>
        {featuredArticles.length === 0 ? (
          <div className="text-center">
            <p>No featured articles available at the moment.</p>
          </div>
        ) : (
          <Row>
            {featuredArticles.map(article => (
              <Col key={article.id} md={4} className="mb-4">
                <Card className="custom-card featured-article h-100 shadow-sm">
                  <Card.Body>
                    <Badge bg="primary" className="mb-2">{article.category_name}</Badge>
                    <Card.Title>{article.title}</Card.Title>
                    <Card.Text>{truncateText(article.content, 150)}</Card.Text>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">By {article.author?.username || 'Unknown'}</small>
                      <small className="text-muted">{formatDate(article.created_at)}</small>
                    </div>
                    <div className="mt-3">
                      <Button 
                        variant="outline-primary" 
                        onClick={() => handleArticleClick(article)}
                      >
                        Read More
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Recent Articles Section */}
      <section className="bg-light py-5">
        <Container>
          <h2 className="text-center mb-5">Recent Articles</h2>
          {recentArticles.length === 0 ? (
            <div className="text-center">
              <p>No recent articles available.</p>
            </div>
          ) : (
            <Row>
              {recentArticles.map(article => (
                <Col key={article.id} md={6} lg={4} className="mb-4">
                  <Card className="custom-card h-100 shadow-sm">
                    <Card.Body>
                      <Badge bg="primary" className="mb-2">{article.category_name}</Badge>
                      <Card.Title>{article.title}</Card.Title>
                      <Card.Text>{truncateText(article.content, 100)}</Card.Text>
                      
                      <div className="mt-3 d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {formatDate(article.created_at)}
                        </small>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => handleArticleClick(article)}
                        >
                          Read
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Categories Section */}
      <Container className="py-5">
        <h2 className="text-center mb-4">Browse by Category</h2>
        <Row className="justify-content-center">
          {categories.map(category => (
            <Col key={category.id} xs={6} md={3} className="mb-3 text-center">
              <div 
                className="category-card p-3 rounded shadow-sm bg-white"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  // You can filter articles by category here
                  // For now, just scroll to articles section
                  window.scrollTo(0, document.getElementById('articles-section').offsetTop);
                }}
              >
                <h5>{category.name}</h5>
                <small className="text-muted">{category.description}</small>
              </div>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Newsletter Section */}
      <section className="bg-primary text-white py-5">
        <Container>
          <Row className="justify-content-center text-center">
            <Col md={6}>
              <h3>Subscribe to Our Newsletter</h3>
              <p className="mb-4">Get updates about new articles directly to your inbox</p>
              <div className="input-group mb-3">
                <input type="email" className="form-control" placeholder="Enter your email address" />
                <Button variant="light">Subscribe</Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Article Modal */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal}
        size="lg"
        centered
        className="article-modal"
        dialogClassName="modal-90w"
      >
        {selectedArticle && (
          <>
            <Modal.Header closeButton className="border-bottom article-modal-header">
              <Modal.Title className="fw-bold">{selectedArticle.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="article-modal-body">
              <div className="article-meta mb-4 pb-3 border-bottom">
                <Badge bg="primary" className="me-2 mb-2">{selectedArticle.category_name}</Badge>
                <div className="mt-2">
                  <small className="text-muted me-3">
                    <i className="fas fa-user me-1"></i> 
                    By {selectedArticle.author?.username || 'Unknown'}
                  </small>
                  <small className="text-muted">
                    <i className="far fa-calendar me-1"></i> 
                    {formatDate(selectedArticle.created_at)}
                  </small>
                </div>
              </div>

              <div className="article-content">
                {/* Parse content paragraphs */}
                {selectedArticle.content.split('\n').map((paragraph, index) => (
                  paragraph ? <p key={index} className="mb-4">{paragraph}</p> : <br key={index} />
                ))}
              </div>

              {/* Show tags if available */}
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="article-tags mt-5 pt-3 border-bottom">
                  <h6 className="mb-3">Tags:</h6>
                  <div>
                    {selectedArticle.tags.map((tag, index) => (
                      <Badge 
                        bg="secondary" 
                        className="me-2 mb-2" 
                        key={index}
                      >
                        {typeof tag === 'object' ? tag.tag_name : tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Comments Section */}
              <div className="comments-section mt-4 pt-3 border-top">
                <h4 className="mb-4">Comments</h4>
                
                {commentSuccess && (
                  <Alert variant="success" onClose={() => setCommentSuccess('')} dismissible>
                    {commentSuccess}
                  </Alert>
                )}
                
                {commentError && (
                  <Alert variant="danger" onClose={() => setCommentError(null)} dismissible>
                    {commentError}
                  </Alert>
                )}
                
                {/* New Comment Form */}
                <Form onSubmit={handleCommentSubmit} className="mb-5">
                  <Form.Group className="mb-3">
                    <Form.Control 
                      as="textarea"
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..."
                    />
                    <Form.Text className="text-muted">
                      Comments will be reviewed before appearing on the blog.
                    </Form.Text>
                  </Form.Group>
                  <Button variant="primary" type="submit">
                    Submit Comment
                  </Button>
                </Form>
                
                {/* Comments List */}
                {commentsLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  <div className="comments-list">
                    {comments.map(comment => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header d-flex justify-content-between mb-2">
                          <div>
                            <strong>{comment.user?.username || 'Anonymous'}</strong>
                            <span className="text-muted ms-2 small">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          {/* DEBUG: יצירת לוג כדי לבדוק מה קורה */}
                          {console.log('Comment owner check:', 
                            'Comment user ID:', comment.user?.id, 
                            'Current user ID:', user?.id, 
                            'Is same user:', user?.id === comment.user?.id,
                            'Is admin:', user?.user_type === 'admin' || user?.profile?.user_type === 'admin'
                          )}
                          
                          {/* Show edit/delete buttons only for comment owner or admin */}
                          {user && (
                            // User is the comment owner OR user is admin
                            (user.id === comment.user?.id || user.username === comment.user?.username ||
                             user.user_type === 'admin' || user.profile?.user_type === 'admin')
                          ) && (
                            <div>
                              <Button 
                                variant="primary" 
                                size="sm" 
                                className="me-2" 
                                onClick={() => handleEditComment(comment)}
                              >
                                ✏️ Edit
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm" 
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                🗑️ Delete
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Comment content - show form if editing, otherwise show content */}
                        {editingCommentId === comment.id ? (
                          <div className="edit-form">
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                            />
                            <div className="d-flex justify-content-end mt-2">
                              <Button variant="secondary" size="sm" onClick={handleCancelEdit} className="me-2">
                                Cancel
                              </Button>
                              <Button variant="success" size="sm" onClick={() => handleSaveEdit(comment.id)}>
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="comment-content">
                            {comment.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer className="border-top">
              <Button variant="secondary" onClick={handleCloseModal}>
                Close
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Add custom CSS for the modal */}
      <style jsx="true">{`
        .article-modal .modal-content {
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .article-modal-header {
          background-color: #f8f9fa;
        }
        
        .article-modal-body {
          padding: 1.5rem;
          max-height: 70vh;
          overflow-y: auto;
        }
        
        .article-content {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #343a40;
        }
        
        .modal-90w {
          max-width: 90%;
          margin: 1.75rem auto;
        }
        
        @media (max-width: 768px) {
          .modal-90w {
            max-width: 95%;
          }
        }
        
        .comment-item {
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e9ecef;
        }
        
        .comment-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        
        .comment-author {
          font-weight: 600;
        }
        
        .comment-date {
          color: #6c757d;
          font-size: 0.875rem;
        }
        
        .comment-content {
          margin-bottom: 0.75rem;
        }
        
        .comment-actions {
          text-align: right;
        }
      `}</style>
    </div>
  );
};

export default Home;