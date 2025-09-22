import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import "./App.css"

function App() {

  return (
    <main className="main-content">
      <Navigation />
      <div className="routed-content">
        <Outlet />
      </div>
    </main>
  );
}
export default App;

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const activeLocation = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside or on link
  const closeMobileMenu = () => {
    setIsOpen(false);
  };

  // Navigation items
  const navItems = [
    { name: 'About', to: '/' },
    { name: 'Blog', to: '/blog' },
    { name: 'CV', to: '/cv' },
    { name: 'Publications', to: '/publications' },
  ];

  return (
    <nav className={`nav ${isScrolled ? "nav--scrolled" : ""}`}>
      <div className="nav__container">
        <div className="nav__content">

          <div className="nav__brand">
            <Link
              to="/"
              className="nav__logo"
              onClick={closeMobileMenu}
            >
              Nick Tapp-Hughes
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="nav__links--desktop">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className={(activeLocation.pathname == item.to) ? "nav__link active" : "nav__link"}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="nav__menu-button">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="nav__menu-toggle"
              aria-expanded="false"
            >
              {isOpen ? (
                <X className="nav__icon" aria-hidden="true" />
              ) : (
                <Menu className="nav__icon" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`nav__mobile ${isOpen ? "nav__mobile--open" : ""}`}>
          <div className="nav__mobile-links">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className="nav__mobile-link"
                onClick={closeMobileMenu}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};