import { apiRequest } from "../../assets/js/api.js";
import { renderList, setMessage } from "../../assets/js/ui.js";
import { bootAdminPage } from "./common.js";

if (bootAdminPage("payments")) {
  loadStats();
  loadBookingOptions();
}

const dailyForm = document.querySelector("#dailyForm");
dailyForm.addEventListener("submit", loadDailyReport);
dailyForm.date.value = new Date().toISOString().slice(0, 10);

const processPaymentForm = document.querySelector("#processPaymentForm");
if (processPaymentForm) {
  processPaymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(processPaymentForm));
      const response = await apiRequest("/api/payments", {
        method: "POST",
        data: {
          booking_id: parseInt(data.booking_id),
          amount: parseFloat(data.amount),
          payment_method: data.payment_method
        }
      });
      setMessage("#actionMessage", "Payment manually processed successfully!", "success");
      processPaymentForm.reset();
      loadStats(); // refresh stats to update revenue
      loadBookingOptions(); // refresh dropdown so paid booking disappears
    } catch (error) {
      setMessage("#actionMessage", `Failed: ${error.message}`, "error");
    }
  });
}

const refundPaymentForm = document.querySelector("#refundPaymentForm");
if (refundPaymentForm) {
  refundPaymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(refundPaymentForm));
      const response = await apiRequest(`/api/payments/${data.payment_id}/refund`, {
        method: "POST",
        data: { reason: data.reason }
      });
      setMessage("#actionMessage", "Refund issued successfully!", "success");
      refundPaymentForm.reset();
      loadStats(); // refresh stats to update revenue
    } catch (error) {
      setMessage("#actionMessage", `Refunding failed: ${error.message}`, "error");
    }
  });
}

async function loadStats() {
  try {
    const response = await apiRequest("/api/payments/admin/statistics");
    const stats = response?.data?.statistics || {};

    renderList(
      "#stats",
      [
        { label: "Total Payments", value: stats.total_payments || 0 },
        { label: "Total Revenue", value: `RM ${stats.total_revenue || 0}` },
        { label: "Pending Revenue", value: `RM ${stats.pending_revenue || 0}` },
      ],
      (s) => `<div class="item"><strong>${s.label}</strong>: ${s.value}</div>`
    );
  } catch (error) {
    setMessage("#stats", error.message, "error");
  }
}

async function loadDailyReport(event) {
  event.preventDefault();
  try {
    const date = dailyForm.date.value;
    const response = await apiRequest(`/api/payments/admin/daily-report?date=${date}`);
    const report = response?.data?.report || {};

    renderList(
      "#dailyReport",
      [
        { label: "Date", value: date },
        { label: "Transactions", value: report.total_transactions || 0 },
        { label: "Revenue", value: `RM ${report.total_revenue || 0}` },
        { label: "Refunds", value: `RM ${report.total_refunds || 0}` },
        { label: "Net", value: `RM ${report.net_revenue || 0}` },
      ],
      (r) => `<div class="item"><strong>${r.label}</strong>: ${r.value}</div>`
    );
  } catch (error) {
    setMessage("#dailyReport", error.message, "error");
  }
}

async function loadBookingOptions() {
  const select = document.querySelector("#bookingSelect");
  const amountInput = document.querySelector("#amountInput");
  if (!select) return;

  try {
    const classResponse = await apiRequest("/api/classes?limit=100", { auth: false });
    const classes = classResponse?.data?.classes || classResponse?.classes || [];

    const rosterResponses = await Promise.all(
      classes.map(async (cls) => {
        try {
          const response = await apiRequest(`/api/classes/${cls.class_id}/bookings`);
          const bookings = response?.data?.bookings || response?.bookings || [];
          return bookings.map(b => ({ ...b, classObj: cls }));
        } catch {
          return [];
        }
      })
    );

    const allBookings = rosterResponses.flat();
    
    // 1. Pending Bookings Dropdown
    // Only 'confirmed' bookings WITHOUT a 'completed' payment are pending
    const pendingBookings = allBookings.filter(b => 
      b.booking_status === 'confirmed' && b.payment_status !== 'completed'
    );

    if (pendingBookings.length === 0) {
      select.innerHTML = `<option value="">No pending bookings found</option>`;
    } else {
      select.innerHTML = `<option value="">Select a pending booking...</option>` + 
        pendingBookings.map(b => 
          `<option value="${b.booking_id}" data-price="${b.classObj.price_per_class}">
            #${b.booking_id} - ${b.first_name} ${b.last_name} (${b.classObj.class_name})
          </option>`
        ).join("");

      select.addEventListener("change", (e) => {
        const selected = select.options[select.selectedIndex];
        if (selected && selected.dataset.price && amountInput) {
          amountInput.value = selected.dataset.price;
        } else if (amountInput) {
          amountInput.value = "";
        }
      });
    }

    // 2. Completed Payments (Refund) Dropdown
    const refundSelect = document.querySelector("#refundSelect");
    if (refundSelect) {
      const requestedRefunds = allBookings.filter(b => b.payment_status === 'refund_requested' && b.payment_id);
      
      if (requestedRefunds.length === 0) {
        refundSelect.innerHTML = `<option value="">No pending refund requests</option>`;
      } else {
        refundSelect.innerHTML = `<option value="">Select a refund request to approve...</option>` + 
          requestedRefunds.map(b => 
            `<option value="${b.payment_id}">
              Payment #${b.payment_id} - ${b.first_name} ${b.last_name} (RM ${b.recorded_payment_amount || b.classObj.price_per_class})
            </option>`
          ).join("");
      }
    }

  } catch (error) {
    select.innerHTML = `<option value="">Error loading bookings</option>`;
    const refundSelect = document.querySelector("#refundSelect");
    if (refundSelect) refundSelect.innerHTML = `<option value="">Error loading payments</option>`;
  }
}
