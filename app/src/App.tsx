import { useState, useEffect } from 'react';
import { Menu, X} from 'lucide-react';
import "./App.css"
import githubUrl from './icons/github.svg';
import linkedinUrl from './icons/linkedin.svg';
import emailUrl from './icons/email.svg';

function App() {

  return (
    <main className="main-content">

      <Navigation/>

      <div className="two-pane">
      <aside className="pane left">
        <img 
          src="/front_portrait_downscaled.jpg" 
          alt="Headshot picture of Nick Tapp-Hughes" 
          className="left-portrait"
          />
          <Contact/>
      </aside>
      <main className="pane right">
        <h1>
        Nick Tapp-Hughes
        </h1>
        <p>
          This is the scrollable content area. Add more text here to see the
          scrolling effect.
        </p>
        {[...Array(20)].map((_, i) => (
          <p key={i}>Paragraph {i + 1}: Lorem ipsum dolor sit amet...Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.</p>
        ))}
      </main>
    </div>
    </main>
  );
}
export default App;

const Contact = () => {
  return(
    <section id="contact" className="contact-section">

      <h2 className="contact-section__header">Contact</h2>

      <div className="contact-section__item">
        <img src={emailUrl} alt="Email Icon" className="contact-icon" />
        <span className="email-text">
          nicholas(dot)tapphughes(at)gmail(dot)com
        </span>
      </div>

      <div className="contact-section__item">
        <img src={githubUrl} alt="GitHub" className="contact-icon" />
        <a
          href="https://github.com/tapphughesn"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-section__link"
        >
          <span>GitHub</span>
        </a>
        <span className = "separator">|</span>
        <img src={linkedinUrl} alt="LinkedIn Icon" className="contact-icon" />
        <a
          href="https://www.linkedin.com/in/nicholas-tapp-hughes-b75641142/"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-section__link"
        >
          <span>LinkedIn</span>
        </a>
      </div>

    </section>
  );
}

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    { name: 'About', href: '#about' },
    { name: 'CV', href: '#cv' },
    { name: 'Blog', href: '#blog' },
    { name: 'Contact', href: '#contact' }
  ];

  return (
    <nav className={`nav ${isScrolled ? "nav--scrolled" : ""}`}>
      <div className="nav__container">
        <div className="nav__content">

          {/* Desktop Navigation */}
          <div className="nav__links--desktop">
            {navItems.map((item) => (
              <a key={item.name} href={item.href} className="nav__link">
                {item.name}
              </a>
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
              <a
                key={item.name}
                href={item.href}
                className="nav__mobile-link"
                onClick={closeMobileMenu}
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};