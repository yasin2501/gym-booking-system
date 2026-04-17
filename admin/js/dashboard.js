import { apiRequest } from "../../assets/js/api.js";
import { renderList } from "../../assets/js/ui.js";
import { bootAdminPage } from "./common.js";

if (bootAdminPage("dashboard")) {
  loadSummary();
}

async function loadSummary() {
  try {
    const [usersRes, trainersRes, classesRes, paymentStatsRes] = await Promise.all([
      apiRequest("/api/users").catch(() => null),
      apiRequest("/api/trainers", { auth: false }).catch(() => null),
      apiRequest("/api/classes", { auth: false }).catch(() => null),
      apiRequest("/api/payments/admin/statistics").catch(() => null),
    ]);

    const users = usersRes?.data?.users || usersRes?.users || [];
    const trainers = trainersRes?.data?.trainers || trainersRes?.trainers || [];
    const classes = classesRes?.data?.classes || classesRes?.classes || [];
    const stats = paymentStatsRes?.data?.statistics || {};

    renderList(
      "#summary",
      [
        { label: "Users", value: users.length },
        { label: "Trainers", value: trainers.length },
        { label: "Classes", value: classes.length },
        { label: "Total Revenue", value: `RM ${stats.total_revenue || 0}` },
      ],
      (s) => `<div class="item"><strong>${s.label}:</strong> ${s.value}</div>`
    );
  } catch (error) {
    renderList("#summary", [], () => "", `Failed to load summary: ${error.message}`);
  }
}
