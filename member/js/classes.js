import { apiRequest } from "../../assets/js/api.js";
import { renderList, setMessage } from "../../assets/js/ui.js";
import { bootMemberPage } from "./common.js";

if (bootMemberPage("classes")) {
  loadClasses();
}

async function loadClasses() {
  try {
    const response = await apiRequest("/api/classes", { auth: false });
    const classes = response?.data?.classes || response?.classes || [];

    renderList(
      "#classList",
      classes,
      (c) => `
        <div class="item">
          <h3>${c.class_name}</h3>
          <p>Type: ${c.class_type || "N/A"}</p>
          <p>Schedule: ${c.schedule_day || "N/A"} ${c.start_time || ""} - ${c.end_time || ""}</p>
          <p>Price: RM ${c.price_per_class || 0}</p>
          <button data-book-id="${c.class_id}">Book Class</button>
        </div>
      `
    );

    document.querySelectorAll("[data-book-id]").forEach((btn) => {
      btn.addEventListener("click", () => bookClass(btn.dataset.bookId));
    });
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}

async function bookClass(classId) {
  try {
    await apiRequest("/api/bookings", {
      method: "POST",
      data: { class_id: Number(classId) },
    });
    setMessage("#message", "Class booked successfully", "success");
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}
