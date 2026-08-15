import { getPosts } from "../lib/posts";
export default function sitemap(){const base="https://lepigonia.vercel.app";const pages=["/","/blog","/gallery","/map","/about"].map(path=>({url:base+path,lastModified:new Date()}));const posts=getPosts().map(post=>({url:`${base}/blog/${post.slug}`,lastModified:post.date?new Date(post.date):new Date()}));return [...pages,...posts]}
