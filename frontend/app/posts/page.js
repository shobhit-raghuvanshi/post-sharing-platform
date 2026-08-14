// Server component — fetches all posts at request time and passes them to Feed
import Feed from "./Feed";

export const metadata = {
  title: "Feed – Postly",
  description: "Browse all posts on Postly",
};

export default async function PostsPage() {
  let posts = [];
  let error = null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000"}/posts/`,
      { cache: "no-store" }, // always fetch fresh — no stale cache
    );
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    posts = await res.json();
  } catch (err) {
    // Surface a friendly message; Feed will render it as an error state
    error = "Could not load posts. Make sure the backend is running.";
  }

  return <Feed posts={posts} error={error} />;
}
