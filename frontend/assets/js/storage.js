const TOKEN_KEY = "gym_token";
const ROLE_KEY = "gym_role";
const USER_KEY = "gym_user";

export function saveSession({ token, role, user }) {
  localStorage.setItem(TOKEN_KEY, token || "");
  localStorage.setItem(ROLE_KEY, role || "");
  localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY) || "";
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
