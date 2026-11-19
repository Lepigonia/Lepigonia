import { githubConfig, githubRequest } from "./admin";
import { parsePost, sortPosts } from "./posts";

// The deployed site only knows the posts of the last build. The admin area must work with the
// current state of the repository, otherwise edits made a minute ago can be overwritten or
// images of a not-yet-deployed post can be treated as unused.
const BATCH_SIZE = 8;

const encodePath = (path) => path.split("/").map(encodeURIComponent).join("/");

async function listPostFiles() {
  const { owner, repo, branch } = githubConfig();
  try {
    const listing = await githubRequest(`/repos/${owner}/${repo}/contents/posts?ref=${encodeURIComponent(branch)}`);
    return (Array.isArray(listing) ? listing : []).filter((entry) => entry.type === "file" && entry.name.endsWith(".md"));
  } catch (error) {
    if (/not found/i.test(error?.message || "")) return [];
    throw error;
  }
}

/** One cheap request: the slugs of all posts that exist on the branch right now. */
export async function getLivePostSlugs() {
  return new Set((await listPostFiles()).map((entry) => entry.name.replace(/\.md$/, "")));
}

/** All posts as currently stored on the branch, each with the git blob `sha` of its file. */
export async function getLivePosts() {
  const { owner, repo, branch } = githubConfig();
  const files = await listPostFiles();
  const posts = [];
  for (let index = 0; index < files.length; index += BATCH_SIZE) {
    const batch = files.slice(index, index + BATCH_SIZE);
    const loaded = await Promise.all(batch.map(async (entry) => {
      const file = await githubRequest(`/repos/${owner}/${repo}/contents/${encodePath(entry.path)}?ref=${encodeURIComponent(branch)}`);
      const raw = Buffer.from(file.content || "", "base64").toString("utf8");
      return { ...parsePost(entry.name.replace(/\.md$/, ""), raw), sha: file.sha };
    }));
    posts.push(...loaded);
  }
  return sortPosts(posts);
}