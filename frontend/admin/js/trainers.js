import { apiRequest } from "../../assets/js/api.js";
import { renderList, setMessage } from "../../assets/js/ui.js";
import { bootAdminPage } from "./common.js";

if (bootAdminPage("trainers")) {
  loadTrainers();
}

const form = document.querySelector("#trainerForm");
form.addEventListener("submit", createTrainer);

async function loadTrainers() {
  try {
    const response = await apiRequest("/api/trainers", { auth: false });
    const trainers = response?.data?.trainers || response?.trainers || [];
    renderList(
      "#trainerList",
      trainers,
      (t) => `
        <div class="item">
          <strong>${t.trainer_id}</strong> - ${t.first_name || ""} ${t.last_name || ""}<br>
          Rate: RM ${t.hourly_rate || 0}
          <div class="row" style="margin-top: 8px;">
            <button class="danger" data-delete-trainer="${t.trainer_id}">Deactivate</button>
          </div>
        </div>
      `
    );

    document.querySelectorAll("[data-delete-trainer]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await apiRequest(`/api/trainers/${btn.dataset.deleteTrainer}`, { method: "DELETE" });
        setMessage("#message", "Trainer deactivated", "success");
        loadTrainers();
      });
    });
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}

async function createTrainer(event) {
  event.preventDefault();
  try {
    const raw = Object.fromEntries(new FormData(form).entries());
    const data = {
      hourly_rate: Number(raw.hourly_rate),
      bio: raw.bio || undefined,
      specializations: raw.specializations || undefined,
      certifications: raw.certifications || undefined,
      phone: raw.phone || undefined,
    };

    if (raw.user_id) {
      data.user_id = Number(raw.user_id);
    } else {
      data.first_name = raw.first_name || "";
      data.last_name = raw.last_name || "";
      data.email = raw.email || "";
      data.password = raw.password || "";
    }

    const response = await apiRequest("/api/trainers", { method: "POST", data });
    const createdNewUser = response?.data?.created_new_user;
    setMessage(
      "#message",
      createdNewUser ? "Trainer + new user account created" : "Trainer created",
      "success"
    );
    form.reset();
    loadTrainers();
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}
