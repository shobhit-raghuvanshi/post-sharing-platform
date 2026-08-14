"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { BACKEND } from "../posts/postUtils";
import styles from "./CreatePost.module.css";

// Accepted MIME types passed to the native file picker
const ACCEPTED = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm";
const MAX_SIZE_MB = 50;

export default function CreatePostPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  // Selected file state
  const [file, setFile]           = useState(null);  // the File object to upload
  const [preview, setPreview]     = useState(null);  // local object URL for preview
  const [mediaType, setMediaType] = useState(null);  // "image" or "video"

  // Form / UI state
  const [caption, setCaption]       = useState("");
  const [dragOver, setDragOver]     = useState(false);   // drag-over highlight
  const [fileError, setFileError]   = useState("");      // client-side file validation error
  const [apiError, setApiError]     = useState("");      // server error
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);   // true after successful upload

  const inputRef = useRef(null); // ref to hidden <input type="file">

  // Redirect to /login if the user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Revoke the object URL on unmount to free browser memory
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  // Validates a picked File and creates a preview URL
  function pickFile(picked) {
    setFileError("");
    setApiError("");
    if (!picked) return;

    if (picked.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }

    const isImage = picked.type.startsWith("image/");
    const isVideo = picked.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setFileError("Unsupported file type. Use JPG, PNG, GIF, WebP, MP4, MOV or WebM.");
      return;
    }

    // Revoke old preview URL before creating a new one
    if (preview) URL.revokeObjectURL(preview);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
    setMediaType(isImage ? "image" : "video");
  }

  // Triggered by the hidden file <input>
  function handleInputChange(e) {
    pickFile(e.target.files?.[0] ?? null);
  }

  // Triggered by dropping a file onto the drop zone
  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  // Clears the selected file and resets the native input
  function clearFile() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setMediaType(null);
    setFileError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  // POST /posts/ — multipart/form-data with the media file + optional caption
  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setFileError("Please choose a photo or video."); return; }

    setApiError("");
    setSubmitting(true);

    const formData = new FormData();
    formData.append("media", file);
    if (caption.trim()) formData.append("caption", caption.trim()); // skip empty caption

    try {
      const res = await fetch(`${BACKEND}/posts/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // JWT in header, not body
        body: formData,
        // Content-Type is intentionally omitted — browser sets it with the boundary
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create post.");
      }

      const post = await res.json();
      setSuccess(true);
      // Brief success screen, then redirect to the new post's detail page
      setTimeout(() => router.push(`/posts/${post.id}`), 1200);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Render nothing while auth state is loading to avoid a flash of content
  if (loading || !user) return null;

  // Success screen — shown after the post is published
  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.successState}>
          <div className={styles.successIcon}>✓</div>
          <p className={styles.successText}>Post published! Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Page header */}
        <div className={styles.header}>
          <Link href="/posts" className={styles.backLink}>← Back to feed</Link>
          <h1 className={styles.title}>New Post</h1>
          <p className={styles.subtitle}>Share a photo or video with the world</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.layout}>

            {/* ── Left column: media picker ── */}
            <div className={styles.mediaCol}>
              {!preview ? (
                // Drop zone — visible when no file has been selected yet
                <div
                  className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ""} ${fileError ? styles.dropZoneError : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
                  aria-label="Upload media"
                >
                  <span className={styles.dropIcon}>↑</span>
                  <p className={styles.dropTitle}>Drop your file here</p>
                  <p className={styles.dropHint}>or click to browse</p>
                  <p className={styles.dropMeta}>
                    JPG · PNG · GIF · WebP · MP4 · MOV · WebM — up to {MAX_SIZE_MB} MB
                  </p>
                </div>
              ) : (
                // Preview area — shown once a file is selected
                <div className={styles.previewWrapper}>
                  {mediaType === "video" ? (
                    <video
                      className={styles.previewMedia}
                      src={preview}
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      className={styles.previewMedia}
                      src={preview}
                      alt="Preview"
                    />
                  )}
                  {/* Remove button overlaid on top of the preview */}
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={clearFile}
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                  {/* Badge showing media type */}
                  <div className={styles.previewBadge}>
                    {mediaType === "video" ? "Video" : "Image"}
                  </div>
                </div>
              )}

              {/* Hidden native file input — triggered programmatically */}
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className={styles.hiddenInput}
                onChange={handleInputChange}
              />

              {fileError && <p className={styles.fieldError}>{fileError}</p>}

              {/* "Change file" button — only visible when a preview is shown */}
              {preview && (
                <button
                  type="button"
                  className={styles.changeFileBtn}
                  onClick={() => inputRef.current?.click()}
                >
                  Change file
                </button>
              )}
            </div>

            {/* ── Right column: author chip, caption, submit ── */}
            <div className={styles.infoCol}>
              {/* Author chip showing the logged-in user's name */}
              <div className={styles.authorChip}>
                <span className={styles.authorAvatar}>
                  {user.fullname.charAt(0).toUpperCase()}
                </span>
                <span className={styles.authorName}>{user.fullname}</span>
              </div>

              {/* Caption textarea — optional */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="caption">
                  Caption <span className={styles.optional}>(optional)</span>
                </label>
                <textarea
                  id="caption"
                  className={styles.textarea}
                  placeholder="Write a caption…"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={500}
                  rows={5}
                />
                <p className={styles.charCount}>{caption.length} / 500</p>
              </div>

              {/* API error banner */}
              {apiError && (
                <div className={styles.errorBanner}>
                  <span>⚠</span> {apiError}
                </div>
              )}

              {/* Submit — disabled until a file is chosen or while submitting */}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitting || !file}
              >
                {submitting ? "Publishing…" : "Publish post"}
              </button>

              <p className={styles.disclaimer}>
                By posting you agree to Postly&apos;s community guidelines.
              </p>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
