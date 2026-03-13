## Design Doc: Adding Components to Publishing Automation

### Current State

One of the cool things about my blog is that I can edit the blog posts directly
in Google Docs, and then automatically pull down those blog posts and process
them into HTML / web friendly forms. Currently, I have a python script
`blog/publishing_automation/google_doc_to_html.py` which does this. That script
can translate a Google Doc to an html file by doing:

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
dynamic route in `blog/app/src/main.tsx` which captures the title of any URL
query like `nicholastapphughes.com/blog/<title>` and passes the title to the
BlogPost component in `blog/app/src/blogpost.tsx`, which renders the HTML for
that title, if that HTML file exists. So, simply moving the HTML file into
place and deploying the server is enough to "publish" the post.

### New Functionality

For my next blog post about Buffon's needle problem and for subsequent blog
posts after that, I want to introduce more special components that are parsed
out and handled by the python script. Specifically, I want to introduce
interactive components, math components and images, in addition to the special
handling that is done for footnotes and the title. Math and images can be baked
into the HTML file, but the interactive components cannot--these will be custom
written in React. This means that the system I have for pointing the `BlogPost`
component at a HTML file will no longer work. Instead, each blog post will be a
sequence of HTML files separated by interactive components.

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

#### Handling Images

Does putting the image in Google Docs as-is work?

#### Handling Math

Using KaTeX vite build pipeline and pulling fonts from CDN

#### Handling Interactive Components

#### Quality of Life Improvements

Better way to get the document ID in google docs (maybe as argument to python script)

More reusable and idomatic code in the python script

uv python package manager

Not recompiling a blog post that already exists (but providing a way to do so, e.g. delete the files for that blog post)

Creating an example post that shows off all the features

### Manual Publishing Workflow

How do unfinished TeX and interactive components get flagged for manual completion?

How does the descriptor text from the gdoc get used in the manual process?

### New Blog Rendering System

Taking a list of html and interactive components and rendering them in sequence to produce the whole post

Handling footnotes with disjointed components
