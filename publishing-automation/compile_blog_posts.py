import argparse
import hashlib
import io
import os
import re
import sys

from bs4 import BeautifulSoup
from google.auth.exceptions import RefreshError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload
import mammoth

# If modifying scopes, delete the file token.json
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

FOLDER_ID = "1wsrj9cyi2pTuBhn32k-iwQjQLVmWkc61"


def get_credentials():
    creds = None
    if os.path.exists("secrets/token.json"):
        creds = Credentials.from_authorized_user_file("secrets/token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except RefreshError as e:
                if "invalid_grant" in str(e):
                    print("Your secrets/token.json has expired, delete it to regenerate (requires authentication)")
                    sys.exit(1)
                raise
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "secrets/credentials.json", SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open("secrets/token.json", "w") as token:
            token.write(creds.to_json())
    return creds


def list_docs_in_folder(service, folder_id: str) -> list[dict]:
    results = service.files().list(
        q=f"'{folder_id}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false",
        fields="files(id, name)",
    ).execute()
    return results.get("files", [])


def make_image_handler(images_dir: str):
    os.makedirs(images_dir, exist_ok=True)

    @mammoth.images.img_element
    def handle_image(image):
        with image.open() as f:
            data = f.read()

        ext = image.content_type.split(";")[0].strip().split("/")[-1]
        if ext == "jpeg":
            ext = "jpg"

        digest = hashlib.sha256(data).hexdigest()[:16]
        filename = f"{digest}.{ext}"
        dest = os.path.join(images_dir, filename)

        if not os.path.exists(dest):
            with open(dest, "wb") as out:
                out.write(data)

        return {"src": f"./images/{filename}"}

    return handle_image


def process_doc(service, file_id: str) -> None:
    # Download the Google Doc as .docx into memory
    try:
        request = service.files().export_media(
            fileId=file_id,
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
        print(f"Failed to download {file_id}: {e}")
        return

    # Convert .docx to HTML
    output_dir = "../app/src/blog_posts"
    images_dir = os.path.join(output_dir, "images")
    result = mammoth.convert_to_html(fh, convert_image=make_image_handler(images_dir))
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
    output_path = f"{output_dir}/{title}.html"
    if os.path.exists(output_path):
        print(f"Skipping {output_path}, it already exists")
        print("You can delete the data there to recompile the post")
        return
    with open(output_path, "w") as f:
        f.write(str(soup))

    print(f"Converted to {title}.html")


def main():
    parser = argparse.ArgumentParser(description="Convert a Google Doc to HTML for the blog")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("file_id", nargs="?", help="Google Doc file ID")
    group.add_argument("--folder", action="store_true", help="Process all docs in the blog posts folder")
    args = parser.parse_args()

    service = build("drive", "v3", credentials=get_credentials())

    if args.folder:
        docs = list_docs_in_folder(service, FOLDER_ID)
        if not docs:
            print("No Google Docs found in folder")
            sys.exit(0)
        print(f"Found {len(docs)} doc(s) in folder")
        for doc in docs:
            print(f"\nProcessing: {doc['name']}")
            process_doc(service, doc["id"])
    else:
        process_doc(service, args.file_id)


if __name__ == "__main__":
    main()
