import { apiRequest } from "../../assets/js/api.js";
import { getUser } from "../../assets/js/storage.js";
import { renderList } from "../../assets/js/ui.js";
import { bootTrainerPage } from "./common.js";

if (bootTrainerPage("dashboard")) {
  loadDashboard();
}

async function loadDashboard() {
  try {
    const user = getUser() || {};
    const response = await apiRequest("/api/classes", { auth: false });
    const classes = response?.data?.classes || response?.classes || [];

    // Placeholder filtering logic. Adjust if backend exposes /api/trainers/my-classes.
    const myClasses = classes.filter((c) => c.trainer_user_id === user.user_id || c.trainer_id === user.trainer_id);

    renderList(
      "#summary",
      [
        { label: "My Active Classes", value: myClasses.length },
        { label: "All Active Classes", value: classes.length },
      ],
      (item) => `<div class="item"><strong>${item.label}</strong>: ${item.value}</div>`
    );
  } catch (error) {
    renderList("#summary", [], () => "", `Dashboard load failed: ${error.message}`);
  }
}
