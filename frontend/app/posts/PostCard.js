"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import PostActions from "../components/PostActions";
import styles from "./PostCard.module.css";
import { mediaUrl, timeAgo } from "./postUtils";

export default function PostCard({ post: initialPost }) {
  const { user, token } = useAuth();
  const [post, setPost]       = useState(initialPost); // local copy so edits reflect immediately
  const [removed, setRemoved] = useState(false);       // true after a successful delete

  const [expanded, setExpanded] = useState(false); // caption "more/less" toggle
  const src      = mediaUrl(post.media_url);        // full URL to the media file
  const caption  = post.caption ?? "";
  const isLong   = caption.length > 120;            // truncate captions longer than 120 chars
  const isOwner  = user && user.id === post.author_id; // show actions only to the post owner

  // Hide the card once it has been deleted
  if (removed) return null;

  return (
    <article className={styles.card}>
      {/* The entire card content is wrapped in a Link for full-card navigation */}
      <Link href={`/posts/${post.id}`} className={styles.cardLink}>

        {/* Media thumbnail — square aspect-ratio, object-fit: cover */}
        <div className={styles.mediaWrapper}>
          {post.media_type === "video" ? (
            // Videos muted + preload=metadata for fast first frame on hover
            <video
              className={styles.media}
              src={src}
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              className={styles.media}
              src={src}
              alt={caption || "Post image"}
            />
          )}
        </div>

        {/* Card body: caption (with truncation) + author/time metadata */}
        <div className={styles.body}>
          {caption && (
            <p className={styles.caption}>
              {/* Truncate at 120 chars and show a "more"/"less" toggle */}
              {isLong && !expanded ? caption.slice(0, 120) + "… " : caption + " "}
              {isLong && (
                <button
                  className={styles.toggleBtn}
                  onClick={(e) => { e.preventDefault(); setExpanded((v) => !v); }}
                >
                  {expanded ? "less" : "more"}
                </button>
              )}
            </p>
          )}

          <div className={styles.meta}>
            <span className={styles.author}>User #{post.author_id}</span>
            <span className={styles.dot}>·</span>
            <time className={styles.time} dateTime={post.created_at}>
              {timeAgo(post.created_at)}
            </time>
          </div>
        </div>
      </Link>

      {/* Owner actions bar — rendered outside the Link to prevent navigation on click */}
      {isOwner && (
        <PostActions
          post={post}
          token={token}
          onUpdated={(updated) => setPost(updated)}  // refresh local post after edit
          onDeleted={() => setRemoved(true)}          // remove card from DOM after delete
          compact // uses the smaller action bar variant
        />
      )}
    </article>
  );
}
