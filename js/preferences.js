"use strict";

const themeStorageKey = "local-reviewer-theme";
const rootElement = document.documentElement;

function applyTheme(theme) {
  const isDark = theme === "dark";
  rootElement.dataset.theme = isDark ? "dark" : "light";
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const label = button.querySelector("[data-theme-label]");
    const icon = button.querySelector("i");
    if (label) {
      label.textContent = isDark ? "Light mode" : "Dark mode";
    }
    if (icon) {
      icon.className = `bi ${isDark ? "bi-sun" : "bi-moon-stars"}`;
    }
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
      const label = button.querySelector("span");
      const icon = button.querySelector("i");
      if (label) {
        label.textContent = isVisible ? "Show" : "Hide";
      }
      if (icon) {
        icon.className = `bi ${isVisible ? "bi-eye" : "bi-eye-slash"}`;
      }
      button.setAttribute("aria-label", `${isVisible ? "Show" : "Hide"} password`);
      button.setAttribute("aria-pressed", String(!isVisible));
    });
  });
});
