import { ROLE_LOGIN_PAGES } from "./config.js";
import { clearSession, getRole, getToken, saveSession } from "./storage.js";

export function setAuthFromLoginResponse(payload, fallbackRole = "member") {
  const token = payload?.data?.accessToken || payload?.accessToken || "";
  const user = payload?.data?.user || payload?.user || null;
  const role = user?.role || fallbackRole;

  if (!token) {
    throw new Error("Login response does not include access token");
  }

  saveSession({ token, role, user });
  return { token, role, user };
}

export function guardGuest(role, dashboardPath = "./dashboard.html") {
  const token = getToken();
  const currentRole = getRole();
  if (token && currentRole === role) {
    window.location.href = dashboardPath;
  }
}

export function requireAuth(allowedRoles = []) {
  const token = getToken();
  const role = getRole();

  if (!token) {
    const fallbackRole = allowedRoles[0] || "member";
    window.location.href = ROLE_LOGIN_PAGES[fallbackRole];
    return false;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const redirectRole = role || allowedRoles[0];
    window.location.href = ROLE_LOGIN_PAGES[redirectRole] || ROLE_LOGIN_PAGES.member;
    return false;
  }

  return true;
}

export function bindLogout(buttonSelector = "[data-logout]") {
  document.querySelectorAll(buttonSelector).forEach((btn) => {
    btn.addEventListener("click", () => {
      clearSession();
      window.location.href = "../index.html";
    });
  });
}
