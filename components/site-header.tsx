"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, X } from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { site } from "@/lib/site";
import "./craft/navigation.css";

const links = [
  ["Residential Renovations", "/residential"],
  ["Commercial Construction", "/commercial"],
  ["Projects", "/projects"],
  ["About Reliant", "/about"],
  ["Contact", "/contact"],
] as const;

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <header className="rf-nav-header">
      <Link
        href="/"
        aria-label="Reliant Renovations home"
        className="rf-nav-brand"
      >
        <Image
          src="/images/brand/reliant-color-transparent.png"
          alt="Reliant Renovations Inc."
          width={172}
          height={122}
          loading="eager"
          className="rf-nav-logo"
        />
      </Link>
      <p className="rf-nav-description">
        Commercial Construction
        <br />
        Residential Renovations
      </p>
      <nav className="rf-nav-desktop" aria-label="Main navigation">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? "page" : undefined}
            className={`rf-nav-link${href === "/residential" || href === "/commercial" ? " rf-nav-division" : ""}`}
          >
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="rf-nav-spine-bottom">
        <p>
          New York City, Long Island, Westchester and select surrounding
          markets.
        </p>
        <nav className="rf-nav-information" aria-label="Site information">
          <Link href="/privacy">Privacy</Link>
          <Link href="/admin">Owner login</Link>
          <a href={site.instagram} target="_blank" rel="noopener noreferrer">
            Instagram <ArrowUpRight size={12} aria-hidden="true" />
          </a>
        </nav>
        <div className="rf-nav-appearance">
          <span>Appearance</span>
          <ThemeToggle />
        </div>
      </div>
      <div className="rf-nav-mobile-actions">
        <Link href="/contact" className="rf-nav-mobile-contact">
          Contact <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger
            className="rf-nav-menu-trigger"
            aria-label="Open navigation"
          >
            <span>Menu</span>
            <span className="rf-nav-menu-lines" aria-hidden="true">
              <i />
              <i />
            </span>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="rf-nav-menu-shade" />
            <Dialog.Content className="rf-nav-menu-panel">
              <div className="rf-nav-panel-heading">
                <Dialog.Title>Reliant Renovations</Dialog.Title>
                <Dialog.Close
                  className="rf-nav-close"
                  aria-label="Close navigation"
                >
                  <X size={24} aria-hidden="true" />
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">
                Main navigation and site information.
              </Dialog.Description>
              <nav
                className="rf-nav-mobile-links"
                aria-label="Mobile navigation"
              >
                {[["Home", "/"], ...links].map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={
                      (href === "/" ? path === "/" : active(href))
                        ? "page"
                        : undefined
                    }
                    onClick={() => setOpen(false)}
                  >
                    <span>{label}</span>
                    <ArrowUpRight size={22} aria-hidden="true" />
                  </Link>
                ))}
              </nav>
              <div className="rf-nav-mobile-bottom">
                <span>
                  New York City, Long Island, Westchester and select surrounding
                  markets.
                </span>
                <ThemeToggle />
              </div>
              <nav
                className="rf-nav-information"
                aria-label="Mobile site information"
              >
                <Link href="/privacy" onClick={() => setOpen(false)}>
                  Privacy
                </Link>
                <Link href="/admin" onClick={() => setOpen(false)}>
                  Owner login
                </Link>
                <a
                  href={site.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram <ArrowUpRight size={12} aria-hidden="true" />
                </a>
              </nav>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <noscript>
          <style>{`.rf-nav-menu-trigger{display:none!important}.rf-nav-nojs{display:block!important}`}</style>
        </noscript>
        <details className="rf-nav-nojs">
          <summary>Menu</summary>
          <nav aria-label="Navigation without JavaScript">
            {[["Home", "/"], ...links].map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
            <Link href="/privacy">Privacy</Link>
            <Link href="/admin">Owner login</Link>
            <a href={site.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          </nav>
        </details>
      </div>
    </header>
  );
}
