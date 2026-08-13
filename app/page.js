import fs from "fs";
import path from "path";
import Link from "next/link";

function getPosts() {
  const postsDir = path.join(process.cwd(), "posts");
  if (!fs.existsSync(postsDir)) return [];
  return fs.readdirSync(postsDir)
   .filter(f => f.endsWith(".md"))
   .map(file => {
      const slug = file.replace(".md", "");
      const content = fs.readFileSync(path.join(postsDir, file), "utf8");
      const titleMatch = content.match(/title:\s*(.*)/);
      const title = titleMatch? titleMatch[1] : slug;
      return { slug, title };
    });
}

export default function Home() {
  const posts = getPosts();
  return (
    <main style={{ maxWidth: 700, margin: "50px auto", padding: 20, fontFamily: "system-ui" }}>
      <h1>Lepigonia Blog 🦋</h1>
      {posts.length === 0? <p>Noch keine Posts. Leg einen in /posts an!</p> : null}
      <ul>
        {posts.map(p => (
          <li key={p.slug} style={{ margin: "10px 0" }}>
            <Link href={`/blog/${p.slug}`}>{p.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
