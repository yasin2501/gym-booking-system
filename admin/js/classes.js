import { apiRequest } from "../../assets/js/api.js";
import { renderList, setMessage } from "../../assets/js/ui.js";
import { bootAdminPage } from "./common.js";

const classForm = document.querySelector("#classForm");
const trainerSelect = document.querySelector("#trainerSelect");
const formTitle = document.querySelector("#formTitle");
const submitBtn = document.querySelector("#submitBtn");
const cancelEditBtn = document.querySelector("#cancelEditBtn");

let currentClasses = [];
let editingClassId = null;

if (bootAdminPage("classes")) {
  classForm.addEventListener("submit", handleSubmit);
  cancelEditBtn.addEventListener("click", resetForm);
  loadTrainers();
  loadClasses();
}

async function loadTrainers() {
  try {
    const response = await apiRequest("/api/trainers", { auth: false });
    const trainers = response?.data?.trainers || response?.trainers || [];

    trainerSelect.innerHTML = trainers
      .map((t) => `<option value="${t.trainer_id}">${t.trainer_id} - ${t.first_name || ""} ${t.last_name || ""}</option>`)
      .join("");
  } catch (error) {
    setMessage("#message", `Failed to load trainers: ${error.message}`, "error");
  }
}

async function loadClasses() {
  try {
    const response = await apiRequest("/api/classes", { auth: false });
    const classes = response?.data?.classes || response?.classes || [];
    currentClasses = classes;

    renderList(
      "#classList",
      classes,
      (c) => `
        <div class="item">
          <strong>${c.class_name}</strong> (${c.class_type})<br>
          Trainer ID: ${c.trainer_id} | Capacity: ${c.max_capacity}<br>
          ${c.schedule_day || ""} ${c.start_time || ""}-${c.end_time || ""} | RM ${c.price_per_class || 0}
          <div class="row" style="margin-top: 8px;">
            <button class="secondary" data-edit-class="${c.class_id}">Edit</button>
            <button class="danger" data-delete-class="${c.class_id}">Cancel Class</button>
          </div>
        </div>
      `,
      "No active classes"
    );

    document.querySelectorAll("[data-edit-class]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const classId = Number(btn.dataset.editClass);
        const selectedClass = currentClasses.find((c) => Number(c.class_id) === classId);
        if (!selectedClass) return;
        fillFormForEdit(selectedClass);
      });
    });

    document.querySelectorAll("[data-delete-class]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await apiRequest(`/api/classes/${btn.dataset.deleteClass}`, { method: "DELETE" });
          setMessage("#message", "Class cancelled", "success");
          loadClasses();
        } catch (error) {
          setMessage("#message", error.message, "error");
        }
      });
    });
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}

function fillFormForEdit(c) {
  editingClassId = Number(c.class_id);
  formTitle.textContent = `Edit Class #${c.class_id}`;
  submitBtn.textContent = "Update Class";
  cancelEditBtn.style.display = "inline-block";

  classForm.class_id.value = c.class_id || "";
  classForm.trainer_id.value = c.trainer_id || "";
  classForm.class_name.value = c.class_name || "";
  classForm.class_type.value = c.class_type || "other";
  classForm.schedule_day.value = c.schedule_day || "Monday";
  classForm.start_time.value = (c.start_time || "").slice(0, 5);
  classForm.end_time.value = (c.end_time || "").slice(0, 5);
  classForm.max_capacity.value = c.max_capacity || 1;
  classForm.price_per_class.value = c.price_per_class || 0;
  classForm.skill_level.value = c.skill_level || "intermediate";
  classForm.location.value = c.location || "";
  classForm.description.value = c.description || "";
}

function resetForm() {
  editingClassId = null;
  formTitle.textContent = "Create Class";
  submitBtn.textContent = "Create Class";
  cancelEditBtn.style.display = "none";
  classForm.reset();
}

async function handleSubmit(event) {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(classForm).entries());

  const payload = {
    trainer_id: Number(formData.trainer_id),
    class_name: formData.class_name,
    description: formData.description || null,
    class_type: formData.class_type,
    schedule_day: formData.schedule_day,
    start_time: formData.start_time,
    end_time: formData.end_time,
    max_capacity: Number(formData.max_capacity),
    price_per_class: Number(formData.price_per_class),
    skill_level: formData.skill_level || "intermediate",
    location: formData.location || null,
  };

  try {
    if (editingClassId) {
      await apiRequest(`/api/classes/${editingClassId}`, {
        method: "PUT",
        data: payload,
      });
      setMessage("#message", "Class updated", "success");
    } else {
      await apiRequest("/api/classes", {
        method: "POST",
        data: payload,
      });
      setMessage("#message", "Class created", "success");
    }

    resetForm();
    loadClasses();
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}
