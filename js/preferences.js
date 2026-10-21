"use strict";

const themeStorageKey = "local-reviewer-theme";
const rootElement = document.documentElement;

function applyTheme(theme) {
  const isDark = theme === "dark";
  rootElement.dataset.theme = isDark ? "dark" : "light";
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.textContent = isDark ? "Light mode" : "Dark mode";
    button.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
    button.setAttribute("aria-pressed", String(isDark));
  });
}

applyTheme(localStorage.getItem(themeStorageKey) || "light");

document.addEventListener("DOMContentLoaded", () => {
  applyTheme(rootElement.dataset.theme);

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = rootElement.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem(themeStorageKey, nextTheme);
      applyTheme(nextTheme);
    });
  });

  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const passwordInput = document.getElementById(
        button.getAttribute("aria-controls"),
      );
      const isVisible = passwordInput.type === "text";
      passwordInput.type = isVisible ? "password" : "text";
      button.textContent = isVisible ? "Show" : "Hide";
      button.setAttribute("aria-label", `${isVisible ? "Show" : "Hide"} password`);
      button.setAttribute("aria-pressed", String(!isVisible));
    });
  });
});
