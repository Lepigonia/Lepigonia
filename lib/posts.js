import fs from "node:fs";
import path from "node:path";

const postsDir = path.join(process.cwd(), "posts");

function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };
  const data = {};
  match[1].split("\n").forEach(line => {
    const i = line.indexOf(":");
    if (i < 0) return;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    if (value.startsWith("[") && value.endsWith("]")) value = value.slice(1, -1).split(",").map(v => v.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
    data[key] = value;
  });
  return { data, content: match[2].trim() };
}

/** Parses the raw text of a posts/<slug>.md file (also used for files fetched live from GitHub). */
export function parsePost(slug, raw) {
  const { data, content } = parseFrontmatter(String(raw || ""));
  return { slug, content, ...data };
}

export function sortPosts(posts) {
  return [...posts].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

/** Posts as they were deployed (read from the file system at build time). */
export function getPosts() {
  if (!fs.existsSync(postsDir)) return [];
  return sortPosts(
    fs.readdirSync(postsDir).filter(file => file.endsWith(".md")).map(file =>
      parsePost(file.replace(/\.md$/, ""), fs.readFileSync(path.join(postsDir, file), "utf8"))
    )
  );
}

export function getPost(slug) { return getPosts().find(post => post.slug === slug); }