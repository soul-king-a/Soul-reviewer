"use strict";

(() => {
  const usersKey = "local-reviewer-users";
  const sessionKey = "local-reviewer-user";
  const rememberedSessionKey = "local-reviewer-remembered-user";
  const iterations = 150000;
  const regions = {
    adamawa: {
      name: "Adamawa",
      isoCode: "CM-AD",
      aliases: ["adamawa", "adamaoua"],
    },
    centre: {
      name: "Centre",
      isoCode: "CM-CE",
      aliases: ["centre", "central"],
    },
    east: {
      name: "East",
      isoCode: "CM-ES",
      aliases: ["east", "est"],
    },
    "far-north": {
      name: "Far North",
      isoCode: "CM-EN",
      aliases: ["far north", "extreme north", "extreme nord", "extrême nord"],
    },
    littoral: {
      name: "Littoral",
      isoCode: "CM-LT",
      aliases: ["littoral"],
    },
    north: {
      name: "North",
      isoCode: "CM-NO",
      aliases: ["north", "nord"],
    },
    northwest: {
      name: "Northwest",
      isoCode: "CM-NW",
      aliases: ["northwest", "north west", "nord ouest"],
    },
    west: {
      name: "West",
      isoCode: "CM-OU",
      aliases: ["west", "ouest"],
    },
    south: {
      name: "South",
      isoCode: "CM-SU",
      aliases: ["south", "sud"],
    },
    southwest: {
      name: "Southwest",
      isoCode: "CM-SW",
      aliases: ["southwest", "south west", "sud ouest"],
    },
  };

  function normalizeRegionName(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z]+/g, " ")
      .replace(/^region\s+/, "")
      .replace(/^(?:(?:de|du|des)\s+)?(?:la|le|les|l)\s+/, "")
      .replace(/^(?:de|du|des)\s+/, "")
      .replace(/\s+region$/, "")
      .trim();
  }

  function getRegionKey(address) {
    const isoCode = address["ISO3166-2-lvl4"];
    const regionByIsoCode = Object.entries(regions).find(
      ([, region]) => region.isoCode.toLowerCase() === isoCode?.toLowerCase(),
    );
    if (regionByIsoCode) {
      return regionByIsoCode[0];
    }

    const candidates = [address.state, address.region, address.province]
      .filter((value) => typeof value === "string")
      .map(normalizeRegionName);

    return (
      Object.entries(regions).find(([, region]) =>
        candidates.some((candidate) =>
          region.aliases.some((alias) => normalizeRegionName(alias) === candidate),
        ),
      )?.[0] ?? null
    );
  }

  function readUsers() {
    const storedUsers = localStorage.getItem(usersKey);
    if (!storedUsers) {
      return {};
    }

    let users;
    try {
      users = JSON.parse(storedUsers);
    } catch {
      throw new Error(
        "Saved account data is unreadable. Clear this app's local data and register again.",
      );
    }

    if (users === null || typeof users !== "object" || Array.isArray(users)) {
      throw new Error(
        "Saved account data is invalid. Clear this app's local data and register again.",
      );
    }
    return users;
  }

  function getCrypto() {
    if (!window.crypto?.subtle) {
      throw new Error(
        "Secure browser storage is unavailable. Open this app on localhost or HTTPS.",
      );
    }
    return window.crypto;
  }

  function toBase64(bytes) {
    return btoa(String.fromCharCode(...new Uint8Array(bytes)));
  }

  function fromBase64(value) {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  }

  async function hashPassword(password, salt) {
    const crypto = getCrypto();
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    return crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations },
      key,
      256,
    );
  }

  function passwordsMatch(first, second) {
    if (first.length !== second.length) {
      return false;
    }
    let difference = 0;
    for (let index = 0; index < first.length; index += 1) {
      difference |= first[index] ^ second[index];
    }
    return difference === 0;
  }

  function normalizeEmail(email) {
    return email.trim().toLowerCase();
  }

  function getCoordinates() {
    if (!navigator.geolocation) {
      return Promise.reject(
        new Error("Location access is not supported by this browser."),
      );
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve(coords),
        (error) => {
          if (error.code === 1) {
            reject(new Error("Location permission is required to use this app."));
          } else if (error.code === 2) {
            reject(new Error("Your location is unavailable. Please try again."));
          } else if (error.code === 3) {
            reject(new Error("Location detection timed out. Please try again."));
          } else {
            reject(new Error("Unable to detect your location."));
          }
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 },
      );
    });
  }

  async function lookupLocation(latitude, longitude) {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(latitude),
      lon: String(longitude),
      zoom: "10",
      addressdetails: "1",
    });

    let response;
    try {
      response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
        { headers: { Accept: "application/json" } },
      );
    } catch {
      throw new Error("Location check failed. Check your connection and try again.");
    }

    if (!response.ok) {
      throw new Error("Location check failed. Please try again later.");
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("Location service returned an invalid response.");
    }

    if (!result?.address || typeof result.address !== "object") {
      throw new Error("Your country could not be verified from this location.");
    }

    const address = result.address;
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.hamlet;

    const regionKey = getRegionKey(address);
    return {
      countryCode:
        typeof address.country_code === "string"
          ? address.country_code.toLowerCase()
          : "",
      city,
      country: address.country,
      placeName: [city, address.country].filter(Boolean).join(", "),
      latitude,
      longitude,
      regionKey,
      regionName: regionKey ? regions[regionKey].name : null,
      administrativeArea:
        address.state ||
        address.region ||
        address.province ||
        address["ISO3166-2-lvl4"] ||
        "",
    };
  }

  async function detectLocation() {
    const coords = await getCoordinates();
    return lookupLocation(coords.latitude, coords.longitude);
  }

  async function ensureCameroon() {
    const location = await detectLocation();
    if (location.countryCode !== "cm") {
      window.location.assign("404.html");
      throw new Error("You must be located in Cameroon to sign in or register.");
    }
    if (!location.regionKey) {
      throw new Error(
        `Cameroon detected, but the region could not be identified${location.administrativeArea ? ` from "${location.administrativeArea}"` : ""}. Please try again.`,
      );
    }
    return location;
  }

  function saveSession(email, remember) {
    sessionStorage.removeItem(sessionKey);
    localStorage.removeItem(rememberedSessionKey);
    if (remember) {
      localStorage.setItem(rememberedSessionKey, email);
    } else {
      sessionStorage.setItem(sessionKey, email);
    }
  }

  async function register(email, password) {
    await ensureCameroon();
    const normalizedEmail = normalizeEmail(email);
    const users = readUsers();
    if (Object.hasOwn(users, normalizedEmail)) {
      throw new Error("An account with this email already exists.");
    }

    const crypto = getCrypto();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordHash = await hashPassword(password, salt);
    users[normalizedEmail] = {
      salt: toBase64(salt),
      passwordHash: toBase64(passwordHash),
    };
    localStorage.setItem(usersKey, JSON.stringify(users));
    saveSession(normalizedEmail, false);
    return normalizedEmail;
  }

  async function login(email, password, remember, expectedRegionKey) {
    const location = await ensureCameroon();
    if (location.regionKey !== expectedRegionKey) {
      throw new Error(
        "Your detected region changed. Detect your region again before signing in.",
      );
    }
    const normalizedEmail = normalizeEmail(email);
    const user = readUsers()[normalizedEmail];
    if (
      !user ||
      typeof user.salt !== "string" ||
      typeof user.passwordHash !== "string"
    ) {
      throw new Error("No local account was found for that email and password.");
    }

    let salt;
    let expectedHash;
    try {
      salt = fromBase64(user.salt);
      expectedHash = fromBase64(user.passwordHash);
    } catch {
      throw new Error(
        "Saved account data is invalid. Clear this app's local data and register again.",
      );
    }

    const actualHash = new Uint8Array(await hashPassword(password, salt));
    if (!passwordsMatch(actualHash, expectedHash)) {
      throw new Error("No local account was found for that email and password.");
    }

    saveSession(normalizedEmail, remember);
    return {
      email: normalizedEmail,
      regionKey: location.regionKey,
      regionName: location.regionName,
    };
  }

  function getCurrentUser() {
    const email =
      sessionStorage.getItem(sessionKey) ??
      localStorage.getItem(rememberedSessionKey);
    if (!email) {
      return null;
    }
    if (!Object.hasOwn(readUsers(), email)) {
      throw new Error("Your local session is invalid. Please sign in again.");
    }
    return email;
  }

  function logout() {
    sessionStorage.removeItem(sessionKey);
    localStorage.removeItem(rememberedSessionKey);
  }

  window.LocalReviewerAuth = Object.freeze({
    getCurrentUser,
    detectLocation,
    ensureCameroon,
    regions,
    login,
    logout,
    register,
  });
})();
