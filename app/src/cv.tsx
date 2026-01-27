import "./App.css"

function Cv() {

  return (
    <div className="CvPage">
      <div className="CvDownload">
        You can view my CV as an embedded PDF below or <a href="/NickCV_1page_Spr2026.pdf">download it</a> (better on mobile).
      </div>
      <iframe
        className="CvEmbed"
        src="/NickCV_1page_Spr2026.pdf"
        width="100%"
        height="100%"
      />
    </div>
  );
}
export default Cv;
