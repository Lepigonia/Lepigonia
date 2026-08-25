import { neon } from "@neondatabase/serverless";

let readyPromise;
function getSql(){if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL fehlt. Bitte Neon/Postgres mit dem Vercel-Projekt verbinden.");return neon(process.env.DATABASE_URL)}
export function sql(){return getSql()}

export async function ensureDatabase(){
 if(!readyPromise){const db=getSql();readyPromise=(async()=>{
  await db`CREATE TABLE IF NOT EXISTS gallery_countries (id TEXT PRIMARY KEY,slug TEXT UNIQUE NOT NULL,name TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await db`CREATE TABLE IF NOT EXISTS gallery_images (id TEXT PRIMARY KEY,country_id TEXT NOT NULL REFERENCES gallery_countries(id) ON DELETE CASCADE,source TEXT NOT NULL CHECK (source IN ('manual','blog')),post_slug TEXT,url TEXT NOT NULL,filename TEXT,storage TEXT NOT NULL DEFAULT 'blob',title TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await db`ALTER TABLE gallery_images DROP CONSTRAINT IF EXISTS gallery_images_country_id_source_post_slug_key`;
  await db`ALTER TABLE gallery_images DROP CONSTRAINT IF EXISTS gallery_images_country_id_source_filename_key`;
  await db`CREATE UNIQUE INDEX IF NOT EXISTS gallery_images_blog_unique_idx ON gallery_images(country_id,source,post_slug,url)`;
  await db`CREATE INDEX IF NOT EXISTS gallery_images_country_idx ON gallery_images(country_id)`;
  await db`CREATE INDEX IF NOT EXISTS gallery_images_post_idx ON gallery_images(post_slug)`;
 })().catch(e=>{readyPromise=undefined;throw e});}return readyPromise
}

export async function seedGalleryFromLegacy(){await ensureDatabase();const db=getSql();const count=await db`SELECT COUNT(*)::int AS count FROM gallery_countries`;if(count[0]?.count>0)return;try{const {getGithubFile}=await import("./admin");const file=await getGithubFile("data/gallery.json");const legacy=JSON.parse(Buffer.from(file.content,"base64").toString("utf8"));for(const c of legacy.countries||[]){const id=c.id||c.slug;await db`INSERT INTO gallery_countries(id,slug,name) VALUES(${id},${c.slug},${c.name}) ON CONFLICT(slug) DO NOTHING`;for(const i of c.images||[]){await db`INSERT INTO gallery_images(id,country_id,source,post_slug,url,filename,storage,title,created_at) VALUES(${i.id||`legacy-${Date.now()}-${Math.random()}`},${id},${i.source==="blog"?"blog":"manual"},${i.postSlug||null},${i.url},${i.filename||null},${i.storage||"blob"},${i.title||null},${i.createdAt||new Date().toISOString()}) ON CONFLICT DO NOTHING`}}}catch{}}

function extractImages(content){const out=[];const re=/<img[^>]+src=["']([^"']+)["'][^>]*>/gi;let m;while((m=re.exec(String(content||""))))out.push(m[1]);return [...new Set(out.filter(u=>/^https?:\/\//i.test(u)))]}
async function findCountry(db,name){const n=String(name||"").trim();if(!n)return null;const s=slugifyCountry(n);let c=(await db`SELECT id,slug,name FROM gallery_countries WHERE lower(slug)=lower(${s}) OR lower(name)=lower(${n}) LIMIT 1`)[0];if(c)return c;await db`INSERT INTO gallery_countries(id,slug,name) VALUES(${s},${s},${n}) ON CONFLICT(slug) DO NOTHING`;return (await db`SELECT id,slug,name FROM gallery_countries WHERE slug=${s} LIMIT 1`)[0]||null}

export async function syncBlogImages(){await ensureDatabase();const db=getSql();const {getPosts}=await import("./posts");const posts=getPosts();const active=[];for(const post of posts){if(!post.country)continue;const country=await findCountry(db,post.country);if(!country)continue;active.push(post.slug);await db`UPDATE gallery_images SET country_id=${country.id} WHERE source='blog' AND post_slug=${post.slug}`;const urls=[post.image,...extractImages(post.content)].filter(Boolean);for(const url of [...new Set(urls)]){let filename=null;try{filename=decodeURIComponent(new URL(url).pathname.split("/").pop()||"")}catch{}const id=`post-${post.slug}-${Buffer.from(url).toString("base64url").slice(-32)}`;await db`INSERT INTO gallery_images(id,country_id,source,post_slug,url,filename,storage,title) VALUES(${id},${country.id},'blog',${post.slug},${url},${filename},'blob',${post.title||"Blogartikel"}) ON CONFLICT(id) DO UPDATE SET country_id=EXCLUDED.country_id,url=EXCLUDED.url,filename=EXCLUDED.filename,title=EXCLUDED.title`}}if(active.length)await db`DELETE FROM gallery_images WHERE source='blog' AND NOT(post_slug=ANY(${active}))`;else await db`DELETE FROM gallery_images WHERE source='blog'`;await db`DELETE FROM gallery_countries c WHERE NOT EXISTS(SELECT 1 FROM gallery_images i WHERE i.country_id=c.id)`}

export async function getGallery({syncPosts=true}={}){await seedGalleryFromLegacy();if(syncPosts)await syncBlogImages();const db=getSql();const countries=await db`SELECT id,slug,name FROM gallery_countries ORDER BY name ASC`;const images=await db`SELECT id,country_id,source,post_slug,url,filename,storage,title,created_at FROM gallery_images ORDER BY created_at DESC`;const map=new Map(countries.map(c=>[c.id,[]]));for(const i of images){if(!map.has(i.country_id))map.set(i.country_id,[]);map.get(i.country_id).push({id:i.id,url:i.url,source:i.source,postSlug:i.post_slug,filename:i.filename,storage:i.storage,title:i.title,createdAt:i.created_at})}return{countries:countries.map(c=>({...c,images:map.get(c.id)||[]}))}}
export function slugifyCountry(name){return String(name||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
