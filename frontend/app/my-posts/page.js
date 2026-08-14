"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { BACKEND, mediaUrl, timeAgo } from "../posts/postUtils";
import PostActions from "../components/PostActions";
import styles from "./MyPosts.module.css";

export default function MyPostsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [posts,    setPosts]    = useState([]);  // current user's posts
  const [fetching, setFetching] = useState(true); // shows spinner on first load
  const [error,    setError]    = useState("");   // fetch error message

  // Redirect unauthenticated users to /login
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Fetches the current user's posts from GET /posts/myposts
  // Wrapped in useCallback so the useEffect below can safely list it as a dependency
  const fetchMyPosts = useCallback(async () => {
    if (!token) return; // wait until the token is available
    setFetching(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND}/posts/myposts`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store", // always get the latest data
      });
      if (!res.ok) throw new Error();
      setPosts(await res.json());
    } catch {
      setError("Could not load your posts. Make sure the backend is running.");
    } finally {
      setFetching(false);
    }
  }, [token]);

  // Trigger the fetch on mount (and whenever the token changes)
  useEffect(() => { fetchMyPosts(); }, [fetchMyPosts]);

  /**
   * handleUpdated — Replace the edited post in the local array.
   * Called by MyPostCard after a successful edit; propagated from PostActions.
   */
  function handleUpdated(updated) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  /**
   * handleDeleted — Remove the deleted post from the local array.
   * Called by MyPostCard after a successful delete.
   */
  function handleDeleted(id) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  // Render nothing while auth is loading to avoid a flash of content
  if (loading || !user) return null;

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        {/* ── Profile header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {/* Avatar with the first letter of the user's name */}
            <div className={styles.avatar}>
              {user.fullname.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className={styles.title}>{user.fullname}</h1>
              <p className={styles.subtitle}>{user.email}</p>
            </div>
          </div>
          <Link href="/create-post" className={styles.btnNewPost}>
            + New Post
          </Link>
        </div>

        {/* ── Stats bar ── */}
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{posts.length}</span>
            <span className={styles.statLabel}>Posts</span>
          </div>
        </div>

        {/* ── Content area: spinner | error | empty | grid ── */}
        {fetching ? (
          // Loading spinner
          <div className={styles.centered}>
            <div className={styles.spinner} />
          </div>
        ) : error ? (
          // Error state with a retry button
          <div className={styles.centered}>
            <p className={styles.errorMsg}>{error}</p>
            <button className={styles.retryBtn} onClick={fetchMyPosts}>Retry</button>
          </div>
        ) : posts.length === 0 ? (
          // Empty state — prompt user to create their first post
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No posts yet</p>
            <p className={styles.emptySubtitle}>Share your first photo or video with the world.</p>
            <Link href="/create-post" className={styles.btnNewPost}>+ New Post</Link>
          </div>
        ) : (
          // Post grid
          <div className={styles.grid}>
            {posts.map((post) => (
              <MyPostCard
                key={post.id}
                post={post}
                token={token}
                onUpdated={handleUpdated}
                onDeleted={() => handleDeleted(post.id)}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

// Individual card in the My Posts grid — keeps its own local post copy for instant UI updates
function MyPostCard({ post, token, onUpdated, onDeleted }) {
  const [localPost, setLocalPost] = useState(post); // local copy for optimistic updates
  const src = mediaUrl(localPost.media_url);

  // Update local state and notify the parent list
  function handleUpdated(updated) {
    setLocalPost(updated);
    onUpdated?.(updated);
  }

  return (
    <article className={styles.card}>
      {/* Thumbnail links to the detail page */}
      <Link href={`/posts/${localPost.id}`} className={styles.mediaLink}>
        <div className={styles.mediaWrapper}>
          {localPost.media_type === "video" ? (
            <video className={styles.media} src={src} muted playsInline preload="metadata" />
          ) : (
            <img className={styles.media} src={src} alt={localPost.caption || "Post"} />
          )}
          {/* "View" label fades in on hover via CSS */}
          <div className={styles.mediaOverlay}>View</div>
        </div>
      </Link>

      {/* Caption (truncated to 2 lines via CSS) + relative timestamp */}
      <div className={styles.cardBody}>
        <p className={styles.cardCaption}>
          {localPost.caption
            ? localPost.caption
            : <span className={styles.noCaption}>No caption</span>}
        </p>
        <time className={styles.cardTime} dateTime={localPost.created_at}>
          {timeAgo(localPost.created_at)}
        </time>
      </div>

      {/* Edit/delete controls — compact variant for the grid */}
      <PostActions
        post={localPost}
        token={token}
        onUpdated={handleUpdated}
        onDeleted={onDeleted}
        compact
      />
    </article>
  );
}
