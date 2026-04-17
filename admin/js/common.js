import { bindLogout, requireAuth } from "../../assets/js/auth.js";
import { getUser } from "../../assets/js/storage.js";

export function bootAdminPage(activeLinkId) {
  const ok = requireAuth(["admin"]);
  if (!ok) return false;

  bindLogout();

  // Activate sidebar + topbar nav links
  document.querySelectorAll(`[data-nav='${activeLinkId}']`).forEach((el) => {
    el.classList.add("active");
  });

  const user = getUser();
  document.querySelectorAll("[data-user-name]").forEach((node) => {
    if (user) node.textContent = user.first_name || "Admin";
  });

  return true;
}

export async function loadCollection(path, selector, renderer, emptyText = "No records") {
  const { apiRequest } = await import("../../assets/js/api.js");
  const { renderList, setMessage } = await import("../../assets/js/ui.js");
  try {
    const response = await apiRequest(path);
    const data = response?.data;
    const list = Array.isArray(data)
      ? data
      : data?.users || data?.trainers || data?.classes || data?.bookings || data?.payments || [];
    renderList(selector, list, renderer, emptyText);
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}
