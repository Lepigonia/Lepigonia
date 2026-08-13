import fs from "fs";
import path from "path";
import Link from "next/link";

function getPosts() {
  const dir = path.join(process.cwd(), "posts");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f=>f.endsWith(".md")).map(file=>{
    const slug = file.replace(".md","");
    const raw = fs.readFileSync(path.join(dir,file),"utf8");
    const title = raw.match(/title:\s*(.*)/)?.[1] || slug;
    const date = raw.match(/date:\s*(.*)/)?.[1] || "";
    return { slug, title, date };
  });
}

export default function Home() {
  const posts = getPosts();
  return (
    <>
      <div className="prose">
        <h1>Thoughts, notes<br/>and experiments.</h1>
        <p style={{color:'#888', maxWidth: 500}}>Ein minimaler Blog über das, woran ich gerade arbeite. Gebaut mit Next.js und Markdown.</p>
      </div>
      <div className="grid">
        {posts.map(p=>(
          <Link key={p.slug} href={`/blog/${p.slug}`} className="card">
            <p style={{fontSize:12, letterSpacing:1, textTransform:'uppercase', marginBottom:12}}>{p.date}</p>
            <h3>{p.title}</h3>
            <p>Lesen →</p>
          </Link>
        ))}
      </div>
    </>
  );
}
