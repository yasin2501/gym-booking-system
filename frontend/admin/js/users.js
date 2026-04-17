import { setMessage } from "../../assets/js/ui.js";
import { bootAdminPage } from "./common.js";

let allUsers = [];
let currentUser = null;

if (bootAdminPage("users")) {
  loadUsers();

  document.querySelector("#searchInput").addEventListener("input", applyFilters);
  document.querySelector("#filterRole").addEventListener("change", applyFilters);
  document.querySelector("#filterStatus").addEventListener("change", applyFilters);
}

async function loadUsers() {
  try {
    const { apiRequest } = await import("../../assets/js/api.js");
    const { getUser } = await import("../../assets/js/storage.js");
    const response = await apiRequest("/api/users");
    const users = response?.data?.users || response?.users || [];
    currentUser = getUser();
    allUsers = users;

    setMessage("#message", "", "info");
    updateSummaryCards(users);
    applyFilters();
  } catch (error) {
    setMessage("#message", `Could not load users: ${error.message}`, "error");
    document.querySelector("#userTableBody").innerHTML =
      `<tr><td colspan="6" class="table-empty">Failed to load users</td></tr>`;
  }
}

function updateSummaryCards(users) {
  document.querySelector("#totalCount").textContent = users.length;
  document.querySelector("#memberCount").textContent = users.filter(u => u.role === "member").length;
  document.querySelector("#trainerCount").textContent = users.filter(u => u.role === "trainer").length;
  document.querySelector("#adminCount").textContent = users.filter(u => u.role === "admin").length;
}

function applyFilters() {
  const search = document.querySelector("#searchInput").value.toLowerCase().trim();
  const roleFilter = document.querySelector("#filterRole").value;
  const statusFilter = document.querySelector("#filterStatus").value;

  let filtered = allUsers;

  if (search) {
    filtered = filtered.filter(u => {
      const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(search) || email.includes(search);
    });
  }

  if (roleFilter) {
    filtered = filtered.filter(u => u.role === roleFilter);
  }

  if (statusFilter) {
    filtered = filtered.filter(u => u.status === statusFilter);
  }

  renderTable(filtered);
}

function getRoleBadgeClass(role) {
  switch (role) {
    case "admin": return "badge badge-admin";
    case "trainer": return "badge badge-trainer";
    case "member": return "badge badge-member";
    default: return "badge";
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "active": return "badge badge-active";
    case "inactive": return "badge badge-inactive";
    case "suspended": return "badge badge-suspended";
    default: return "badge";
  }
}

function renderTable(users) {
  const tbody = document.querySelector("#userTableBody");
  const resultCount = document.querySelector("#resultCount");

  if (!users || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No users found</td></tr>`;
    resultCount.textContent = "0 users";
    return;
  }

  resultCount.textContent = `${users.length} user${users.length !== 1 ? "s" : ""} found`;

  tbody.innerHTML = users.map((u) => {
    const isSelf = currentUser && u.user_id === currentUser.user_id;
    const isActive = u.status === "active";

    return `
      <tr>
        <td class="cell-id">#${u.user_id}</td>
        <td class="cell-name">
          <div class="user-name">${u.first_name || ""} ${u.last_name || ""}</div>
        </td>
        <td class="cell-email">${u.email || ""}</td>
        <td><span class="${getRoleBadgeClass(u.role)}">${u.role}</span></td>
        <td><span class="${getStatusBadgeClass(u.status)}">${u.status}</span></td>
        <td class="cell-actions">
          <div class="action-group">
            <button class="btn-sm btn-activate" data-activate-user="${u.user_id}" ${isSelf || isActive ? "disabled" : ""}>Activate</button>
            <button class="btn-sm btn-deactivate" data-deactivate-user="${u.user_id}" ${isSelf || !isActive ? "disabled" : ""}>Deactivate</button>
            <button class="btn-sm btn-delete" data-delete-user="${u.user_id}" ${isSelf ? "disabled" : ""}>${isSelf ? "You" : "Delete"}</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  bindActions();
}

async function bindActions() {
  const { apiRequest } = await import("../../assets/js/api.js");

  document.querySelectorAll("[data-delete-user]").forEach((btn) => {
    if (btn.hasAttribute("disabled")) return;
    btn.addEventListener("click", async () => {
      try {
        await apiRequest(`/api/users/${btn.dataset.deleteUser}`, { method: "DELETE" });
        setMessage("#message", "User deleted", "success");
        loadUsers();
      } catch (error) {
        setMessage("#message", `Delete failed: ${error.message}`, "error");
      }
    });
  });

  document.querySelectorAll("[data-activate-user]").forEach((btn) => {
    if (btn.hasAttribute("disabled")) return;
    btn.addEventListener("click", async () => {
      try {
        await apiRequest(`/api/users/${btn.dataset.activateUser}`, {
          method: "PUT",
          data: { status: "active" },
        });
        setMessage("#message", "User activated", "success");
        loadUsers();
      } catch (error) {
        setMessage("#message", `Activate failed: ${error.message}`, "error");
      }
    });
  });

  document.querySelectorAll("[data-deactivate-user]").forEach((btn) => {
    if (btn.hasAttribute("disabled")) return;
    btn.addEventListener("click", async () => {
      try {
        await apiRequest(`/api/users/${btn.dataset.deactivateUser}`, {
          method: "PUT",
          data: { status: "inactive" },
        });
        setMessage("#message", "User deactivated", "success");
        loadUsers();
      } catch (error) {
        setMessage("#message", `Deactivate failed: ${error.message}`, "error");
      }
    });
  });
}
