import { apiRequest } from "../../assets/js/api.js";
import { renderList, setMessage } from "../../assets/js/ui.js";
import { bootMemberPage } from "./common.js";

const checkoutPanel = document.querySelector("#checkoutPanel");
const checkoutSummary = document.querySelector("#checkoutSummary");
const checkoutForm = document.querySelector("#checkoutForm");
const cancelCheckoutBtn = document.querySelector("#cancelCheckout");

let checkoutContext = null;

if (bootMemberPage("payments")) {
  loadPaymentsPage();
}

if (checkoutForm) {
  checkoutForm.addEventListener("submit", submitCheckout);
  checkoutForm.payment_method.addEventListener("change", toggleMethodFields);
}

if (cancelCheckoutBtn) {
  cancelCheckoutBtn.addEventListener("click", closeCheckout);
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

async function loadPaymentsPage() {
  setMessage("#message", "", "info");
  closeCheckout();
  await Promise.all([loadPendingPayments(), loadPaymentHistory()]);
}

async function loadPendingPayments() {
  try {
    const bookingsResponse = await apiRequest("/api/bookings/my-bookings");
    const paymentResponse = await apiRequest("/api/payments/my-payments");

    const bookings = bookingsResponse?.data?.bookings || bookingsResponse?.bookings || [];
    const payments = paymentResponse?.data?.payments || paymentResponse?.payments || [];

    const paidBookingIds = new Set(
      payments
        .filter((p) => p.payment_status === "completed")
        .map((p) => Number(p.booking_id))
    );

    const pendingBookings = bookings.filter(
      (b) => b.booking_status === "confirmed" && !paidBookingIds.has(Number(b.booking_id))
    );

    const rows = await Promise.all(
      pendingBookings.map(async (booking) => {
        let classPrice = 0;
        try {
          const classResponse = await apiRequest(`/api/classes/${booking.class_id}`, { auth: false });
          classPrice = Number(classResponse?.data?.price_per_class || classResponse?.price_per_class || 0);
        } catch {
          classPrice = 0;
        }

        return {
          ...booking,
          classPrice,
        };
      })
    );

    renderList(
      "#pendingList",
      rows,
      (b) => `
        <div class="item">
          <strong>${b.class_name || "Class"}</strong><br>
          Booking #${b.booking_id}<br>
          Amount: RM ${Number(b.classPrice || 0).toFixed(2)}
          <div class="row" style="margin-top: 8px;">
            <button data-pay-id="${b.booking_id}" data-amount="${b.classPrice}">Pay Now</button>
          </div>
        </div>
      `,
      "No pending payments"
    );

    document.querySelectorAll("[data-pay-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const booking = rows.find((r) => Number(r.booking_id) === Number(btn.dataset.payId));
        if (!booking) return;
        openCheckout(booking);
      });
    });
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}

function openCheckout(booking) {
  checkoutContext = {
    booking_id: Number(booking.booking_id),
    amount: Number(booking.classPrice || 0),
    class_name: booking.class_name || "Class",
  };

  checkoutSummary.textContent = `Booking #${checkoutContext.booking_id} - ${checkoutContext.class_name} - RM ${checkoutContext.amount.toFixed(2)}`;
  checkoutForm.reset();
  checkoutForm.payment_method.value = "credit_card";
  toggleMethodFields();
  checkoutPanel.style.display = "block";
}

function closeCheckout() {
  checkoutContext = null;
  if (checkoutPanel) checkoutPanel.style.display = "none";
}

function toggleMethodFields() {
  if (!checkoutForm) return;
  const method = checkoutForm.payment_method.value;
  const groupVisibility = {
    card: method === "credit_card" || method === "debit_card",
    paypal: method === "paypal",
    bank_transfer: method === "bank_transfer",
    cash: method === "cash",
  };

  document.querySelectorAll("[data-method-group]").forEach((node) => {
    const key = node.getAttribute("data-method-group");
    node.style.display = groupVisibility[key] ? "block" : "none";
  });
}

function validateCheckout(method, formData) {
  const billingName = (formData.get("billing_name") || "").toString().trim();
  if (billingName.length < 3) {
    return "Billing name is required";
  }

  if (method === "credit_card" || method === "debit_card") {
    const cardNumber = (formData.get("card_number") || "").toString().replace(/\s+/g, "");
    const expiry = (formData.get("card_expiry") || "").toString().trim();
    const cvv = (formData.get("card_cvv") || "").toString().trim();

    if (!/^\d{16}$/.test(cardNumber)) return "Card number must be 16 digits";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return "Expiry must be in MM/YY format";
    if (!/^\d{3,4}$/.test(cvv)) return "CVV must be 3 or 4 digits";
  }

  if (method === "paypal") {
    const paypalEmail = (formData.get("paypal_email") || "").toString().trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(paypalEmail)) return "Valid PayPal email is required";
  }

  if (method === "bank_transfer") {
    const bankRef = (formData.get("bank_reference") || "").toString().trim();
    if (bankRef.length < 4) return "Bank reference is required";
  }

  if (method === "cash") {
    const cashNote = (formData.get("cash_note") || "").toString().trim();
    if (cashNote.length < 3) return "Cash note is required";
  }

  return null;
}

async function submitCheckout(event) {
  event.preventDefault();
  if (!checkoutContext) return;

  const formData = new FormData(checkoutForm);
  const payment_method = formData.get("payment_method");

  const validationError = validateCheckout(payment_method, formData);
  if (validationError) {
    setMessage("#message", validationError, "error");
    return;
  }

  await processPayment(checkoutContext.booking_id, checkoutContext.amount, payment_method);
}

async function processPayment(bookingId, amount, payment_method) {
  try {
    setMessage("#message", "Processing payment...", "info");
    await new Promise((resolve) => setTimeout(resolve, 700));

    await apiRequest("/api/payments", {
      method: "POST",
      data: {
        booking_id: Number(bookingId),
        payment_method,
        amount: Number(amount),
      },
    });

    setMessage("#message", "Payment completed", "success");
    await loadPaymentsPage();
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}

async function loadPaymentHistory() {
  try {
    const response = await apiRequest("/api/payments/my-payments");
    const payments = response?.data?.payments || response?.payments || [];

    renderList(
      "#paymentList",
      payments,
      (p) => `
        <div class="item">
          <strong>Payment #${p.payment_id}</strong><br>
          Class: ${p.class_name || "N/A"}<br>
          Amount: RM ${Number(p.amount || 0).toFixed(2)}<br>
          Method: ${p.payment_method || "N/A"}<br>
          Status: ${p.payment_status || "N/A"}<br>
          Transaction ID: ${p.transaction_id || "N/A"}<br>
          Payment Date: ${formatDateTime(p.payment_date || p.created_at)}
          <div class="row" style="margin-top: 8px;">
            ${
              p.payment_status === "completed" || p.payment_status === "refund_requested"
                ? `<button class="secondary" data-receipt-id="${p.payment_id}">View Receipt</button>`
                : ""
            }
            ${
              p.payment_status === "completed"
                ? `<button class="secondary" style="margin-left:8px;" data-refund-id="${p.payment_id}">Request Refund</button>`
                : ""
            }
            ${
              p.payment_status === "refund_requested"
                ? `<span class="badge badge-inactive" style="margin-left: 8px; margin-top: auto; margin-bottom: auto;">Refund Pending</span>`
                : ""
            }
          </div>
        </div>
      `,
      "No payment history"
    );

    document.querySelectorAll("[data-refund-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await requestRefund(btn.dataset.refundId);
      });
    });

    document.querySelectorAll("[data-receipt-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await viewReceipt(btn.dataset.receiptId);
      });
    });
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}

async function viewReceipt(paymentId) {
  try {
    const response = await apiRequest(`/api/payments/${paymentId}/receipt`);
    const receipt = response?.data?.receipt || response?.receipt || {};

    const text = [
      `Receipt for Payment #${receipt.payment_id || paymentId}`,
      `Class: ${receipt.class_name || "N/A"}`,
      `Amount: RM ${Number(receipt.amount || 0).toFixed(2)}`,
      `Method: ${receipt.payment_method || "N/A"}`,
      `Transaction ID: ${receipt.transaction_id || "N/A"}`,
      `Payment Date: ${formatDateTime(receipt.payment_date)}`,
      `Status: ${receipt.status || "N/A"}`,
    ].join("<br>");

    setMessage("#message", text, "success");
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}

async function requestRefund(paymentId) {
  try {
    await apiRequest(`/api/payments/${paymentId}/request-refund`, {
      method: "POST",
      data: { reason: "Refund requested by member" },
    });

    setMessage("#message", "Refund requested", "success");
    await loadPaymentsPage();
  } catch (error) {
    setMessage("#message", error.message, "error");
  }
}
