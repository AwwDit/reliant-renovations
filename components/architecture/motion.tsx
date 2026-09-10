"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Native reveal transitions introduce project photographs in reading order. */
export function ArchitectureMotion() {
  const path = usePathname();
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-ar-reveal]");
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-ar-visible", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    elements.forEach((element) => {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.setAttribute("data-ar-pending", "true");
        observer.observe(element);
      }
    });
    const revealAll = () =>
      elements.forEach((element) =>
        element.setAttribute("data-ar-visible", "true"),
      );
    preference.addEventListener("change", revealAll);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", revealAll);
      elements.forEach((element) => element.removeAttribute("data-ar-pending"));
    };
  }, [path]);
  return null;
}
