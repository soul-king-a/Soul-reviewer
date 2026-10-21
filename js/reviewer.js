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
const editProfileButton = document.querySelector("#edit-profile");
const viewReportsButton = document.querySelector("#view-reports");
const profileDialog = document.querySelector("#profile-dialog");
const profileForm = document.querySelector("#profile-form");
const displayNameInput = document.querySelector("#display-name");
const profileFeedback = document.querySelector("#profile-feedback");
const reportsDialog = document.querySelector("#reports-dialog");
const reportHistory = document.querySelector("#report-history");
const reportsEmpty = document.querySelector("#reports-empty");
const reportsFeedback = document.querySelector("#reports-feedback");
const clearReportsButton = document.querySelector("#clear-reports");
let authenticated = false;
let authenticatedUserEmail = "";
const reportRecipient = "songivan54@gmail.com";

function profileStorageKey(email) {
  return `local-reviewer-profile-name:${email}`;
}

function reportsStorageKey(email) {
  return `local-reviewer-reports:${email}`;
}

function defaultDisplayName(email) {
  const name = email.split("@")[0] || "Reviewer";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function setDisplayName(name) {
  const normalizedName = name.trim() || defaultDisplayName(authenticatedUserEmail);
  profileName.textContent = normalizedName;
  document.querySelector(".avatar").textContent =
    Array.from(normalizedName)[0]?.toLocaleUpperCase() || "R";
}

function readSavedReports() {
  let reports;
  try {
    reports = JSON.parse(localStorage.getItem(reportsStorageKey(authenticatedUserEmail)) || "[]");
  } catch {
    throw new Error("Saved report history is unreadable. Clear the history to continue.");
  }
  if (!Array.isArray(reports)) {
    throw new Error("Saved report history is invalid. Clear the history to continue.");
  }
  return reports.filter(
    (report) =>
      report &&
      typeof report.id === "string" &&
      typeof report.title === "string" &&
      typeof report.email === "string" &&
      typeof report.category === "string" &&
      typeof report.priority === "string" &&
      typeof report.problem === "string" &&
      typeof report.solution === "string" &&
      typeof report.steps === "string" &&
      typeof report.createdAt === "string",
  );
}

function renderReportHistory() {
  reportHistory.replaceChildren();
  reportsFeedback.textContent = "";

  try {
    const reports = readSavedReports();
    reportsEmpty.hidden = reports.length > 0;
    clearReportsButton.disabled = reports.length === 0;

    reports.forEach((report) => {
      const item = document.createElement("li");
      const header = document.createElement("div");
      const title = document.createElement("h3");
      const details = document.createElement("p");
      const status = document.createElement("span");
      const disclosure = document.createElement("details");
      const disclosureSummary = document.createElement("summary");
      const content = document.createElement("dl");

      title.textContent = report.title;
      details.textContent =
        `${report.category} · ${report.priority} priority · ` +
        new Date(report.createdAt).toLocaleString();
      status.className = "report-history-status";
      status.textContent = "Email prepared · delivery not confirmed";
      disclosureSummary.textContent = "View report details";
      [
        ["Contact email", report.email],
        ["Problem", report.problem],
        ["Expected result", report.solution],
        ["Steps to reproduce", report.steps || "Not provided"],
      ].forEach(([label, value]) => {
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        content.append(term, description);
      });
      disclosure.append(disclosureSummary, content);
      header.className = "report-history-heading";
      header.append(title);
      item.append(header, details, status, disclosure);
      reportHistory.append(item);
    });
  } catch (error) {
    reportsEmpty.hidden = true;
    clearReportsButton.disabled = false;
    reportsFeedback.textContent = error.message;
  }
}

try {
  const currentUser = LocalReviewerAuth.getCurrentUser();
  if (!currentUser) {
    window.location.replace("index.html");
  } else {
    authenticatedUserEmail = currentUser;
    userEmail.textContent = currentUser;
    profileEmail.textContent = currentUser;
    reviewEmailInput.value = currentUser;
    setDisplayName(localStorage.getItem(profileStorageKey(currentUser)) || defaultDisplayName(currentUser));
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
    const report = {
      id: window.crypto.randomUUID(),
      title: formData.get("title").toString().trim(),
      email: formData.get("email").toString().trim(),
      category: formData.get("category").toString(),
      priority: formData.get("priority").toString(),
      problem: formData.get("problem").toString().trim(),
      solution: formData.get("solution").toString().trim(),
      steps: formData.get("steps").toString().trim(),
      createdAt: new Date().toISOString(),
    };
    const subject = `[Local Reviewer] ${report.category}: ${report.title}`;
    const body = [
      `Submitted by: ${report.email}`,
      `Signed-in account: ${authenticatedUserEmail}`,
      `Area: ${report.category}`,
      `Priority: ${report.priority}`,
      "",
      "Problem:",
      report.problem,
      "",
      "Expected result / suggested solution:",
      report.solution,
      "",
      "Steps to reproduce:",
      report.steps || "Not provided",
    ].join("\n");

    let historySaved = true;
    try {
      const reports = readSavedReports();
      reports.unshift(report);
      localStorage.setItem(
        reportsStorageKey(authenticatedUserEmail),
        JSON.stringify(reports.slice(0, 50)),
      );
    } catch (error) {
      historySaved = false;
      reviewFormFeedback.textContent =
        `${error.message} Your email app will still open, but this report will not appear in local history.`;
    }

    if (historySaved) {
      reviewFormFeedback.textContent =
        "Report saved in this browser. Your email app should open; press Send there to deliver it.";
    }
    window.location.href =
      `mailto:${reportRecipient}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
  });

  editProfileButton.addEventListener("click", () => {
    profileFeedback.textContent = "";
    displayNameInput.value = profileName.textContent;
    profileDialog.showModal();
    displayNameInput.focus();
  });

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const displayName = displayNameInput.value.trim();
    if (!displayName) {
      displayNameInput.setCustomValidity("Enter a display name.");
      displayNameInput.reportValidity();
      return;
    }
    displayNameInput.setCustomValidity("");

    try {
      localStorage.setItem(profileStorageKey(authenticatedUserEmail), displayName);
      setDisplayName(displayName);
      profileDialog.close();
    } catch {
      profileFeedback.textContent =
        "Could not save the profile in this browser. Check available storage and try again.";
    }
  });

  viewReportsButton.addEventListener("click", () => {
    renderReportHistory();
    reportsDialog.showModal();
  });

  clearReportsButton.addEventListener("click", () => {
    if (!window.confirm("Clear the report history saved for this account in this browser?")) {
      return;
    }
    try {
      localStorage.removeItem(reportsStorageKey(authenticatedUserEmail));
      renderReportHistory();
    } catch {
      reportsFeedback.textContent =
        "Could not clear the saved report history. Please try again.";
    }
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
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
