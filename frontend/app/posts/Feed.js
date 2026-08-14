// Client component — renders the post grid or appropriate empty/error state
"use client";

import PostCard from "./PostCard";
import styles from "./Feed.module.css";

export default function Feed({ posts, error }) {
  // Show error message if the backend fetch failed
  if (error) {
    return (
      <div className={styles.centered}>
        <p className={styles.errorMsg}>{error}</p>
      </div>
    );
  }

  // Empty state — no posts exist yet
  if (posts.length === 0) {
    return (
      <div className={styles.centered}>
        <p className={styles.emptyMsg}>No posts yet. Be the first to share!</p>
      </div>
    );
  }

  // Render a card for each post in the feed
  return (
    <main className={styles.feedWrapper}>
      <div className={styles.feed}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </main>
  );
}
