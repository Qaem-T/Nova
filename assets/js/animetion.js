"use strict";

/* =========================================================
   NOVA — small scroll-driven animations
   1. Auto-hide the nav bar on scroll down, show it on scroll up
      (only visually active on mobile, see nav.nav-hidden override
      in Responsive.css for the ≥768px breakpoint)
   2. Fade/slide-in reveal for elements already in the page
      (hero text, static category cards). Elements that App.js
      creates dynamically — product cards, popular offer cards —
      register themselves for the same effect from App.js directly.
========================================================= */

// ---------- 1. Auto-hide nav on scroll ----------
const nav = document.querySelector("nav");
let lastScrollY = window.scrollY;

window.addEventListener(
  "scroll",
  () => {
    if (!nav) return;
    const currentScrollY = window.scrollY;

    if (currentScrollY <= 0) {
      nav.classList.remove("nav-hidden");
    } else if (currentScrollY > lastScrollY) {
      nav.classList.add("nav-hidden");
    } else {
      nav.classList.remove("nav-hidden");
    }

    lastScrollY = currentScrollY;
  },
  { passive: true }
);

// ---------- 2. Reveal elements that exist at initial page load ----------
const initialRevealElements = document.querySelectorAll(".textObserv, .cardObserv");

// observeRevealElements() is defined in App.js, which is loaded before this file
if (typeof observeRevealElements === "function") {
  observeRevealElements(initialRevealElements);
} else {
  initialRevealElements.forEach((el) => el.classList.add("visible"));
}
