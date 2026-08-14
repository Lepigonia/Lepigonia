import fs from "fs"; import path from "path";
export default function GalleryPage(){
  // TODO: Connect to /public/images/gallery/ - list files via API route later
  return(<>
    <h1 className="serif" style={{fontSize:52}}>Gallery</h1>
    <div className="empty" style={{marginTop:24}}>
      No images yet.<br/>Upload your authentic images to <code>/public/images/gallery/</code><br/>
      Then they will be listed here. Add route <code>/api/images</code> later for S3/Cloud storage.<br/><br/>
      <span style={{fontSize:12}}>Placeholder for: title, location, date, category, description per image</span>
    </div>
  </>)
}
