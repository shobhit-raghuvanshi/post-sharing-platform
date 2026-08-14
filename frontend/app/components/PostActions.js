"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { BACKEND, mediaUrl } from "../posts/postUtils";
import styles from "./PostActions.module.css";

// Accepted MIME types for media upload
const ACCEPTED = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm";
const MAX_MB = 50;

// Renders children into document.body to escape any CSS stacking context
function Modal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// Renders Edit and Delete buttons + their modals for a given post
export default function PostActions({ post, token, onUpdated, onDeleted, compact = false }) {
  const router = useRouter();

  // --- Edit modal state ---
  const [editOpen,    setEditOpen]    = useState(false);
  const [caption,     setCaption]     = useState(post.caption ?? "");
  const [mediaFile,   setMediaFile]   = useState(null);   // new file chosen by the user
  const [preview,     setPreview]     = useState(null);   // object URL for the new file
  const [fileError,   setFileError]   = useState("");     // client-side file validation error
  const [editLoading, setEditLoading] = useState(false);
  const [editError,   setEditError]   = useState("");     // API error shown inside the modal
  const fileInputRef = useRef(null);                      // ref to the hidden <input type="file">

  // --- Delete modal state ---
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState("");

  // Revoke the object URL when the component unmounts to free memory
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  // Reset edit form state and open the modal
  function openEdit() {
    setCaption(post.caption ?? "");
    setMediaFile(null);
    setPreview(null);
    setFileError("");
    setEditError("");
    setEditOpen(true);
  }

  // Clean up preview URL and close the edit modal
  function closeEdit() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setMediaFile(null);
    setFileError("");
    setEditError("");
    setEditOpen(false);
  }

  // Validate size + type, then create a local preview URL
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");

    if (file.size > MAX_MB * 1024 * 1024) {
      setFileError(`File too large. Maximum is ${MAX_MB} MB.`);
      return;
    }
    const ok = file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!ok) {
      setFileError("Unsupported type. Use JPG, PNG, GIF, WebP, MP4, MOV or WebM.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setMediaFile(file);
    setPreview(URL.createObjectURL(file));
  }

  // Reverts to showing the original media (no new file selected)
  function clearNewMedia() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setMediaFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = ""; // reset native input
  }

  // PUT /posts/{id} — sends caption + optional new media file
  async function handleEdit(e) {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);
    try {
      const body = new FormData();
      body.append("caption", caption);
      if (mediaFile) body.append("media", mediaFile); // only include if a new file was chosen

      const res = await fetch(`${BACKEND}/posts/${post.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update post.");
      }
      const updated = await res.json();
      closeEdit();
      onUpdated?.(updated); // notify parent to refresh its local post data
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  }

  // DELETE /posts/{id} — calls onDeleted or redirects to the feed
  async function handleDelete() {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      const res = await fetch(`${BACKEND}/posts/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete post.");
      }
      setDeleteOpen(false);
      if (onDeleted) {
        onDeleted();               // e.g. remove card from list in My Posts
      } else {
        router.push("/posts");     // fallback: redirect to feed (e.g. from detail page)
      }
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  const currentSrc = mediaUrl(post.media_url);
  const newIsVideo  = mediaFile?.type.startsWith("video/"); // used to pick <video> vs <img> in preview

  return (
    <>
      {/* ── Action bar ── */}
      <div className={`${styles.actions} ${compact ? styles.actionsCompact : ""}`}>
        <button
          className={`${styles.btn} ${styles.btnEdit}`}
          onClick={(e) => { e.preventDefault(); openEdit(); }}
          aria-label="Edit post"
        >
          ✎ Edit
        </button>
        <button
          className={`${styles.btn} ${styles.btnDelete}`}
          onClick={(e) => { e.preventDefault(); setDeleteOpen(true); }}
          aria-label="Delete post"
        >
          ✕ Delete
        </button>
      </div>

      {/* ── Edit modal (portalled to <body> to escape card stacking context) ── */}
      {editOpen && (
        <Modal>
          <div className={styles.backdrop} onClick={closeEdit}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Edit post</h2>
                <button className={styles.modalClose} onClick={closeEdit} aria-label="Close">✕</button>
              </div>

              <form onSubmit={handleEdit} className={styles.modalForm}>
                {/* API-level error banner */}
                {editError && (
                  <p className={styles.modalError}><span>⚠</span> {editError}</p>
                )}

                {/* ── Media replacement section ── */}
                <p className={styles.fieldLabel}>Media</p>

                {/* Thumbnail shows the current media; switches to new preview once chosen */}
                <div className={styles.mediaPreviewRow}>
                  <div className={styles.mediaThumb}>
                    {preview ? (
                      // Show the newly selected file as a preview
                      newIsVideo
                        ? <video className={styles.thumbMedia} src={preview} muted playsInline />
                        : <img   className={styles.thumbMedia} src={preview} alt="New media" />
                    ) : (
                      // Fall back to the existing saved media
                      post.media_type === "video"
                        ? <video className={styles.thumbMedia} src={currentSrc} muted playsInline />
                        : <img   className={styles.thumbMedia} src={currentSrc} alt="Current media" />
                    )}
                    {/* Badge overlaid on the thumb to indicate which is shown */}
                    <span className={styles.thumbBadge}>
                      {preview ? "New" : "Current"}
                    </span>
                  </div>

                  <div className={styles.mediaActions}>
                    {/* Triggers the hidden file input */}
                    <button
                      type="button"
                      className={styles.btnChooseFile}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {mediaFile ? "Change file" : "Replace media"}
                    </button>

                    {/* Shown after a file is selected — filename + revert link */}
                    {mediaFile && (
                      <>
                        <p className={styles.chosenName} title={mediaFile.name}>
                          {mediaFile.name.length > 28
                            ? mediaFile.name.slice(0, 25) + "…"
                            : mediaFile.name}
                        </p>
                        <button
                          type="button"
                          className={styles.btnClearFile}
                          onClick={clearNewMedia}
                        >
                          ✕ Keep original
                        </button>
                      </>
                    )}
                    {fileError && <p className={styles.fileError}>{fileError}</p>}
                  </div>
                </div>

                {/* Hidden native file input — triggered programmatically */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED}
                  className={styles.hiddenInput}
                  onChange={handleFileChange}
                />

                {/* ── Caption section ── */}
                <p className={styles.fieldLabel}>Caption</p>
                <textarea
                  className={styles.modalTextarea}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption…"
                  maxLength={500}
                  rows={3}
                />
                <p className={styles.charCount}>{caption.length} / 500</p>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.btnCancel} onClick={closeEdit}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.btnSave} disabled={editLoading}>
                    {editLoading ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirmation modal (portalled to <body>) ── */}
      {deleteOpen && (
        <Modal>
          <div className={styles.backdrop} onClick={() => setDeleteOpen(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Delete post?</h2>
                <button className={styles.modalClose} onClick={() => setDeleteOpen(false)} aria-label="Close">✕</button>
              </div>
              <div className={styles.modalForm}>
                {deleteError && <p className={styles.modalError}><span>⚠</span> {deleteError}</p>}
                <p className={styles.deleteWarning}>
                  This will permanently remove the post and its media. This action cannot be undone.
                </p>
                <div className={styles.modalFooter}>
                  <button type="button" className={styles.btnCancel} onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
                    Cancel
                  </button>
                  <button type="button" className={styles.btnConfirmDelete} onClick={handleDelete} disabled={deleteLoading}>
                    {deleteLoading ? "Deleting…" : "Yes, delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
