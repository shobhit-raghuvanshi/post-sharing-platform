"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import PostActions from "../../components/PostActions";
import { mediaUrl, timeAgo, formatDate, BACKEND } from "../postUtils";
import styles from "./PostPage.module.css";

export default function PostPage() {
  const { id } = useParams();          // post ID from the URL segment
  const { user, token } = useAuth();   // needed to check ownership

  const [post,    setPost]    = useState(null);  // fetched post data
  const [loading, setLoading] = useState(true);  // shows spinner while fetching
  const [error,   setError]   = useState(false); // "404" or "failed"
  const [deleted, setDeleted] = useState(false); // shows deleted state after delete

  // Fetch the post when the page loads or the ID changes
  useEffect(() => {
    fetch(`${BACKEND}/posts/${id}`, { cache: "no-store" })
      .then((res) => {
        if (res.status === 404) { setError("404"); return; }
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => { if (data) setPost(data); })
      .catch(() => setError("failed"))
      .finally(() => setLoading(false));
  }, [id]); // re-run if navigating between post detail pages

  // Loading spinner
  if (loading) {
    return (
      <div className={styles.stateCenter}>
        <div className={styles.spinner} />
      </div>
    );
  }

  // Post was just deleted — show confirmation + back link
  if (deleted) {
    return (
      <div className={styles.stateCenter}>
        <p className={styles.deletedMsg}>Post deleted.</p>
        <Link href="/posts" className={styles.backLink}>← Back to feed</Link>
      </div>
    );
  }

  // 404 — post ID doesn't exist
  if (error === "404") {
    return (
      <div className={styles.stateCenter}>
        <p className={styles.errorMsg}>Post not found.</p>
        <Link href="/posts" className={styles.backLink}>← Back to feed</Link>
      </div>
    );
  }

  // Generic fetch error (network / backend down)
  if (error || !post) {
    return (
      <div className={styles.stateCenter}>
        <p className={styles.errorMsg}>Could not load this post. Make sure the backend is running.</p>
        <Link href="/posts" className={styles.backLink}>← Back to feed</Link>
      </div>
    );
  }

  const src     = mediaUrl(post.media_url);
  const isOwner = user && user.id === post.author_id; // controls whether actions are shown

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        {/* Breadcrumb-style back navigation */}
        <Link href="/posts" className={styles.backLink}>
          ← Back to feed
        </Link>

        <article className={styles.card}>
          {/* Left panel: full-resolution media with object-fit: contain */}
          <div className={styles.mediaPanel}>
            {post.media_type === "video" ? (
              // Videos get native controls on the detail page
              <video
                className={styles.media}
                src={src}
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                className={styles.media}
                src={src}
                alt={post.caption || "Post image"}
              />
            )}
          </div>

          {/* Right panel: author, caption, meta chips, optional owner actions */}
          <div className={styles.infoPanel}>

            {/* Author row: avatar initial + name + full timestamp */}
            <div className={styles.authorRow}>
              <div className={styles.avatar}>
                {/* Use the first character of author_id as a fallback avatar */}
                {String(post.author_id).slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className={styles.authorName}>User #{post.author_id}</p>
                <time className={styles.postedAt} dateTime={post.created_at}>
                  {formatDate(post.created_at)}
                </time>
              </div>
            </div>

            <hr className={styles.divider} />

            {/* Caption — full text, no truncation on detail page */}
            {post.caption ? (
              <p className={styles.caption}>{post.caption}</p>
            ) : (
              <p className={styles.noCaption}>No caption.</p>
            )}

            <hr className={styles.divider} />

            {/* Meta chips: media type, relative time, post ID */}
            <div className={styles.chips}>
              <span className={styles.chip}>
                {post.media_type === "video" ? "🎬 Video" : "🖼 Image"}
              </span>
              <span className={styles.chip}>
                Posted {timeAgo(post.created_at)}
              </span>
              <span className={styles.chip}>ID #{post.id}</span>
            </div>

            {/* Owner-only edit/delete controls — only rendered for the post author */}
            {isOwner && (
              <div className={styles.ownerActions}>
                <PostActions
                  post={post}
                  token={token}
                  onUpdated={(updated) => setPost(updated)} // refresh local post after edit
                  onDeleted={() => setDeleted(true)}        // switch to deleted state
                />
              </div>
            )}
          </div>
        </article>

      </div>
    </main>
  );
}
