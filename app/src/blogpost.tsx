import "./App.css"
import 'katex/dist/katex.min.css'
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { SubscribeComponent } from "./blog";

const postIndexes = import.meta.glob('./blog-posts/*/index.ts', { import: 'default' });

type HtmlEntry = { kind: 'html'; content: string };
type ComponentEntry = { kind: 'component'; Component: () => JSX.Element };
type Entry = HtmlEntry | ComponentEntry;

function BlogPost() {
  const { title } = useParams<{ title: string }>();
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!title) return;

    const path = `./blog-posts/${title}/index.ts`;
    const loader = postIndexes[path];

    if (loader) {
      loader().then((mod) => {
        const { entries } = mod as { entries: Entry[] };
        setEntries(entries);
      });
    } else {
      setEntries([{ kind: 'html', content: `<p>Post "${title}" not found.</p>` }]);
    }
  }, [title]);

  return (
    <div>
      <div className="blog-post">
        {entries.map((entry, i) =>
          entry.kind === 'html'
            ? <div key={i} dangerouslySetInnerHTML={{ __html: entry.content }} />
            : <entry.Component key={i} />
        )}
      </div>
      <SubscribeComponent />
    </div>
  );
}

export default BlogPost;
