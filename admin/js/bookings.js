import { apiRequest } from "../../assets/js/api.js";
import { renderList, setMessage } from "../../assets/js/ui.js";
import { bootAdminPage } from "./common.js";

if (bootAdminPage("bookings")) {
  loadAllClassBookings();
}

async function loadAllClassBookings() {
  setMessage("#message", "", "info");
  try {
    const classResponse = await apiRequest("/api/classes?limit=50", { auth: false });
    const classes = classResponse?.data?.classes || classResponse?.classes || [];

    if (classes.length === 0) {
      renderList("#bookingList", [], () => "", "No active classes found");
      return;
    }

    const rosterResponses = await Promise.all(
      classes.map(async (cls) => {
        try {
          const response = await apiRequest(`/api/classes/${cls.class_id}/bookings`);
          return {
            classObj: cls,
            bookings: response?.data?.bookings || response?.bookings || [],
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
      "#bookingList",
      rows,
      (b) => `
        <div class="item">
          <strong>${b.class_name || "Class"}</strong><br>
          ${b.schedule_day || ""} ${b.start_time || ""} - ${b.end_time || ""}<br>
          ${
            b.empty
              ? "No bookings yet"
              : `Booking #${b.booking_id}<br>User: ${b.first_name || ""} ${b.last_name || ""}<br>Status: ${
                  b.booking_status || "N/A"
                }`
          }
        </div>
      `,
      "No bookings found"
    );
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}
