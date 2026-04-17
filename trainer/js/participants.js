import { apiRequest } from "../../assets/js/api.js";
import { getUser } from "../../assets/js/storage.js";
import { renderList, setMessage } from "../../assets/js/ui.js";
import { bootTrainerPage } from "./common.js";

if (bootTrainerPage("participants")) {
  loadParticipants();
}

async function loadParticipants() {
  setMessage("#message", "", "info");

  try {
    const user = getUser() || {};
    const classResponse = await apiRequest("/api/classes", { auth: false });
    const classes = classResponse?.data?.classes || classResponse?.classes || [];

    const myClasses = classes.filter(
      (c) =>
        Number(c.trainer_user_id) === Number(user.user_id) ||
        Number(c.trainer_id) === Number(user.trainer_id)
    );

    if (myClasses.length === 0) {
      renderList("#participantList", [], () => "", "No assigned classes found");
      return;
    }

    const rosterResponses = await Promise.all(
      myClasses.map(async (cls) => {
        try {
          const roster = await apiRequest(`/api/classes/${cls.class_id}/bookings`);
          return {
            classObj: cls,
            bookings: roster?.data?.bookings || roster?.bookings || [],
          };
        } catch {
          return { classObj: cls, bookings: [] };
        }
      })
    );

    const rows = rosterResponses.flatMap(({ classObj, bookings }) => {
      if (bookings.length === 0) {
        return [
          {
            class_name: classObj.class_name,
            schedule_day: classObj.schedule_day,
            start_time: classObj.start_time,
            end_time: classObj.end_time,
            empty: true,
          },
        ];
      }

      return bookings.map((b) => ({
        ...b,
        class_name: classObj.class_name,
        schedule_day: classObj.schedule_day,
        start_time: classObj.start_time,
        end_time: classObj.end_time,
      }));
    });

    renderList(
      "#participantList",
      rows,
      (b) => `
        <div class="item">
          <strong>${b.class_name || "Class"}</strong><br>
          ${b.schedule_day || ""} ${b.start_time || ""} - ${b.end_time || ""}<br>
          ${
            b.empty
              ? "No confirmed participants yet"
              : `${b.first_name || ""} ${b.last_name || ""}<br>Booking ID: ${b.booking_id}<br>Status: ${
                  b.booking_status || "N/A"
                }`
          }
          ${
            b.empty
              ? ""
              : b.booking_status === "confirmed" && b.attendance_status === "pending"
                ? `<div class=\"row\" style=\"margin-top: 8px;\">\n              <button data-attend-id=\"${b.booking_id}\" data-status=\"attended\">Mark Attended</button>\n              <button class=\"secondary\" data-attend-id=\"${b.booking_id}\" data-status=\"absent\">Mark Absent</button>\n            </div>`
                : ""
          }
        </div>
      `,
      "No participants found"
    );

    document.querySelectorAll("[data-attend-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const bookingId = btn.dataset.attendId;
        const status = btn.dataset.status;
        await apiRequest(`/api/bookings/${bookingId}/attendance`, {
          method: "PUT",
          data: { attendance_status: status },
        });
        setMessage("#message", "Attendance updated", "success");
        await loadParticipants();
      });
    });
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}
