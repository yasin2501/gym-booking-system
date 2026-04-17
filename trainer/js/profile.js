import { apiRequest } from "../../assets/js/api.js";
import { getRole, getToken, getUser, saveSession } from "../../assets/js/storage.js";
import { setMessage } from "../../assets/js/ui.js";
import { bootTrainerPage } from "./common.js";

const form = document.querySelector("#profileForm");

if (bootTrainerPage("profile")) {
  fillForm();
}

function fillForm() {
  if (!form) return;
  const user = getUser() || {};
  form.first_name.value = user.first_name || "";
  form.last_name.value = user.last_name || "";
  form.email.value = user.email || "";
  form.phone.value = user.phone || "";
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const currentUser = getUser() || {};
  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    // Adjust if your backend profile update route differs.
    const response = await apiRequest(`/api/users/${currentUser.user_id}`, {
      method: "PUT",
      data: payload,
    });

    const user = response?.data || { ...currentUser, ...payload };
    saveSession({ token: getToken(), role: getRole(), user });
    setMessage("#message", "Profile updated", "success");
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
});
