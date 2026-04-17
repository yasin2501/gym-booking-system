import { bindLogout, requireAuth } from "../../assets/js/auth.js";
import { getUser } from "../../assets/js/storage.js";

export function bootMemberPage(activeLinkId) {
  const ok = requireAuth(["member"]);
  if (!ok) return false;

  bindLogout();

  // Activate sidebar + topbar nav links
  document.querySelectorAll(`[data-nav='${activeLinkId}']`).forEach((el) => {
    el.classList.add("active");
  });

  const user = getUser();
  document.querySelectorAll("[data-user-name]").forEach((node) => {
    if (user) node.textContent = `${user.first_name || "Member"}`;
  });

  return true;
}
