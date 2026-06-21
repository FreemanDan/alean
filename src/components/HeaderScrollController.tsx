"use client";

import { useEffect, useRef } from "react";

const HIDDEN_CLASS = "header-is-hidden";
const MENU_OPEN_CLASS = "header-menu-is-open";

export default function HeaderScrollController() {
  const lastScrollY = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    const clearHideTimer = () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };

    const showHeader = () => {
      root.classList.remove(HIDDEN_CLASS);
    };

    const hideHeader = () => {
      if (root.classList.contains(MENU_OPEN_CLASS)) {
        showHeader();
        return;
      }

      root.classList.add(HIDDEN_CLASS);
    };

    const scheduleHide = () => {
      clearHideTimer();

      if (window.scrollY <= 0 || root.classList.contains(MENU_OPEN_CLASS)) {
        return;
      }

      hideTimer.current = setTimeout(hideHeader, 2000);
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 0 || root.classList.contains(MENU_OPEN_CLASS)) {
        showHeader();
        clearHideTimer();
        lastScrollY.current = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY.current) {
        hideHeader();
        clearHideTimer();
      } else if (currentScrollY < lastScrollY.current) {
        showHeader();
        scheduleHide();
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearHideTimer();
      root.classList.remove(HIDDEN_CLASS);
    };
  }, []);

  return null;
}
