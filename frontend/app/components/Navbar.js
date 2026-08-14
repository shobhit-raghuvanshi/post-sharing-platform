"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen]         = useState(false); // mobile hamburger state
  const [dropdownOpen, setDropdownOpen] = useState(false); // desktop user dropdown state
  const { user, loading, logout } = useAuth();

  // Close both the mobile menu and desktop dropdown at once
  function closeAll() {
    setMenuOpen(false);
    setDropdownOpen(false);
  }

  // First letter of the user's name used as the avatar initial
  const initial = user?.fullname?.charAt(0).toUpperCase() ?? "?";

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>

        <Link href="/" className={styles.brand}>
          Postly
        </Link>

        {/* Desktop nav links */}
        <ul className={styles.navLinks}>
          <li>
            <Link href="/" className={styles.navLink}>Home</Link>
          </li>
          <li>
            <Link href="/posts" className={styles.navLink}>Posts</Link>
          </li>
          <li>
            <Link href="/" className={styles.navLink}>About</Link>
          </li>
          <li>
            <Link href="/" className={styles.navLink}>Contact</Link>
          </li>
        </ul>

        {/* Desktop auth section */}
        <div className={styles.authButtons}>
          {/* "+ New Post" button — visible only when logged in */}
          {!loading && user && (
            <Link href="/create-post" className={styles.btnNewPost}>
              + New Post
            </Link>
          )}

          {!loading && (
            user ? (
              // Logged-in: avatar button that opens a dropdown
              <div className={styles.userMenu}>
                <button
                  className={styles.avatarBtn}
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                >
                  <span className={styles.avatar}>{initial}</span>
                  <span className={styles.userName}>{user.fullname}</span>
                  {/* Chevron rotates 180° when dropdown is open */}
                  <span className={`${styles.chevron} ${dropdownOpen ? styles.chevronUp : ""}`}>▾</span>
                </button>

                {dropdownOpen && (
                  <>
                    {/* Invisible backdrop — closes dropdown on outside click */}
                    <div className={styles.dropdownBackdrop} onClick={() => setDropdownOpen(false)} />
                    <div className={styles.dropdown}>
                      {/* User identity header */}
                      <div className={styles.dropdownHeader}>
                        <p className={styles.dropdownName}>{user.fullname}</p>
                        <p className={styles.dropdownEmail}>{user.email}</p>
                      </div>
                      <hr className={styles.dropdownDivider} />
                      <Link href="/my-posts" className={styles.dropdownItem} onClick={closeAll}>
                        My Posts
                      </Link>
                      <hr className={styles.dropdownDivider} />
                      <button className={styles.dropdownLogout} onClick={() => { logout(); closeAll(); }}>
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Logged-out: show login / sign-up links
              <>
                <Link href="/login"    className={styles.btnOutline}>Log in</Link>
                <Link href="/register" className={styles.btnPrimary}>Sign up</Link>
              </>
            )
          )}
        </div>

        {/* Hamburger button — mobile only, toggles the mobile menu */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>
      </div>

      {/* Mobile slide-down menu */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}>
        <ul className={styles.mobileLinks}>
          <li><Link href="/"      className={styles.mobileLink} onClick={closeAll}>Home</Link></li>
          <li><Link href="/posts" className={styles.mobileLink} onClick={closeAll}>Posts</Link></li>
          {/* Auth-only links — only rendered when the user is logged in */}
          {user && (
            <li><Link href="/my-posts"    className={styles.mobileLink} onClick={closeAll}>My Posts</Link></li>
          )}
          {user && (
            <li><Link href="/create-post" className={styles.mobileLink} onClick={closeAll}>+ New Post</Link></li>
          )}
        </ul>

        {/* Mobile auth section — login/logout buttons */}
        <div className={styles.mobileAuth}>
          {!loading && (
            user ? (
              <>
                <div className={styles.mobileUserInfo}>
                  <span className={styles.avatar}>{initial}</span>
                  <div>
                    <p className={styles.mobileUserName}>{user.fullname}</p>
                    <p className={styles.mobileUserEmail}>{user.email}</p>
                  </div>
                </div>
                <button
                  className={styles.btnLogout}
                  onClick={() => { logout(); closeAll(); }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login"    className={styles.btnOutline} onClick={closeAll}>Log in</Link>
                <Link href="/register" className={styles.btnPrimary} onClick={closeAll}>Sign up</Link>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
