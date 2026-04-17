import { apiRequest } from "../../assets/js/api.js";
import { renderList } from "../../assets/js/ui.js";
import { bootMemberPage } from "./common.js";

if (bootMemberPage("dashboard")) {
  loadDashboard();
}

async function loadDashboard() {
  try {
    const [classesRes, bookingsRes] = await Promise.all([
      apiRequest("/api/classes", { auth: false }),
      apiRequest("/api/bookings/my-bookings"),
    ]);

    const classes = classesRes?.data?.classes || classesRes?.classes || [];
    const bookings = bookingsRes?.data?.bookings || bookingsRes?.bookings || [];

    renderList(
      "#stats",
      [
        { label: "Active Classes", value: classes.length },
        { label: "My Bookings", value: bookings.length },
      ],
      (item) => `<div class="item"><strong>${item.label}:</strong> ${item.value}</div>`
    );

    renderList(
      "#upcomingClasses",
      classes.slice(0, 5),
      (c) => `<div class="item"><strong>${c.class_name}</strong><br>${c.schedule_day || "-"} ${c.start_time || ""}</div>`
    );
  } catch (error) {
    renderList("#stats", [], () => "", `Failed to load dashboard: ${error.message}`);
  }
}
