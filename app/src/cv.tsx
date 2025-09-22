import "./App.css"

function Cv() {

    return (
        <div className="CvPage">
            <div className="CvDownload">
                You can view the embedded PDF below or <a href="/NickCV_2page_Fall2025.pdf">download it</a> (better on mobile).
            </div>
            <iframe
                src="/NickCV_2page_Fall2025.pdf"
                width="100%"
                height="100%"
            />
        </div>
    );
}
export default Cv;