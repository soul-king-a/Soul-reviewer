"use strict";

const registerForm = document.querySelector("#register-form");
const formMessage = document.querySelector("#form-message");
const detectRegionButton = document.querySelector("#detect-register-region");
const regionStatus = document.querySelector("#register-region-status");
const manualRegionPicker = document.querySelector("#manual-register-region-picker");
const regionPreview = document.querySelector("#register-region-preview");
const previewRegionButton = document.querySelector("#preview-register-region");

function showManualRegionPreview(message) {
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
      showManualRegionPreview(
        `Cameroon detected${location.administrativeArea ? ` (${location.administrativeArea})` : ""}, but its region could not be identified.`,
      );
      return;
    }

    document.body.dataset.region = location.regionKey;
    regionStatus.textContent = `Region detected: ${location.regionName}, Cameroon`;
  } catch (error) {
    showManualRegionPreview(`${error.message} You can preview a region below.`);
  } finally {
    detectRegionButton.disabled = false;
    detectRegionButton.closest(".region-picker").classList.remove("is-detecting");
  }
});

previewRegionButton.addEventListener("click", () => {
  const region = LocalReviewerAuth.regions[regionPreview.value];
  if (!region) {
    regionStatus.textContent = "Choose a region to preview.";
    return;
  }

  document.body.dataset.region = regionPreview.value;
  regionStatus.textContent = `Previewing ${region.name}. Your location is not verified.`;
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const formData = new FormData(registerForm);
  const password = formData.get("password");
  if (password !== formData.get("confirm-password")) {
    formMessage.textContent = "Passwords do not match.";
    return;
  }

  const submitButton = registerForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  detectRegionButton.disabled = true;
  formMessage.textContent = "Verifying your location…";
  try {
    await LocalReviewerAuth.register(formData.get("email"), password);
    window.location.assign("reviewer.html");
  } catch (error) {
    formMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    detectRegionButton.disabled = false;
  }
});
