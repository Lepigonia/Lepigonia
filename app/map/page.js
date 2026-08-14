import fs from "fs"; import path from "path";
// Map derives from blogposts - if no posts, map is empty
function getLocations(){
  // TODO: Connect to real data source - currently reads posts folder
  // Each post frontmatter should contain: lat, lng, location, country
  return [];
}
export default function MapPage(){
  const locs = getLocations();
  return(<>
    <h1 className="serif" style={{fontSize:52}}>Travel Map</h1>
    {locs.length===0? <div className="empty" style={{marginTop:24}}>No locations yet. Add a blogpost with lat/lng frontmatter - pin appears automatically.<br/><br/>Example frontmatter:<br/>---<br/>title: Title<br/>location: Morocco<br/>lat: 31.6295<br/>lng: -7.9811<br/>---</div> :
    <div className="card" style={{marginTop:24,height:500}}>Map component - connect to MapLibre/Leaflet here. Data: {JSON.stringify(locs)}</div>}
  </>)
}
