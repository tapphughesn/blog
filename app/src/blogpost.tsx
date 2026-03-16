import "./App.css"
import 'katex/dist/katex.min.css'
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { SubscribeComponent } from "./blog";

const postIndexes = import.meta.glob('./blog-posts/*/index.ts');

type HtmlEntry = { kind: 'html'; content: string };
type ComponentEntry = { kind: 'component'; Component: () => JSX.Element };
type Entry = HtmlEntry | ComponentEntry;

type Metadata = { date: string; readingTimeMinutes: number };

function BlogPost() {
  const { title } = useParams<{ title: string }>();
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!title) return;

    const path = `./blog-posts/${title}/index.ts`;
    const loader = postIndexes[path];

    if (loader) {
      loader().then((mod: any) => {
        const { entries, metadata } = mod as { entries: Entry[]; metadata: Metadata };
        const span = `<span>${metadata.date} · ${metadata.readingTimeMinutes} minute read</span>`;
        const patched = entries.map((entry, i) =>
          i === 0 && entry.kind === 'html'
            ? { ...entry, content: entry.content.replace('</h1>', `</h1>${span}`) }
            : entry
        );
        setEntries(patched);
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
