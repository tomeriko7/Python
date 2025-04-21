import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  Card,
} from "react-bootstrap";
const ArticleForm = ({ initialData, onSubmit, categories = [], tags = [] }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    category: initialData?.category || "",
    tags: initialData?.tags || [],
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        content: initialData.content || "",
        category: initialData.category || "",
        tags: initialData.tags || [],
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      setSuccess("Article saved successfully!");
      if (!initialData) {
        // Clear form if it's a new article
        setFormData({
          title: "",
          content: "",
          category: "",
          tags: [],
        });
      }
    } catch (err) {
      setError(err.message || "Failed to save article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={12}>
          <Card>
            <Card.Body>
              <h2 className="text-center">
                {initialData ? "Edit Article" : "Create New Article"}
              </h2>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="title">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </Form.Group>

                <Form.Group controlId="content" className="mt-3">
                  <Form.Label>Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    placeholder="Enter content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    required
                  />
                </Form.Group>

                <Form.Group controlId="category" className="mt-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    as="select"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>

                <Form.Group controlId="tags" className="mt-3">
                  <Form.Label>Tags</Form.Label>
                  <Form.Control
                    as="select"
                    multiple
                    value={formData.tags}
                    onChange={(e) => {
                      const selectedOptions = Array.from(
                        e.target.selectedOptions
                      ).map((option) => option.value);
                      setFormData({ ...formData, tags: selectedOptions });
                    }}
                  >
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.tag_name}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="mt-3"
                  disabled={loading}
                >
                  {loading ? "Saving..." : initialData ? "Update" : "Submit"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ArticleForm;
