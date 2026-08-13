import fs from "fs";
import path from "path";
import { marked } from "marked";

export default function Post({ params }) {
  const filePath = path.join(process.cwd(), "posts", `${params.slug}.md`);
  if (!fs.existsSync(filePath)) return <div>Post nicht gefunden</div>;

  let fileContent = fs.readFileSync(filePath, "utf8");
  // Entferne frontmatter (--- block)
  fileContent = fileContent.replace(/---[\s\S]*?---/, "").trim();

  const html = marked.parse(fileContent);

  return (
    <main style={{ maxWidth: 700, margin: "50px auto", padding: 20, fontFamily: "system-ui", lineHeight: 1.7 }}>
      <a href="/">← Zurück</a>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
