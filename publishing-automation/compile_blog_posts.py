import argparse
import datetime
import hashlib
import io
import os
from pathlib import Path
import re
import sys

from bs4 import BeautifulSoup, NavigableString, Tag
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

REPO_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = REPO_ROOT / "app" / "src" / "blog-posts"
IMAGES_DIR = REPO_ROOT / "app" / "public" / "blog-images"
SECRETS_DIR = Path(__file__).parent / "secrets"
COMPONENT_TEMPLATE = Path(__file__).parent / "component_template.tsx"


def get_credentials():
    creds = None
    token_path = SECRETS_DIR / "token.json"
    credentials_path = SECRETS_DIR / "credentials.json"
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except RefreshError as e:
                if "invalid_grant" in str(e):
                    print(f"Your {token_path} has expired, delete it to regenerate (requires authentication)")
                    sys.exit(1)
                raise
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_path, SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open(token_path, "w") as token:
            token.write(creds.to_json())
    return creds


def list_docs_in_folder(service, folder_id: str) -> list[dict]:
    results = service.files().list(
        q=f"'{folder_id}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false",
        fields="files(id, name)",
    ).execute()
    return results.get("files", [])


def make_image_handler(images_dir: Path):
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

        return {"src": f"/blog-images/{filename}"}

    return handle_image


def ordinal(n: int) -> str:
    suffix = "th" if 11 <= n % 100 <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def format_date(date: datetime.date) -> str:
    return date.strftime(f"%B {ordinal(date.day)}, %Y")


def calculate_reading_time(entries: list[dict]) -> int:
    """Estimate reading time in minutes at 200 wpm across all HTML entries."""
    words = 0
    for entry in entries:
        if entry["kind"] == "html":
            for tag in entry["tags"]:
                if isinstance(tag, Tag):
                    words += len(tag.get_text().split())
    return max(1, -(-words // 200))  # ceiling division


def build_entries(soup: BeautifulSoup) -> tuple[list[dict], list[tuple[str, str]]]:
    """
    Process soup and split into a sequence of HTML and component entries.

    Returns (entries, footnotes) where entries is a list of:
      {"kind": "html",      "tags": [Tag | NavigableString, ...]}
      {"kind": "component", "descriptor": str}
    and footnotes is a list of (num, text) pairs.
    """
    # Clean empty <a> tags
    for a in soup.find_all("a"):
        if str(a.attrs.get("id", "")).startswith("_"):
            a.decompose()

    # Collect and remove footnote definition paragraphs
    footnotes: list[tuple[str, str]] = []
    for p in soup.find_all("p"):
        raw = p.decode_contents().strip()
        match = re.match(r'\[(\d+)\]\s*(.*)', raw, re.DOTALL)
        if match:
            num, text = match.groups()
            footnotes.append((num, text))
            p.decompose()

    # Replace inline footnote references [1] -> <sup>
    def repl(m):
        num = m.group(1)
        return f'<sup id="fnref{num}" class="footnote-ref"><a href="#fn{num}">{num}</a></sup>'

    for p in soup.find_all("p"):
        new_html = re.sub(r'\[(\d+)\]', repl, p.decode_contents())
        p.clear()
        p.append(BeautifulSoup(new_html, "html.parser"))

    # Walk top-level elements, splitting on [Component: ...] paragraphs
    entries: list[dict] = []
    html_buffer: list = []

    for element in list(soup.contents):
        if isinstance(element, Tag) and element.name == "p":
            text = element.get_text(strip=True)
            comp_match = re.fullmatch(r'\[Component:\s*(.*)\]', text, re.DOTALL)
            if comp_match:
                if html_buffer:
                    entries.append({"kind": "html", "tags": html_buffer})
                    html_buffer = []
                entries.append({"kind": "component", "descriptor": comp_match.group(1).strip()})
                continue
        html_buffer.append(element)

    if html_buffer:
        entries.append({"kind": "html", "tags": html_buffer})

    return entries, footnotes


def write_post(post_dir: Path, entries: list[dict], footnotes: list[tuple[str, str]], display_title: str, date_str: str, iso_date: str, reading_time: int) -> None:
    """Write numbered HTML/TSX files and index.ts to post_dir."""
    post_dir.mkdir(parents=True, exist_ok=True)

    # Append footnotes section to the last HTML entry
    if footnotes:
        last_html = next((e for e in reversed(entries) if e["kind"] == "html"), None)
        if last_html is not None:
            scratch = BeautifulSoup("", "html.parser")
            scratch.append(scratch.new_tag("hr"))
            h2 = scratch.new_tag("h2")
            h2.append("Footnotes")
            scratch.append(h2)
            ol = scratch.new_tag("ol", attrs={"class": "footnotes"})
            for num, text in footnotes:
                li = scratch.new_tag("li", id=f"fn{num}")
                li.append(BeautifulSoup(text, "html.parser"))
                back = scratch.new_tag("a", href=f"#fnref{num}", attrs={"class": "footnote-backref"})
                back.string = "↩︎"
                li.append(back)
                ol.append(li)
            scratch.append(ol)
            last_html["tags"].extend(list(scratch.contents))

    component_template = COMPONENT_TEMPLATE.read_text()

    index_imports: list[str] = []
    index_entries: list[str] = []

    for i, entry in enumerate(entries, start=1):
        num = f"{i:02d}"
        if entry["kind"] == "html":
            (post_dir / f"{num}.html").write_text("".join(str(tag) for tag in entry["tags"]))
            index_imports.append(f"import html{num} from './{num}.html?raw';")
            index_entries.append(f"  {{ kind: 'html',      content: html{num} }},")
        else:
            tsx_content = (
                component_template
                .replace("{{name}}", f"comp{num}")
                .replace("{{descriptor}}", entry["descriptor"])
            )
            (post_dir / f"{num}.tsx").write_text(tsx_content)
            index_imports.append(f"import comp{num} from './{num}';")
            index_entries.append(f"  {{ kind: 'component', Component: comp{num} }},")

    escaped_title = display_title.replace("'", "\\'")
    metadata_lines = [
        "export const metadata = {",
        f"  title: '{escaped_title}',",
        f"  date: '{date_str}',",
        f"  isoDate: '{iso_date}',",
        f"  readingTimeMinutes: {reading_time},",
        "} as const;",
    ]
    index_lines = (
        index_imports
        + [""]
        + metadata_lines
        + ["", "export const entries = ["]
        + index_entries
        + ["] as const;", ""]
    )
    (post_dir / "index.ts").write_text("\n".join(index_lines))


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
    result = mammoth.convert_to_html(fh, convert_image=make_image_handler(IMAGES_DIR))
    if result.messages:
        print(result.messages)

    soup = BeautifulSoup(result.value, "html.parser")

    # Extract title
    h1 = soup.find("h1")
    if not h1:
        raise ValueError("Blog post has no h1 title")
    display_title = h1.get_text(strip=True)
    slug = display_title.lower()
    slug = re.sub(r'\s+', '_', slug)
    slug = re.sub(r'[^\w_]', '', slug)

    post_dir = OUTPUT_DIR / slug
    if post_dir.exists():
        print(f"Skipping {post_dir}, it already exists")
        print("You can delete it to recompile the post")
        return

    entries, footnotes = build_entries(soup)
    today = datetime.date.today()
    date_str = format_date(today)
    iso_date = today.isoformat()
    reading_time = calculate_reading_time(entries)
    write_post(post_dir, entries, footnotes, display_title, date_str, iso_date, reading_time)

    print(f"Compiled {title}/ ({len(entries)} segment(s))")


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
