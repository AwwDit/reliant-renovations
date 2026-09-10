"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function CraftMotion() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-rf-visible", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -25px 0px" },
    );
    const items = document.querySelectorAll<HTMLElement>("[data-rf-reveal]");
    items.forEach((item) => {
      if (item.getBoundingClientRect().top > window.innerHeight - 25) {
        item.setAttribute("data-rf-pending", "true");
        observer.observe(item);
      }
    });
    return () => {
      observer.disconnect();
      items.forEach((item) => item.removeAttribute("data-rf-pending"));
    };
  }, [pathname]);
  return null;
}
