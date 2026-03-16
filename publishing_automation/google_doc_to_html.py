import argparse
import io
import os
import re
import sys

from bs4 import BeautifulSoup
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload
import mammoth

# If modifying scopes, delete the file token.json
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


def main():
    parser = argparse.ArgumentParser(description="Convert a Google Doc to HTML for the blog")
    parser.add_argument("file_id", help="Google Doc file ID")
    args = parser.parse_args()

    # Load saved credentials, if available
    creds = None
    if os.path.exists("secrets/token.json"):
        creds = Credentials.from_authorized_user_file("secrets/token.json", SCOPES)
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

    # Download the Google Doc as .docx into memory
    try:
        request = service.files().export_media(
            fileId=args.file_id,
            mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
            print(f"Download {int(status.progress() * 100)}%.")
        fh.seek(0)
    except HttpError as e:
        print(f"Failed to download Google Doc: {e}")
        sys.exit(1)

    print("Google doc downloaded")

    # Convert .docx to HTML
    result = mammoth.convert_to_html(fh)
    html = result.value
    if result.messages:
        print(result.messages)

    # Clean empty <a> tags
    soup = BeautifulSoup(html, "html.parser")

    for a in soup.find_all("a"):
        if str(a.attrs.get("id", "")).startswith("_"):
            a.decompose()

    # Transform footnotes to HTML-friendly elements
    footnotes = []

    # Find footnote paragraphs and store them
    for p in soup.find_all("p"):
        raw = p.decode_contents().strip()
        match = re.match(r'\[(\d+)\]\s*(.*)', raw, re.DOTALL)
        if match:
            num, text = match.groups()
            footnotes.append((num, text))
            p.decompose()

    # Replace inline references
    def repl(m):
        num = m.group(1)
        return f'<sup id="fnref{num}" class="footnote-ref"><a href="#fn{num}">{num}</a></sup>'

    for p in soup.find_all("p"):
        new_html = re.sub(r'\[(\d+)\]', repl, p.decode_contents())
        p.clear()
        p.append(BeautifulSoup(new_html, "html.parser"))

    # Add footnotes at the bottom
    if footnotes:
        soup.append(soup.new_tag("hr"))

        h2 = soup.new_tag("h2")
        h2.append("Footnotes")
        soup.append(h2)

        ol = soup.new_tag("ol", attrs={"class": "footnotes"})
        for num, text in footnotes:
            li = soup.new_tag("li", id=f"fn{num}")
            li.append(BeautifulSoup(text, "html.parser"))
            back = soup.new_tag("a", href=f"#fnref{num}", attrs={"class": "footnote-backref"})
            back.string = "↩︎"
            li.append(back)
            ol.append(li)
        soup.append(ol)

    # Get the title of the blog post
    h1 = soup.find("h1")
    if not h1:
        raise ValueError("Blog post has no h1 title")
    title = h1.get_text(strip=True)
    title = title.lower()
    title = re.sub(r'\s+', '_', title)
    title = re.sub(r'[^\w_]', '', title)

    # Save HTML doc
    output_path = f"../app/src/blog_posts/{title}.html"
    if os.path.exists(output_path):
        print(f"Skipping {output_path}, it already exists")
        print("You can delete the data there to recompile the post")
        return
    with open(output_path, "w") as f:
        f.write(str(soup))

    print(f"Converted to {title}.html")


if __name__ == "__main__":
    main()
