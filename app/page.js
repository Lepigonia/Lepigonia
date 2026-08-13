import { marked } from "marked";

export default function Home() {
  const markdown = `
# Lepigonia 🦋

Willkommen! Deine Seite läuft jetzt auf Vercel.

## Was geht?
- **Build fixed:** marked ist jetzt auf 12.0.2
- **Next.js 14** läuft
- Markdown wird live gerendert

> Du kannst hier einfach Markdown schreiben.

\`\`\`js
console.log("Es funktioniert!");
\`\`\`
  `;

  const html = marked.parse(markdown);

  return (
    <main style={{ maxWidth: 700, margin: "50px auto", padding: 20, fontFamily: "system-ui, sans-serif", lineHeight: 1.6 }}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
