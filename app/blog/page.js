import fs from "fs"; import path from "path";
function getPosts(){
  const dir = path.join(process.cwd(),"posts");
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f=>f.endsWith(".md")).map(f=>({slug:f.replace(".md",""),file:f}));
}
export default function BlogPage(){
  const posts = getPosts();
  return(<>
    <h1 className="serif" style={{fontSize:52}}>Journal</h1>
    {posts.length===0? <div className="empty" style={{marginTop:24}}>No stories yet. Add .md file to /posts/ - English, ad-friendly, no exact live location.</div> :
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16,marginTop:24}}>
      {posts.map(p=><a key={p.slug} href={`/blog/${p.slug}`} className="card"><h3 className="serif">{p.slug}</h3><p style={{color:'#8A8A8A',fontSize:13}}>Read →</p></a>)}
    </div>}
  </>)
}
