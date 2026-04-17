import { apiRequest } from "../../assets/js/api.js";
import { getUser } from "../../assets/js/storage.js";
import { renderList, setMessage } from "../../assets/js/ui.js";
import { bootTrainerPage } from "./common.js";

if (bootTrainerPage("classes")) {
  loadClasses();
}

async function loadClasses() {
  try {
    const user = getUser() || {};
    const response = await apiRequest("/api/classes", { auth: false });
    const classes = response?.data?.classes || response?.classes || [];
    const myClasses = classes.filter(
      (c) =>
        Number(c.trainer_user_id) === Number(user.user_id) ||
        Number(c.trainer_id) === Number(user.trainer_id)
    );

    renderList(
      "#classList",
      myClasses,
      (c) => `<div class="item"><strong>${c.class_name}</strong><br>${c.schedule_day} ${c.start_time} - ${c.end_time}<br>Capacity: ${c.max_capacity}</div>`,
      "No assigned classes. If this is unexpected, update trainer filtering logic in trainer/js/classes.js."
    );
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}
