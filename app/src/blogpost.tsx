import "./App.css"
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const blogFiles = import.meta.glob('./blog_posts/*.html', { as: 'raw' });

function BlogPost() {
    const { title } = useParams<{ title: string }>();
    const [content, setContent] = useState<string>("");

    useEffect(() => {
        if (!title) return;

        const path = `./blog_posts/${title}.html`;
        const loader = blogFiles[path];

        if (loader) {
            loader().then((html: string) => setContent(html));
        } else {
            setContent(`<p>Post ${title} not found.</p>`);
        }
    }, [title]);

    return <div className="blog-post" dangerouslySetInnerHTML={{ __html: content }} />;
}

export default BlogPost;
