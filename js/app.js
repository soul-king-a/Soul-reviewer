"use strict";

const loginForm = document.querySelector("#login-form");
const formMessage = document.querySelector("#form-message");
const detectRegionButton = document.querySelector("#detect-region");
const regionStatus = document.querySelector("#region-status");
const regionEyebrow = document.querySelector("#region-eyebrow");
const manualRegionPicker = document.querySelector("#manual-region-picker");
const regionPreview = document.querySelector("#region-preview");
const previewRegionButton = document.querySelector("#preview-region");
let selectedRegionKey = null;

function applyRegionTheme(regionKey, regionName) {
  document.body.dataset.region = regionKey;
  regionEyebrow.textContent = `${regionName} Region`;
  regionStatus.textContent = `Region selected: ${regionName}, Cameroon`;
}

function enableManualPreview(message) {
  regionStatus.textContent = message;
  manualRegionPicker.hidden = false;
}

detectRegionButton.addEventListener("click", async () => {
  detectRegionButton.disabled = true;
  detectRegionButton.closest(".region-picker").classList.add("is-detecting");
  regionStatus.textContent = "Checking your location…";

  try {
    const location = await LocalReviewerAuth.detectLocation();
    if (location.countryCode !== "cm") {
      window.location.assign("404.html");
      return;
    }
    if (!location.regionKey) {
      enableManualPreview(
        `Cameroon detected${location.administrativeArea ? ` (${location.administrativeArea})` : ""}, but its region could not be identified.`,
      );
      return;
    }

    selectedRegionKey = location.regionKey;
    applyRegionTheme(location.regionKey, location.regionName);
    loginForm.hidden = false;
  } catch (error) {
    enableManualPreview(`${error.message} You can preview a region below.`);
  } finally {
    detectRegionButton.disabled = false;
    detectRegionButton.closest(".region-picker").classList.remove("is-detecting");
  }
});

previewRegionButton.addEventListener("click", () => {
  const regionKey = regionPreview.value;
  const region = LocalReviewerAuth.regions[regionKey];
  if (!region) {
    regionStatus.textContent = "Choose a region to preview.";
    return;
  }

  selectedRegionKey = regionKey;
  applyRegionTheme(regionKey, region.name);
  loginForm.hidden = false;
  regionStatus.textContent = `Previewing ${region.name}. Your location is not verified.`;
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  detectRegionButton.disabled = true;
  formMessage.textContent = "Verifying your actual location…";
  const formData = new FormData(loginForm);

  try {
    const account = await LocalReviewerAuth.login(
      formData.get("email"),
      formData.get("password"),
      formData.get("remember") === "on",
      selectedRegionKey,
    );
    applyRegionTheme(account.regionKey, account.regionName);
    window.location.assign("reviewer.html");
  } catch (error) {
    formMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    detectRegionButton.disabled = false;
  }
});
