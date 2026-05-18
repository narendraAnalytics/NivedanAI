"use client";

import { useEffect } from "react";

export default function ScrollRevealSetup() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".ni-reveal").forEach((el) => {
      if (!el.classList.contains("in")) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return null;
}
