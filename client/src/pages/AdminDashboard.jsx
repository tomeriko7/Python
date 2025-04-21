import React from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Table,
  Tabs,
  Tab,
  Modal,
  Badge,
  Dropdown,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import ArticleForm from "../components/blog/ArticleForm";

const AdminDashboard = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [editCategory, setEditCategory] = useState({
    id: "",
    name: "",
    description: "",
    slug: "",
  });
  const [showAddModal, setShowAddModal] = useState(false);

  // API URL
  const API_URL = "http://localhost:8000/api";

  // Get auth context
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const isAdmin =
      user?.user_type === "admin" ||
      user?.profile?.user_type === "admin" ||
      user?.username === "admin" ||
      user?.username === "oshri000";

    if (!isAdmin) {
      console.log("User is not admin, redirecting to home page");
      navigate("/");
      return;
    }

    fetchCategories();
    fetchTags();
    fetchArticles();
    fetchComments();
    fetchUsers();
  }, [isAuthenticated, user]);

  //Tags
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState({ tag_name: "" });
  const [editTag, setEditTag] = useState({ id: "", tag_name: "", slug: "" });
  const [showTagModal, setShowTagModal] = useState(false);

  //Articles
  const [articles, setArticles] = useState([]);
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    category: "",
    tags: [],
  });
  const [editArticle, setEditArticle] = useState({
    id: "",
    title: "",
    content: "",
    category: "",
    tags: [],
  });
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [isEditingArticle, setIsEditingArticle] = useState(false);

  //Comments
  const [comments, setComments] = useState([]);
  const [filteredComments, setFilteredComments] = useState([]);
  const [commentFilter, setCommentFilter] = useState("all"); // 'all', 'pending', 'approved'
  const [commentLoading, setCommentLoading] = useState(false);

  //Categories
  const fetchCategories = async () => {
    try {
      const token = Cookies.get("token");
      const response = await axios.get(`${API_URL}/categories/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleAddCategory = async () => {
    try {
      const token = Cookies.get("token");
      const response = await axios.post(`${API_URL}/categories/`, newCategory, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCategories([...categories, response.data]);
      setNewCategory({ name: "", description: "" });
      handleCloseAddCategory();
    } catch (error) {
      console.error("Error adding category:", error);
      alert(
        `Error adding category: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleEditCategory = async (category) => {
    if (typeof category === "object") {
      // When clicking the Edit button, set the editCategory state and show modal
      setEditCategory(category);
      setShowAddModal(true);
    } else {
      // When submitting the edit form
      try {
        const token = Cookies.get("token");
        // Use the slug for the API request as configured in the Django backend
        const response = await axios.put(
          `${API_URL}/categories/${editCategory.slug}/`,
          editCategory,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setCategories(
          categories.map((cat) =>
            cat.id === response.data.id ? response.data : cat
          )
        );
        setEditCategory({ id: "", name: "", description: "", slug: "" });
        handleCloseAddCategory();
      } catch (error) {
        console.error("Error updating category:", error);
        alert(
          `Error updating category: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  const handleDeleteCategory = async (id, slug) => {
    try {
      const token = Cookies.get("token");
      // Use the slug for the API request as configured in the Django backend
      await axios.delete(`${API_URL}/categories/${slug}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCategories(categories.filter((category) => category.id !== id));
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(
        `Error deleting category: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  //Tags
  const fetchTags = async () => {
    try {
      const token = Cookies.get("token");
      const response = await axios.get(`${API_URL}/tags/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTags(response.data);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const handleAddTag = async () => {
    try {
      const token = Cookies.get("token");
      const response = await axios.post(`${API_URL}/tags/`, newTag, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTags([...tags, response.data]);
      setNewTag({ tag_name: "" });
      handleCloseTagModal();
    } catch (error) {
      console.error("Error adding tag:", error);
      alert(
        `Error adding tag: ${error.response?.data?.message || error.message}`
      );
    }
  };

  const handleEditTag = async (tag) => {
    if (typeof tag === "object") {
      // When clicking the Edit button, set the editTag state and show modal
      setEditTag(tag);
      setShowTagModal(true);
    } else {
      // When submitting the edit form
      try {
        const token = Cookies.get("token");
        // Use the slug for the API request as configured in the Django backend
        const response = await axios.put(
          `${API_URL}/tags/${editTag.slug}/`,
          editTag,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setTags(
          tags.map((t) => (t.id === response.data.id ? response.data : t))
        );
        setEditTag({ id: "", tag_name: "", slug: "" });
        handleCloseTagModal();
      } catch (error) {
        console.error("Error updating tag:", error);
        alert(
          `Error updating tag: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  const handleDeleteTag = async (id, slug) => {
    try {
      const token = Cookies.get("token");
      // Use the slug for the API request as configured in the Django backend
      await axios.delete(`${API_URL}/tags/${slug}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTags(tags.filter((tag) => tag.id !== id));
    } catch (error) {
      console.error("Error deleting tag:", error);
      alert(
        `Error deleting tag: ${error.response?.data?.message || error.message}`
      );
    }
  };

  //Articles
  const fetchArticles = async () => {
    try {
      const token = Cookies.get("token");
      const response = await axios.get(`${API_URL}/articles/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setArticles(response.data);
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  };

  const handleAddArticle = async (formData) => {
    try {
      const token = Cookies.get("token");
      const response = await axios.post(`${API_URL}/articles/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setArticles([...articles, response.data]);
      handleCloseArticleModal();
      return response.data;
    } catch (error) {
      console.error("Error adding article:", error);
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  const handleEditArticle = async (article) => {
    if (typeof article === "object" && article.id) {
      // When clicking the Edit button, set the editArticle state and show modal
      setEditArticle(article);
      setIsEditingArticle(true);
      setShowArticleModal(true);
    } else {
      // When submitting the edit form
      try {
        const token = Cookies.get("token");
        const response = await axios.put(
          `${API_URL}/articles/${editArticle.id}/`,
          editArticle,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setArticles(
          articles.map((art) =>
            art.id === response.data.id ? response.data : art
          )
        );
        setEditArticle({
          id: "",
          title: "",
          content: "",
          category: "",
          tags: [],
        });
        handleCloseArticleModal();
      } catch (error) {
        console.error("Error updating article:", error);
        alert(
          `Error updating article: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  const handleDeleteArticle = async (id) => {
    try {
      const token = Cookies.get("token");
      await axios.delete(`${API_URL}/articles/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setArticles(articles.filter((article) => article.id !== id));
    } catch (error) {
      console.error("Error deleting article:", error);
      alert(
        `Error deleting article: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  //Comments
  const fetchComments = async () => {
    setCommentLoading(true);
    try {
      const token = Cookies.get("token");
      const response = await axios.get(`${API_URL}/comments/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setComments(response.data);
      filterComments(response.data, commentFilter);
      setCommentLoading(false);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setCommentLoading(false);
    }
  };

  const filterComments = (commentsData, filter) => {
    switch (filter) {
      case "pending":
        setFilteredComments(
          commentsData.filter((comment) => !comment.is_approved)
        );
        break;
      case "approved":
        setFilteredComments(
          commentsData.filter((comment) => comment.is_approved)
        );
        break;
      default:
        setFilteredComments(commentsData);
    }
  };

  const handleApproveComment = async (id) => {
    try {
      const token = Cookies.get("token");
      await axios.post(
        `${API_URL}/comments/${id}/approve/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      const updatedComments = comments.map((comment) =>
        comment.id === id ? { ...comment, is_approved: true } : comment
      );
      setComments(updatedComments);
      filterComments(updatedComments, commentFilter);
    } catch (error) {
      console.error("Error approving comment:", error);
      alert(
        `Error approving comment: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleRejectComment = async (id) => {
    try {
      const token = Cookies.get("token");
      await axios.post(
        `${API_URL}/comments/${id}/reject/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      const updatedComments = comments.map((comment) =>
        comment.id === id ? { ...comment, is_approved: false } : comment
      );
      setComments(updatedComments);
      filterComments(updatedComments, commentFilter);
    } catch (error) {
      console.error("Error rejecting comment:", error);
      alert(
        `Error rejecting comment: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleDeleteComment = async (id) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const token = Cookies.get("token");
      await axios.delete(`${API_URL}/comments/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state
      const updatedComments = comments.filter((comment) => comment.id !== id);
      setComments(updatedComments);
      filterComments(updatedComments, commentFilter);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert(
        `Error deleting comment: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  //Modal Handlers
  const handleShowAddCategory = () => {
    setNewCategory({ name: "", description: "" });
    setEditCategory({ id: "", name: "", description: "", slug: "" });
    setShowAddModal(true);
  };
  const handleCloseAddCategory = () => setShowAddModal(false);
  const handleShowTagModal = () => setShowTagModal(true);
  const handleCloseTagModal = () => setShowTagModal(false);
  const handleShowArticleModal = () => {
    setIsEditingArticle(false);
    setEditArticle({
      id: "",
      title: "",
      content: "",
      category: "",
      tags: [],
    });
    setShowArticleModal(true);
  };
  const handleCloseArticleModal = () => {
    setShowArticleModal(false);
    setIsEditingArticle(false);
    setEditArticle({
      id: "",
      title: "",
      content: "",
      category: "",
      tags: [],
    });
  };

  //Users
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState("all"); // 'all', 'admin', 'author', 'regular'

  const fetchUsers = async () => {
    try {
      const token = Cookies.get("token");
      const response = await axios.get(`${API_URL}/profiles/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Users data:", response.data);
      setUsers(response.data);
      setUserLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUserLoading(false);
    }
  };

  const filterUsersByRole = (role) => {
    setUserRoleFilter(role);
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      setUserLoading(true);
      const token = Cookies.get("token");

      // Log parameters for debugging
      console.log(`Updating user ${userId} to role: ${newRole}`);

      // Use the API for changing user type with the correct path
      const response = await axios.patch(
        `${API_URL}/profiles/${userId}/change-user-type/`,
        { user_type: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Update role response:", response.data);

      // Update the local list with the updated user
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, user_type: newRole } : user
        )
      );

      // Display success message
      alert(`User successfully updated to role: ${newRole}`);

      // Refresh the user list from the server
      await fetchUsers();

      setUserLoading(false);
    } catch (error) {
      console.error("Error updating user role:", error);
      alert(
        `Error updating user role: ${
          error.response?.data?.error || error.message
        }`
      );
      setUserLoading(false);
    }
  };

  //Fetch data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
      fetchTags();
      fetchArticles();
      fetchComments();
      fetchUsers();
    }
  }, [isAuthenticated]);

  return (
    <Container>
      <h1>Admin Dashboard</h1>

      <Tabs defaultActiveKey="categories" className="mb-4">
        <Tab eventKey="categories" title="Categories">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Category Management</h5>
              </div>
              <div>
                <Button variant="primary" onClick={handleShowAddCategory}>
                  <i className="fas fa-plus me-1"></i> Add Category
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {categories.length === 0 ? (
                <div className="text-center py-4">
                  <p>No categories found.</p>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td>{category.id}</td>
                        <td>{category.name}</td>
                        <td>{category.description}</td>
                        <td>
                          <Button
                            variant="warning"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEditCategory(category)}
                          >
                            <i className="fas fa-edit me-1"></i> Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleDeleteCategory(category.id, category.slug)
                            }
                          >
                            <i className="fas fa-trash me-1"></i> Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {/* Add Category Modal */}
              <Modal show={showAddModal} onHide={handleCloseAddCategory}>
                <Modal.Header closeButton>
                  <Modal.Title>
                    {editCategory.id ? "Edit Category" : "Add Category"}
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form.Group controlId="formBasicName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter category name"
                      value={
                        editCategory.id ? editCategory.name : newCategory.name
                      }
                      onChange={(e) =>
                        editCategory.id
                          ? setEditCategory({
                              ...editCategory,
                              name: e.target.value,
                            })
                          : setNewCategory({
                              ...newCategory,
                              name: e.target.value,
                            })
                      }
                    />
                  </Form.Group>

                  <Form.Group controlId="formBasicDescription" className="mt-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter category description"
                      value={
                        editCategory.id
                          ? editCategory.description
                          : newCategory.description
                      }
                      onChange={(e) =>
                        editCategory.id
                          ? setEditCategory({
                              ...editCategory,
                              description: e.target.value,
                            })
                          : setNewCategory({
                              ...newCategory,
                              description: e.target.value,
                            })
                      }
                    />
                  </Form.Group>

                  <Form.Group controlId="formBasicSlug" className="mt-3">
                    <Form.Label>Slug</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Slug will be generated automatically"
                      value={editCategory.id ? editCategory.slug : ""}
                      disabled
                    />
                    <Form.Text className="text-muted">
                      Slug is automatically generated from the name
                    </Form.Text>
                  </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseAddCategory}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    onClick={
                      editCategory.id
                        ? () => handleEditCategory()
                        : handleAddCategory
                    }
                  >
                    {editCategory.id ? "Update" : "Save Changes"}
                  </Button>
                </Modal.Footer>
              </Modal>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="tags" title="Tags">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Tag Management</h5>
              </div>
              <div>
                <Button variant="primary" onClick={handleShowTagModal}>
                  <i className="fas fa-plus me-1"></i> Add Tag
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {tags.length === 0 ? (
                <div className="text-center py-4">
                  <p>No tags found.</p>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tags.map((tag) => (
                      <tr key={tag.id}>
                        <td>{tag.id}</td>
                        <td>{tag.tag_name}</td>
                        <td>
                          <Button
                            variant="warning"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEditTag(tag)}
                          >
                            <i className="fas fa-edit me-1"></i> Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteTag(tag.id, tag.slug)}
                          >
                            <i className="fas fa-trash me-1"></i> Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {/* Add Tag Modal */}
              <Modal show={showTagModal} onHide={handleCloseTagModal}>
                <Modal.Header closeButton>
                  <Modal.Title>
                    {editTag.id ? "Edit Tag" : "Add Tag"}
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form.Group controlId="formBasicName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter tag name"
                      value={editTag.id ? editTag.tag_name : newTag.tag_name}
                      onChange={(e) =>
                        editTag.id
                          ? setEditTag({ ...editTag, tag_name: e.target.value })
                          : setNewTag({ ...newTag, tag_name: e.target.value })
                      }
                    />
                  </Form.Group>
                  {editTag.id && (
                    <Form.Group controlId="formBasicSlug" className="mt-3">
                      <Form.Label>Slug</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Slug will be generated automatically"
                        value={editTag.slug || ""}
                        disabled
                      />
                      <Form.Text className="text-muted">
                        Slug is automatically generated from the name
                      </Form.Text>
                    </Form.Group>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseTagModal}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    onClick={editTag.id ? () => handleEditTag() : handleAddTag}
                  >
                    {editTag.id ? "Update" : "Save Changes"}
                  </Button>
                </Modal.Footer>
              </Modal>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="articles" title="Articles">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Article Management</h5>
              </div>
              <div>
                <Button variant="primary" onClick={handleShowArticleModal}>
                  <i className="fas fa-plus me-1"></i> Add Article
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {articles.length === 0 ? (
                <div className="text-center py-4">
                  <p>No articles found.</p>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Tags</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article) => (
                      <tr key={article.id}>
                        <td>{article.id}</td>
                        <td>{article.title}</td>
                        <td>
                          <Badge bg="primary">
                            {article.category_name || article.category}
                          </Badge>
                        </td>
                        <td>
                          {article.tags && article.tags.length > 0 ? (
                            article.tags.map((tag, index) => (
                              <Badge
                                bg="secondary"
                                className="me-1"
                                key={index}
                              >
                                {typeof tag === "object" ? tag.tag_name : tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted">No tags</span>
                          )}
                        </td>
                        <td>
                          {new Date(article.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <Button
                            variant="info"
                            size="sm"
                            className="me-2"
                            onClick={() =>
                              window.open(`/articles/${article.id}`, "_blank")
                            }
                          >
                            <i className="fas fa-eye me-1"></i> View
                          </Button>
                          <Button
                            variant="warning"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEditArticle(article)}
                          >
                            <i className="fas fa-edit me-1"></i> Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteArticle(article.id)}
                          >
                            <i className="fas fa-trash me-1"></i> Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {/* Add Article Modal */}
              <Modal
                show={showArticleModal}
                onHide={handleCloseArticleModal}
                size="lg"
                centered
              >
                <Modal.Header closeButton>
                  <Modal.Title>
                    {isEditingArticle ? "Edit Article" : "Add Article"}
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <ArticleForm
                    initialData={isEditingArticle ? editArticle : null}
                    categories={categories}
                    tags={tags}
                    onSubmit={
                      isEditingArticle ? handleEditArticle : handleAddArticle
                    }
                  />
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseArticleModal}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="comments" title="Comments">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Comment Management</h5>
              </div>
              <div>
                <Button
                  variant={
                    commentFilter === "all" ? "primary" : "outline-primary"
                  }
                  className="me-2"
                  onClick={() => {
                    setCommentFilter("all");
                    filterComments(comments, "all");
                  }}
                >
                  All Comments
                </Button>
                <Button
                  variant={
                    commentFilter === "pending" ? "warning" : "outline-warning"
                  }
                  className="me-2"
                  onClick={() => {
                    setCommentFilter("pending");
                    filterComments(comments, "pending");
                  }}
                >
                  Pending
                </Button>
                <Button
                  variant={
                    commentFilter === "approved" ? "success" : "outline-success"
                  }
                  onClick={() => {
                    setCommentFilter("approved");
                    filterComments(comments, "approved");
                  }}
                >
                  Approved
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {commentLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading comments...</p>
                </div>
              ) : filteredComments.length === 0 ? (
                <div className="text-center py-4">
                  <p>No comments found.</p>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Article</th>
                      <th>User</th>
                      <th>Content</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComments.map((comment) => (
                      <tr key={comment.id}>
                        <td>{comment.id}</td>
                        <td>
                          {comment.article && (
                            <a
                              href={`/articles/${comment.article}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Article
                            </a>
                          )}
                        </td>
                        <td>
                          {comment.user ? comment.user.username : "Anonymous"}
                        </td>
                        <td>
                          {comment.parent && (
                            <Badge bg="info" className="me-2">
                              Reply
                            </Badge>
                          )}
                          <div style={{ maxHeight: "100px", overflow: "auto" }}>
                            {comment.content}
                          </div>
                        </td>
                        <td>{new Date(comment.created_at).toLocaleString()}</td>
                        <td>
                          {comment.is_approved ? (
                            <Badge bg="success">Approved</Badge>
                          ) : (
                            <Badge bg="warning" text="dark">
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td>
                          {comment.is_approved ? (
                            <Button
                              variant="warning"
                              size="sm"
                              className="me-2"
                              onClick={() => handleRejectComment(comment.id)}
                            >
                              Reject
                            </Button>
                          ) : (
                            <Button
                              variant="success"
                              size="sm"
                              className="me-2"
                              onClick={() => handleApproveComment(comment.id)}
                            >
                              Approve
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="users" title="Users">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">User Management</h5>
              </div>
              <div>
                <Button
                  variant={
                    userRoleFilter === "all" ? "primary" : "outline-primary"
                  }
                  className="me-2"
                  onClick={() => filterUsersByRole("all")}
                >
                  All Users
                </Button>
                <Button
                  variant={
                    userRoleFilter === "admin" ? "danger" : "outline-danger"
                  }
                  className="me-2"
                  onClick={() => filterUsersByRole("admin")}
                >
                  Admins
                </Button>
                <Button
                  variant={
                    userRoleFilter === "author" ? "success" : "outline-success"
                  }
                  className="me-2"
                  onClick={() => filterUsersByRole("author")}
                >
                  Authors
                </Button>
                <Button
                  variant={
                    userRoleFilter === "regular" ? "info" : "outline-info"
                  }
                  onClick={() => filterUsersByRole("regular")}
                >
                  Regular Users
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {userLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading users...</p>
                </div>
              ) : users.filter(
                  (user) =>
                    userRoleFilter === "all" ||
                    user.user_type === userRoleFilter
                ).length === 0 ? (
                <div className="text-center py-4">
                  <p>No users found.</p>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(
                        (user) =>
                          userRoleFilter === "all" ||
                          user.user_type === userRoleFilter
                      )
                      .map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.user?.username}</td>
                          <td>{user.user?.email}</td>
                          <td>
                            {user.user_type === "admin" && (
                              <Badge bg="danger">Admin</Badge>
                            )}
                            {user.user_type === "author" && (
                              <Badge bg="success">Author</Badge>
                            )}
                            {user.user_type === "regular" && (
                              <Badge bg="info">Regular User</Badge>
                            )}
                          </td>
                          <td>
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <Dropdown>
                              <Dropdown.Toggle
                                variant="primary"
                                size="sm"
                                id={`dropdown-user-${user.id}`}
                              >
                                Change Role
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item
                                  onClick={() =>
                                    handleUpdateUserRole(user.id, "admin")
                                  }
                                  disabled={user.user_type === "admin"}
                                >
                                  Make Admin
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() =>
                                    handleUpdateUserRole(user.id, "author")
                                  }
                                  disabled={user.user_type === "author"}
                                >
                                  Make Author
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() =>
                                    handleUpdateUserRole(user.id, "regular")
                                  }
                                  disabled={user.user_type === "regular"}
                                >
                                  Make Regular User
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminDashboard;
