import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaGithub, FaTwitter, FaLinkedin, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  const navigation = {
    main: [
      { name: 'Home', path: '/' },
      { name: 'Articles', path: '/articles' },
      { name: 'About', path: '/about' },
      { name: 'Contact', path: '/contact' },
    ],
    social: [
      { name: 'GitHub', icon: FaGithub, url: 'https://github.com' },
      { name: 'Twitter', icon: FaTwitter, url: 'https://twitter.com' },
      { name: 'LinkedIn', icon: FaLinkedin, url: 'https://linkedin.com' },
      { name: 'Email', icon: FaEnvelope, url: 'mailto:info@example.com' },
    ]
  };

  return (
    <footer className="footer-wrapper">
      <Container>
        <Row className="py-5">
          <Col lg={4} md={6} className="mb-4 mb-lg-0">
            <h5 className="text-white mb-4">About Our Blog</h5>
            <p className="text-muted">
              Discover amazing articles and stories from our community of writers.
              Join us in exploring new ideas and perspectives.
            </p>
            <div className="social-links">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  className="me-3 text-muted"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <item.icon size={20} />
                </a>
              ))}
            </div>
          </Col>
          
          <Col lg={4} md={6} className="mb-4 mb-lg-0">
            <h5 className="text-white mb-4">Quick Links</h5>
            <ul className="list-unstyled">
              {navigation.main.map((item) => (
                <li key={item.name} className="mb-2">
                  <Link to={item.path} className="text-muted text-decoration-none">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          <Col lg={4} md={12}>
            <h5 className="text-white mb-4">Newsletter</h5>
            <p className="text-muted">
              Subscribe to our newsletter for the latest updates and articles.
            </p>
            <div className="d-flex">
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
              />
              <button className="btn btn-primary ms-2">
                Subscribe
              </button>
            </div>
          </Col>
        </Row>

        <hr className="border-secondary" />
        
        <div className="py-3 text-center text-muted">
          <small>
            © {new Date().getFullYear()} Blog App. All rights reserved.
          </small>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;