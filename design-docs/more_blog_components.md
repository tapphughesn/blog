## Design Doc: Adding Components to Publishing Automation

### Current State

One of the cool things about my blog is that I can edit the blog posts directly
in Google Docs, and then (with one command) automatically pull down those blog
posts and process them into HTML / web friendly forms. Currently, I have a
python script `blog/publishing_automation/google_doc_to_html.py` which does
this. That script can translate a Google Doc to an html file by doing:

1. Uses my Google developer credentials and the document ID to download the
   google doc as a .docx file
2. Loads the .docx into memory and deletes it from disk
3. Uses the `mammoth` python package to convert the .docx to HTML
4. Processes the HTML with the `beautifulsoup` python package: 
    * Cleans up empty links (`<a>` tags), which exist for some reason
    * Finds all the footnotes, which are indicated with the "[number]" syntax in
      the Google Doc, moves the footnotes to the bottom
    * Extracts the title of the blog post
5. Saves the html in `blog/app/src/blog_posts/` with the filename using the
extracted title

How are the HTML blog posts actually handled by the web server? There is a
dynamic route in `blog/app/src/main.tsx` which captures the title of any blog
post URL query like `nicholastapphughes.com/blog/<title>` and passes the title
to the BlogPost component in `blog/app/src/blogpost.tsx`, which looks for the
HTML file at `/blog/app/src/blog_posts/title.html` and renders it if it exists.
So, simply moving the HTML file into place (done automatically by the script)
and deploying the server is enough to "publish" the post.

### New Functionality

For my next blog post about Buffon's needle problem and for subsequent blog
posts after that, I want to introduce more special components that are parsed
out and handled by the python script. Specifically, I want to introduce
interactive components, math components, quotes, and images, in addition to the
special handling that is done for footnotes and the title. Math, quotes, and
images can be baked into the HTML file, but the interactive components
cannot--these will be custom written in React. This means that the system I
have for pointing the `BlogPost` component at a HTML file will no longer work.
Instead, each blog post will be a sequence of HTML files separated by
interactive components. Instead of a single file there will be a directory:

```
title
- index.ts
- 01.html
- 02.tsx
- 03.html
- 04.tsx
- ...
```

Where `title` is the directory name and `index.ts` is a index file structured like:

```typescript
import html01 from './01.html?raw';
import comp02 from './02';
import html03 from './03.html?raw';
import comp04 from './04';

export const entries = [
  { kind: 'html',      content: html01 },
  { kind: 'component', Component: comp02 },
  { kind: 'html',      content: html03 },
  { kind: 'component', Component: comp04 },
] as const;

```

### Known Problems Not Addressed Here

One known problem is the dependency on Google Docs -- they may change their
file format and one day I'll pull down a docx file that is in a different
format than I expect.

Another problem is the amount of manual effort that goes in to each
publication--I have to write the interactive components by hand and write the
TeX for the math. That's somewhat unavoidable though, and as long as I keep the
low-effort case of writing a text-only blog post and publishing it easily, then
this is fine.

### New Google Doc Parsing

Currently, I have these rules for the google doc:

1. Title is a "Heading 1"
2. Subtitles are "Heading 2"
3. Paragraphs are "Normal Text", which gets translated to `<p>`
4. Footnotes are inserted in paragraphs with the syntax [\<number\>]

I want to add the following rules:

5. Images are placed into the document full size, where a normal paragraph
   would go
6. TeX components are normal paragraphs with the syntax [TeX: \<descriptor
   text\>]
7. Interactive components are normal paragraphs with the syntax [Component:
   \<descriptor text\>]
8. Quotes are normal paragraphs with the syntax [Quote: \<quote text\>]

These new components will be parsed out by the python script and translated.
However, since the interactive components can't be translated into pure HTML,
instead, a sequence of HTML documents will be created corresponding to
sequences of the google doc in between interactive components. And instead of
creating a single document, it will populate the directory. 

#### Handling Images

TODO: does this work?

I will put images full-size in the google doc. The python script will handle
embedding the images in the HTML. CSS will be added so that images are
stretched/positioned as needed.

#### Handling Math

Math components will be rendered in `<tex>` HTML components. The descriptor
text will be used like this:

```html
<!--
<descriptor text>
-->
<tex>TODO</tex>
```
This means that each math component needs to manually coded in TeX by hand, in
place of the 'TODO' default.

KaTeX will be added as a dependency, and vite will build the static math
components. The needed styling and fonts will be packaged with the bundle and
dynamically loaded.

#### Handling Interactive Components

Interactive components will be built in standard React, starting with a
template like this:

```tsx
import { useState } from 'react';

/*
TODO: implement this
<descriptor text>
*/
export default function comp02() {
  const [number, setNumber] = useState<number | null>(null);

  return (
    <div>
      <div>
        TODO: replace this example component
      </div>
      <button onClick={() => setNumber(Math.floor(Math.random() * 100))}>
        Generate Random Number
      </button>
      {number !== null && <p>{number}</p>}
    </div>
  );
}
```

Then a human has to manually clear the TODOs and implement these components in
React.

#### Handling Quotes:

Quotes will be rendered in HTML as a `<p>` with a special classname like
"blogQuote" for styling.

#### Quality of Life Improvements

The python script will be renamed something like
`compile_blog_post_from_google_doc.py`. It will use the `uv` package manager.
It will run as a module and take arguments, including the google document ID. 

The python script will also show a warning if the blog post already exists, and
will not overwrite existing blog posts. This prevents overwriting any manual
work that was done.

I will create an example blog post that shows off all the features of the
compiler.

I'll consider refactoring the Python script into multiple files if needed.

#### Manual Publishing Workflow

Any unfinished components that need manual completion are flagged with a TODO,
as specified above. Running a command like `rg "TODO" .` will list all the
TODOs. Then, the author can go and implement all of those.

### New Blog Rendering System

The python script has to take `<p>` elements that contain text like [<component
name>: <content string>] and translate them. This is not too hard, we just need
to add some steps to the algorithm:

1. Uses my Google developer credentials and the document ID to download the
   google doc as a .docx file
2. Loads the .docx into memory and deletes it from disk
3. Uses the `mammoth` python package to convert the .docx to HTML
4. **NEW:** Make sure that images are rendered correctly (TODO: try this and then update doc)
5. Processes the HTML with the `beautifulsoup` python package: 
    * Cleans up empty links (`<a>` tags), which exist for some reason
    * Extracts the title of the blog post
    * **NEW:** Loops over all `<p>` elements to see if they are the form of a
      math, quote, or interactive component, then replaces them with the
      appropriate HTML
        * If interactive component, render a placeholder <interactive/> in the
          HTML, and create a local `<num>.tsx` file
    * Finds all the footnotes, which are indicated with the "[number]" syntax
      (within a <p> element) in the Google Doc, moves the footnotes to the
      bottom with appropriate reference linking
    * **NEW:** Break up the HTML document into multiple documents, split by the
      <interactive/> components.
6. **NEW:** Build the `index.ts` file based on the documents in memory.
7. **NEW:** Save `index.ts` and all the HTML and TSX documents in
   `blog/app/src/blog_posts/title`.
