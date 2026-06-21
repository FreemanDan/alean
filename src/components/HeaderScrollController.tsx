"use client";

import { useEffect, useRef } from "react";

const HIDDEN_CLASS = "header-is-hidden";
const MENU_OPEN_CLASS = "header-menu-is-open";

/* Окно, в котором scroll-событие считается следствием реального user input, а не snap-settle */
const USER_INPUT_WINDOW_MS = 700;
/* Игнорируем микро-сдвиги scrollY от Lenis/ScrollTrigger между кадрами */
const SCROLL_DELTA_THRESHOLD = 4;
const WHEEL_DELTA_THRESHOLD = 4;
const TOUCH_DELTA_THRESHOLD = 4;

type UserScrollDirection = "down" | "up";

export default function HeaderScrollController() {
  const lastScrollY = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserInputAt = useRef(0);
  const lastUserDirection = useRef<UserScrollDirection | null>(null);
  const lastTouchY = useRef<number | null>(null);

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

    const registerUserIntent = (direction: UserScrollDirection) => {
      lastUserInputAt.current = performance.now();
      lastUserDirection.current = direction;
    };

    const hasRecentUserInput = () =>
      performance.now() - lastUserInputAt.current <= USER_INPUT_WINDOW_MS;

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < WHEEL_DELTA_THRESHOLD) {
        return;
      }

      registerUserIntent(event.deltaY > 0 ? "down" : "up");
    };

    const handleTouchStart = (event: TouchEvent) => {
      lastTouchY.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const currentTouchY = event.touches[0]?.clientY;

      if (currentTouchY == null || lastTouchY.current == null) {
        return;
      }

      const touchDelta = currentTouchY - lastTouchY.current;

      if (Math.abs(touchDelta) < TOUCH_DELTA_THRESHOLD) {
        return;
      }

      /*
       * Палец вверх → контент вниз (intent down).
       * Палец вниз → контент вверх (intent up).
       */
      registerUserIntent(touchDelta < 0 ? "down" : "up");
      lastTouchY.current = currentTouchY;
    };

    const handleTouchEnd = () => {
      lastTouchY.current = null;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "PageDown":
        case "ArrowDown":
        case " ":
        case "End":
          registerUserIntent("down");
          break;
        case "PageUp":
        case "ArrowUp":
        case "Home":
          registerUserIntent("up");
          break;
        default:
          break;
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 0 || root.classList.contains(MENU_OPEN_CLASS)) {
        showHeader();
        clearHideTimer();
        lastScrollY.current = currentScrollY;
        return;
      }

      const scrollDelta = currentScrollY - lastScrollY.current;

      if (Math.abs(scrollDelta) < SCROLL_DELTA_THRESHOLD) {
        lastScrollY.current = currentScrollY;
        return;
      }

      /*
       * Programmatic snap-settle ScrollStage/Lenis может менять scrollY без свежего
       * wheel/touch/key input — в этом случае header не трогаем.
       */
      if (!hasRecentUserInput() || lastUserDirection.current == null) {
        lastScrollY.current = currentScrollY;
        return;
      }

      if (lastUserDirection.current === "down") {
        hideHeader();
        clearHideTimer();
      } else {
        showHeader();
        scheduleHide();
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
      clearHideTimer();
      root.classList.remove(HIDDEN_CLASS);
    };
  }, []);

  return null;
}
