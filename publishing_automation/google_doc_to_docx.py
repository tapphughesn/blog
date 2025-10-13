import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import io
from googleapiclient.http import MediaIoBaseDownload

import mammoth
from bs4 import BeautifulSoup
import re

"""Download a Google Doc from Drive and export it as a .docx file."""

# If modifying scopes, delete the file token.json
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

creds = None
# Load saved credentials, if available
if os.path.exists("secrets/token.json"):
    creds = Credentials.from_authorized_user_file(
        "secrets/token.json", SCOPES)
# If no (valid) credentials, prompt login
if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        flow = InstalledAppFlow.from_client_secrets_file(
            "secrets/credentials.json", SCOPES
        )
        creds = flow.run_local_server(port=0)
    # Save the credentials for next time
    with open("secrets/token.json", "w") as token:
        token.write(creds.to_json())

# Build the Drive API service
service = build("drive", "v3", credentials=creds)

# Replace this with your Google Doc ID
FILE_ID = "1fDS6ecMjqw4c3oaFs8LRUp8t7ZQdJ3A3XU-VEydkx3w"

# Export the file as .docx
request = service.files().export_media(
    fileId=FILE_ID, mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)
fh = io.FileIO("output.docx", "wb")
downloader = MediaIoBaseDownload(fh, request)

done = False
while not done:
    status, done = downloader.next_chunk()
    print(f"Download {int(status.progress() * 100)}%.")

print("Google doc downloaded as output.docx")

"""Convert .docx to HTML"""


with open("output.docx", "rb") as docx_file:
    result = mammoth.convert_to_html(
        docx_file,
    )
    html = result.value  # The generated HTML
    messages = result.messages  # Any warnings (e.g., unsupported styles)

if messages:
    print(messages)

# Delete .docx document
os.remove("output.docx")

"""Clean empty <a> tags"""

soup = BeautifulSoup(html, "html.parser")

for a in soup.find_all("a"):
    # Remove empty anchors without href/text
    if a.attrs.get("id", "").startswith("_"):
        a.decompose()

"""Transform footnotes to HTML-friendly elements"""

footnotes = []

# Step 1: Find footnote paragraphs and store them
for p in soup.find_all("p"):
    match = re.match(r'\[(\d+)\]\s*(.*)', p.text.strip())
    if match:
        num, text = match.groups()
        footnotes.append((num, text))
        p.decompose()  # remove from main content

# Step 2: Replace inline references (parse as HTML!)
for p in soup.find_all("p"):
    def repl(m):
        num = m.group(1)
        # Return actual HTML string
        return f'<sup id="fnref{num}" class="footnote-ref"><a href="#fn{num}">{num}</a></sup>'

    new_html = re.sub(r'\[(\d+)\]', repl, p.decode_contents())
    # Replace paragraph contents with parsed HTML
    p.clear()
    p.append(BeautifulSoup(new_html, "html.parser"))

# Step 3: Add footnotes at the bottom
if footnotes:
    soup.append(soup.new_tag("hr"))

    h2 = soup.new_tag("h2")
    h2.append("Footnotes")
    soup.append(h2)

    ol = soup.new_tag("ol", **{"class": "footnotes"})
    for num, text in footnotes:
        li = soup.new_tag("li", id=f"fn{num}")
        li.append(text)
        back = soup.new_tag(
            "a", href=f"#fnref{num}", **{"class": "footnote-backref"})
        back.string = "↩︎"
        li.append(back)
        ol.append(li)
    soup.append(ol)

"""Get the title of the blog post"""
h1 = soup.find("h1")
if h1:
    title = h1.get_text(strip=True)

    title = title.lower()
    title = re.sub(r'\s+', '_', title)
    title = re.sub(r'[^\w_]', '', title)

"""Save html doc"""

with open(f"../app/src/blog_posts/{title}.html", "w") as f:
    f.write(str(soup))

print(f"output.docx converted to {title}.html")
