import "./App.css"
import { Link } from 'react-router-dom';

function Blog() {

    return (

        <div className="blog-content">
            <div className="blog-top-section">
                <h2 >
                    Blog
                </h2>
                <p>
                    Welcome to my blog! New posts are in the works, and a subscribe button is coming. The posts will be focused on software development, math, and tangential topics.
                </p>
            </div>
            <div className="blog-list">
                <Link className="post-link" to="/blog/why_write_blog_posts">
                    <div className="blog-listing">
                        <h3> Why Write Blog Posts?</h3>
                        <span>October 12<sup>th</sup> 2025 &middot; 8 minute read</span>
                    </div>
                </Link>
            </div>
        </div >
    );
}
export default Blog;