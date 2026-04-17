export function setMessage(targetSelector, message = "", type = "info") {
  const el = document.querySelector(targetSelector);
  if (!el) return;

  if (!message) {
    el.innerHTML = "";
    return;
  }

  el.innerHTML = `<div class="message ${type}">${message}</div>`;
}

export function renderList(targetSelector, items, renderer, emptyText = "No data found") {
  const el = document.querySelector(targetSelector);
  if (!el) return;

  if (!Array.isArray(items) || items.length === 0) {
    el.innerHTML = `<div class="item">${emptyText}</div>`;
    return;
  }

  el.innerHTML = items.map(renderer).join("");
}
