"use strict";

const userEmail = document.querySelector("#user-email");
const profileEmail = document.querySelector("#profile-email");
const profileName = document.querySelector("#profile-name");
const connectionStatus = document.querySelector("#connection-status");
const connectionDot = document.querySelector("#connection-dot");
const profileLocation = document.querySelector("#profile-location");
const locationCoordinates = document.querySelector("#location-coordinates");
const detectLocationButton = document.querySelector("#detect-location");
const signOutButton = document.querySelector("#sign-out");
const reviewForm = document.querySelector("#review-form");
const reviewFormFeedback = document.querySelector("#review-form-feedback");
const reviewSubmitButton = document.querySelector("#review-submit");
const reviewEmailInput = document.querySelector("#review-email");
let authenticated = false;
let authenticatedUserEmail = "";
const reportRecipient = "songivan54@gmail.com";

try {
  const currentUser = LocalReviewerAuth.getCurrentUser();
  if (!currentUser) {
    window.location.replace("index.html");
  } else {
    authenticatedUserEmail = currentUser;
    userEmail.textContent = currentUser;
    profileEmail.textContent = currentUser;
    reviewEmailInput.value = currentUser;
    const firstName = currentUser.split("@")[0] || "Reviewer";
    profileName.textContent = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    authenticated = true;
  }
} catch (error) {
  userEmail.textContent = error.message;
  profileEmail.textContent = "Session unavailable";
  profileName.textContent = "Reviewer";
  signOutButton.hidden = true;
}

function updateConnectionStatus() {
  const online = navigator.onLine;
  connectionStatus.textContent = online ? "Online" : "Offline";
  connectionDot.classList.toggle("is-online", online);
  connectionDot.classList.toggle("is-offline", !online);
}

if (authenticated) {
  updateConnectionStatus();
  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);

  reviewForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!reviewForm.reportValidity()) {
      return;
    }

    const formData = new FormData(reviewForm);
    const subject = `[Local Reviewer] ${formData.get("category")}: ${formData.get("title").toString().trim()}`;
    const body = [
      `Submitted by: ${formData.get("email").toString().trim()}`,
      `Signed-in account: ${authenticatedUserEmail}`,
      `Area: ${formData.get("category")}`,
      `Priority: ${formData.get("priority")}`,
      "",
      "Problem:",
      formData.get("problem").toString().trim(),
      "",
      "Expected result / suggested solution:",
      formData.get("solution").toString().trim(),
      "",
      "Steps to reproduce:",
      formData.get("steps").toString().trim() || "Not provided",
    ].join("\n");

    reviewFormFeedback.textContent =
      "Your email app should open with the report. Press Send there to deliver it.";
    window.location.href =
      `mailto:${reportRecipient}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
  });

  detectLocationButton.addEventListener("click", () => {
    profileLocation.textContent = "Finding location…";
    locationCoordinates.textContent = "";
    detectLocationButton.disabled = true;

    if (!navigator.geolocation) {
      profileLocation.textContent = "Geolocation is not supported by this browser.";
      detectLocationButton.disabled = false;
      return;
    }

    LocalReviewerAuth.detectLocation()
      .then((location) => {
        profileLocation.textContent = location.placeName || "Location found";
        locationCoordinates.textContent =
          `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
      })
      .catch((error) => {
        profileLocation.textContent = error.message;
      })
      .finally(() => {
        detectLocationButton.disabled = false;
      });
  });
}

signOutButton.addEventListener("click", () => {
  LocalReviewerAuth.logout();
  window.location.replace("index.html");
});
