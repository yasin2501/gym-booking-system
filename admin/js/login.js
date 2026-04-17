import { apiRequest } from "../../assets/js/api.js";
import { guardGuest, setAuthFromLoginResponse } from "../../assets/js/auth.js";
import { setMessage } from "../../assets/js/ui.js";

guardGuest("admin", "./dashboard.html");

const form = document.querySelector("#loginForm");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("#message", "", "info");

  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      auth: false,
      data: payload,
    });

    const auth = setAuthFromLoginResponse(response, "admin");
    if (auth.role !== "admin") {
      setMessage("#message", "Admin account required for this portal", "error");
      return;
    }

    window.location.href = "./dashboard.html";
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
});
