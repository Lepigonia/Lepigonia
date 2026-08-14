import fs from "fs"; import path from "path"; import { marked } from "marked";
export default function Post({params}){
  const fp = path.join(process.cwd(),"posts",`${params.slug}.md`);
  if(!fs.existsSync(fp)) return <div>Post not found</div>;
  const raw = fs.readFileSync(fp,"utf8");
  const content = raw.replace(/---[\s\S]*?---/,"").trim();
  const html = marked.parse(content);
  return(<div style={{maxWidth:700}}><a href="/blog" style={{fontSize:13}}>← Back</a><div dangerouslySetInnerHTML={{__html:html}} style={{marginTop:24,lineHeight:1.8}}/></div>)
}
