import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/common/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ArticleList from './pages/ArticleList';
import ArticleDetail from './pages/ArticleDetail';

// import ProtectedRoute from './utils/protectedRoute';
import { AuthProvider } from "./contexts/AuthContext";
import CreateArticles from "./pages/Articles/CreateArticles";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/create-article" element={<CreateArticles />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/articles" element={<ArticleList />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />
            {/* 
            <Route
              path="/create-article"
              element={
                <ProtectedRoute>
                </ProtectedRoute>
              }
            /> */}
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
