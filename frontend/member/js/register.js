import { apiRequest } from "../../assets/js/api.js";
import { guardGuest, setAuthFromLoginResponse } from "../../assets/js/auth.js";
import { setMessage } from "../../assets/js/ui.js";

guardGuest("member", "./dashboard.html");

const form = document.querySelector("#registerForm");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("#message", "", "info");

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.role = "member";

  try {
    const response = await apiRequest("/api/auth/register", {
      method: "POST",
      auth: false,
      data: payload,
    });

    setAuthFromLoginResponse(response, "member");
    window.location.href = "./dashboard.html";
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
});
