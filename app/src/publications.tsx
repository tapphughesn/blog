import "./App.css"

function Publications() {

    return (
        <div className="publications-content">
            <h2 className="publications-header">
                Publications
            </h2>
            <ol className="publications-list">
                <li>
                    Stephen M. Pizer, Zhiyuan Liu, Junjie Zhao, <strong>Nicholas Tapp-Hughes</strong>, James Damon, Miaomiao Zhang, JS Marron, Mohsen Taheri, Jared Vicory,
                    <br />
                    "Interior Object Geometry via Fitted Frames,"
                    <br />
                    Available: Springer, <a href="https://rdcu.be/eFX0G">https://rdcu.be/eFX0G.</a>
                </li>
                <li>
                    <strong>Nicholas Tapp Hughes</strong>,
                    <br />
                    "A 3d U-net for Segmentation of Subcortical Structures In MR Images of 12 and 24 Month-old Infants,"
                    <br />
                    Available: Carolina Digital Repository, <a href="https://cdr.lib.unc.edu/concern/honors_theses/4f16c8286">https://cdr.lib.unc.edu/concern/honors\_theses/4f16c8286. </a>
                </li>
            </ol>
        </div >
    );
}
export default Publications;
