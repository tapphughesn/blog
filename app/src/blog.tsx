import "./App.css"
import { Link } from 'react-router-dom';
import { useState } from 'react';
import outputs from "../amplify_outputs.json";

export function SubscribeComponent() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageStatus, setMessageStatus] = useState<'neutral' | 'success' | 'error'>('neutral');

  const onSubscribe = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Invalid email format");
      setMessageStatus('error');
      return;
    }

    setMessage("Sent subscription request...");
    setMessageStatus('neutral');

    const SUBSCRIBER_FUNCTION_URL = outputs.custom.subscriberFunctionUrl;

    try {
      const response = await fetch(SUBSCRIBER_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", email }),
      });
      const data = await response.json();
      setMessage(data.message);
      setMessageStatus('success');
    } catch (error) {
      setMessage("Error: could not reach server. Try again later.");
      setMessageStatus('error');
    }
  };

  return (
    <div className="subscribe-wrapper">
      <div className="subscribe-container">
        <input
          type="email"
          placeholder="Enter email..."
          className="subscribe-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={onSubscribe}
          className="subscribe-button"
        >
          Subscribe
        </button>
      </div>
      <div className={`subscribe-message ${messageStatus === 'error' ? 'subscribe-message-error' : messageStatus === 'success' ? 'subscribe-message-success' : ''}`}>
        {message}
      </div>
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
