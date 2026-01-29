import "./App.css"
import { Link } from 'react-router-dom';

export function SubscribeComponent() {
  const onSubscribe = () => {

  };

  return (
    <div className="subscribe-container">
      <input
        type="email"
        placeholder="Enter email..."
        className="subscribe-input"
      />
      <button
        onClick={onSubscribe}
        className="subscribe-button"
      >
        Subscribe
      </button>
    </div>
  );
}

function Blog() {

  return (

    <div className="blog-content">
      <div className="blog-top-section">
        <p>
          Welcome to my blog, where I write about interesting technical topics.
        </p>
        <SubscribeComponent />
      </div>
      <div className="blog-list">
        <Link className="post-link" to="/blog/why_write_blog_posts">
          <div className="blog-listing">
            <h3> Why Write Blog Posts?</h3>
            <span>October 12<sup>th</sup> 2025 &middot; 5 minute read</span>
          </div>
        </Link>
      </div>
    </div >
  );
}
export default Blog;
