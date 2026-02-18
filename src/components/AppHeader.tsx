"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AppHeader.module.css";
import Button from "./ui/Button";
import { usePortfolioStore } from "@/store/usePortfolioStore";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Settings", href: "/settings" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const openAddModal = usePortfolioStore((state) => state.openAddModal);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            DLTA
          </Link>
          <span className={styles.tagline}>Delta-grade crypto clarity</span>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.active : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.actions}>
          <Button variant="outline" size="sm" onClick={openAddModal}>
            Add Purchase
          </Button>
          <Link href="/settings" className={`${styles.actionLink} ${styles.mobileOnly}`}>
            Settings
          </Link>
        </div>
      </div>
    </header>
  );
}
