import { apiRequest } from "../../assets/js/api.js";
import { renderList, setMessage } from "../../assets/js/ui.js";
import { bootMemberPage } from "./common.js";

if (bootMemberPage("bookings")) {
  loadBookings();
}

async function loadBookings() {
  try {
    const response = await apiRequest("/api/bookings/my-bookings");
    const bookings = response?.data?.bookings || response?.bookings || [];
    const activeBookings = bookings.filter((b) => b.booking_status !== "cancelled");

    renderList(
      "#bookingList",
      activeBookings,
      (b) => `
        <div class="item">
          <h3>${b.class_name || "Class"}</h3>
          <p>Status: ${b.booking_status || "N/A"}</p>
          <p>Attendance: ${b.attendance_status || "N/A"}</p>
          <div class="row">
            ${b.booking_status === "confirmed"
              ? `<button class="danger" data-cancel-id="${b.booking_id}">Cancel Booking</button>`
              : ""}
          </div>
        </div>
      `,
      "No active bookings"
    );

    document.querySelectorAll("[data-cancel-id]").forEach((btn) => {
      btn.addEventListener("click", () => cancelBooking(btn.dataset.cancelId));
    });
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}

async function cancelBooking(bookingId) {
  try {
    await apiRequest(`/api/bookings/${bookingId}`, {
      method: "DELETE",
      data: { reason: "Cancelled by member" },
    });
    setMessage("#message", "Booking cancelled", "success");
    loadBookings();
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}
