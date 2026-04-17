import { apiRequest } from "../../assets/js/api.js";
import { getUser, saveSession, getToken, getRole } from "../../assets/js/storage.js";
import { setMessage } from "../../assets/js/ui.js";
import { bootMemberPage } from "./common.js";

const form = document.querySelector("#profileForm");

if (bootMemberPage("profile")) {
  initProfile();
}

function initProfile() {
  if (!form) return;
  const user = getUser() || {};
  form.first_name.value = user.first_name || "";
  form.last_name.value = user.last_name || "";
  form.email.value = user.email || "";
  form.phone.value = user.phone || "";
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("#message", "", "info");

  const currentUser = getUser() || {};
  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    // Adjust route if your backend uses a different profile endpoint.
    const response = await apiRequest(`/api/users/${currentUser.user_id}`, {
      method: "PUT",
      data: payload,
    });

    const updatedUser = response?.data || { ...currentUser, ...payload };
    saveSession({ token: getToken(), role: getRole(), user: updatedUser });
    setMessage("#message", "Profile updated", "success");
  } catch (error) {
    setMessage("#message", `Update failed: ${error.message}`, "error");
  }
});
