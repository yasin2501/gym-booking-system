import { apiRequest } from "../../assets/js/api.js";
import { guardGuest, setAuthFromLoginResponse } from "../../assets/js/auth.js";
import { setMessage } from "../../assets/js/ui.js";

guardGuest("member", "./dashboard.html");

const form = document.querySelector("#loginForm");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("#message", "", "info");

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      auth: false,
      data: payload,
    });

    const auth = setAuthFromLoginResponse(response, "member");

    if (auth.role !== "member") {
      setMessage("#message", "This login page is for members. Use your role portal.", "error");
      return;
    }

    window.location.href = "./dashboard.html";
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
});
