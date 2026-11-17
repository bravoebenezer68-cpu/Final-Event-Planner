const STORAGE = { events: "eventify_events", guests: "eventify_guests", profile: "eventify_profile", theme: "eventify_theme" };
const $ = (id) => document.getElementById(id);
const read = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } };
let events = read(STORAGE.events, []);
let guests = read(STORAGE.guests, []);
let profile = read(STORAGE.profile, { name: "Event Organizer", email: "" });
let toastTimer;

function makeId() { return (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`); }
function persist() {
  localStorage.setItem(STORAGE.events, JSON.stringify(events));
  localStorage.setItem(STORAGE.guests, JSON.stringify(guests));
  localStorage.setItem(STORAGE.profile, JSON.stringify(profile));
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function showToast(message) {
  const toast = $("toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function initials(name) { return (name || "EO").trim().split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase(); }
function dateParts(date) {
  if (!date) return { day: "—", month: "TBD" };
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { day: "—", month: "TBD" };
  return { day: d.getDate(), month: d.toLocaleString("en", { month: "short" }) };
}
function formatDate(date) {
  if (!date) return "Date not set";
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}
function normalizeEvent(event) {
  const status = ["Upcoming","Ongoing","Completed","Cancelled"].includes(event.status) ? event.status : (event.date && event.date < new Date().toISOString().slice(0,10) ? "Completed" : "Upcoming");
  return { ...event, id: event.id || makeId(), category: event.category || "Other", status, guests: Number(event.guests) || 0, name: event.name || "Untitled event", location: event.location || "No location" };
}
events = Array.isArray(events) ? events.map(normalizeEvent) : [];
guests = Array.isArray(guests) ? guests : [];
persist();

function eventCard(event, showActions = true) {
  const date = dateParts(event.date);
  const statusClass = event.status.toLowerCase();
  return `<article class="event-row">
    <div class="event-datebox"><strong>${escapeHTML(date.day)}</strong><span>${escapeHTML(date.month)}</span></div>
    <div class="event-main"><h3>${escapeHTML(event.name)}</h3><div class="event-meta"><span>⌖ ${escapeHTML(event.location)}</span><span>♧ ${event.guests} guests</span><span>◷ ${escapeHTML(formatDate(event.date))}</span></div></div>
    <div class="event-tags"><span class="category-tag">${escapeHTML(event.category)}</span><span class="status-badge ${statusClass}">${escapeHTML(event.status)}</span>${showActions ? `<div class="row-actions"><button class="small-action" data-edit-event="${escapeHTML(event.id)}">Edit</button><button class="small-action delete" data-delete-event="${escapeHTML(event.id)}">Delete</button></div>` : ""}</div>
  </article>`;
}
function emptyState(title, message) { return `<div class="empty-state"><div class="empty-icon">✦</div><h3>${title}</h3><p>${message}</p></div>`; }
function renderEvents() {
  $("totalEvents").textContent = events.length;
  $("upcomingEvents").textContent = events.filter(e => e.status === "Upcoming").length;
  $("completedEvents").textContent = events.filter(e => e.status === "Completed").length;
  $("totalGuests").textContent = guests.length;
  const dashboardQuery = $("dashboardSearch").value.trim().toLowerCase();
  const dashboardEvents = events.filter(e => ["Upcoming","Ongoing"].includes(e.status)).filter(e => [e.name,e.location,e.category,e.status].join(" ").toLowerCase().includes(dashboardQuery)).sort((a,b) => (a.date || "").localeCompare(b.date || ""));
  $("dashboardEventList").innerHTML = dashboardEvents.length ? dashboardEvents.map(e => eventCard(e, true)).join("") : emptyState("Nothing on the calendar", "Create an event or try another search.");
  const query = $("eventsSearch").value.trim().toLowerCase();
  const filter = $("statusFilter").value;
  const filtered = events.filter(e => [e.name,e.location,e.category,e.status].join(" ").toLowerCase().includes(query)).filter(e => filter === "all" || e.status === filter).sort((a,b) => (a.date || "").localeCompare(b.date || ""));
  $("allEventList").innerHTML = filtered.length ? filtered.map(e => eventCard(e, true)).join("") : emptyState("No events found", "Try changing your search or create a new event.");
  $("eventCountLabel").textContent = `${events.length} ${events.length === 1 ? "event" : "events"}`;
}
function renderGuests() {
  $("guestCountLabel").textContent = `${guests.length} ${guests.length === 1 ? "guest" : "guests"}`;
  const q = $("guestSearch").value.trim().toLowerCase();
  const filtered = guests.filter(g => [g.name,g.email,eventName(g.eventId)].join(" ").toLowerCase().includes(q));
  $("guestTableBody").innerHTML = filtered.map(g => `<tr><td><span class="guest-initial">${escapeHTML(initials(g.name))}</span>${escapeHTML(g.name)}</td><td>${escapeHTML(g.email || "—")}</td><td>${escapeHTML(eventName(g.eventId))}</td><td><button class="table-delete" data-delete-guest="${escapeHTML(g.id)}">Remove</button></td></tr>`).join("");
  $("guestEmpty").classList.toggle("hidden", filtered.length > 0);
  $("totalGuests").textContent = guests.length;
}
function eventName(id) { return events.find(e => e.id === id)?.name || (id ? "Event unavailable" : "Unassigned"); }
function updateProfileUI() {
  const name = profile.name || "Event Organizer";
  $("sidebarOrganizer").textContent = name;
  $("sidebarAvatar").textContent = initials(name);
  $("topAvatar").textContent = initials(name);
  $("organizerName").value = profile.name || "";
  $("organizerEmail").value = profile.email || "";
}
function updateGuestEventOptions(selected = "") {
  $("guestEvent").innerHTML = `<option value="">No event assigned</option>` + events.map(e => `<option value="${escapeHTML(e.id)}" ${e.id === selected ? "selected" : ""}>${escapeHTML(e.name)}</option>`).join("");
}
function openModal(id) { $(id).classList.add("show"); $(id).setAttribute("aria-hidden","false"); }
function closeModal(id) { $(id).classList.remove("show"); $(id).setAttribute("aria-hidden","true"); }
function openEventModal(id = "") {
  $("eventForm").reset(); $("eventId").value = id;
  const event = events.find(e => e.id === id);
  $("eventModalTitle").textContent = event ? "Edit event" : "Create new event";
  $("saveEventBtn").textContent = event ? "Save changes" : "Save event";
  if (event) {
    $("eventName").value = event.name; $("eventDate").value = event.date || "";
    $("eventLocation").value = event.location; $("eventGuests").value = event.guests;
    $("eventCategory").value = event.category; $("eventStatus").value = event.status;
  } else { $("eventCategory").value = "Other"; $("eventStatus").value = "Upcoming"; }
  openModal("eventModal");
}
function navigate(page) {
  document.querySelectorAll(".page").forEach(el => el.classList.toggle("active", el.id === `page-${page}`));
  document.querySelectorAll(".nav-link").forEach(el => el.classList.toggle("active", el.dataset.page === page));
  const labels = { dashboard:"Dashboard", events:"My Events", guests:"Guests", settings:"Settings" };
  $("pageCrumb").textContent = labels[page] || "Dashboard";
  $("sidebar").classList.remove("open");
  if (page === "guests") renderGuests();
}
function deleteEvent(id) {
  const event = events.find(e => e.id === id); if (!event) return;
  if (!confirm(`Delete "${event.name}"? Guests assigned to this event will become unassigned.`)) return;
  events = events.filter(e => e.id !== id);
  guests = guests.map(g => g.eventId === id ? { ...g, eventId: "" } : g);
  persist(); renderEvents(); renderGuests(); showToast("Event deleted.");
}
function deleteGuest(id) {
  const guest = guests.find(g => g.id === id); if (!guest) return;
  if (!confirm(`Remove ${guest.name} from your guest list?`)) return;
  guests = guests.filter(g => g.id !== id); persist(); renderGuests(); renderEvents(); showToast("Guest removed.");
}

document.querySelectorAll(".nav-link").forEach(button => button.addEventListener("click", () => navigate(button.dataset.page)));
document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.go)));
$("createEventBtn").addEventListener("click", () => openEventModal());
$("createEventBtn2").addEventListener("click", () => openEventModal());
$("eventForm").addEventListener("submit", event => {
  event.preventDefault();
  const id = $("eventId").value;
  const data = { name:$("eventName").value.trim(), date:$("eventDate").value, location:$("eventLocation").value.trim(), guests:Number($("eventGuests").value), category:$("eventCategory").value, status:$("eventStatus").value };
  if (!data.name || !data.date || !data.location || data.guests < 0) return;
  if (id) { events = events.map(e => e.id === id ? { ...e, ...data } : e); showToast("Event updated successfully."); }
  else { events.push({ id:makeId(), ...data }); showToast("Event created successfully."); }
  persist(); renderEvents(); updateGuestEventOptions(); closeModal("eventModal");
});
document.addEventListener("click", event => {
  const edit = event.target.closest("[data-edit-event]");
  const del = event.target.closest("[data-delete-event]");
  const guestDel = event.target.closest("[data-delete-guest]");
  if (edit) openEventModal(edit.dataset.editEvent);
  if (del) deleteEvent(del.dataset.deleteEvent);
  if (guestDel) deleteGuest(guestDel.dataset.deleteGuest);
});
$("dashboardSearch").addEventListener("input", renderEvents);
$("eventsSearch").addEventListener("input", renderEvents);
$("statusFilter").addEventListener("change", renderEvents);
$("addGuestBtn").addEventListener("click", () => { $("guestForm").reset(); updateGuestEventOptions(); openModal("guestModal"); });
$("guestForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = $("guestName").value.trim();
  if (!name) return;
  guests.push({ id:makeId(), name, email:$("guestEmail").value.trim(), eventId:$("guestEvent").value });
  persist(); renderGuests(); renderEvents(); closeModal("guestModal"); showToast("Guest added successfully.");
});
$("guestSearch").addEventListener("input", renderGuests);
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => closeModal(button.dataset.close)));
document.querySelectorAll(".modal-backdrop").forEach(backdrop => backdrop.addEventListener("click", event => { if (event.target === backdrop) closeModal(backdrop.id); }));
document.addEventListener("keydown", event => { if (event.key === "Escape") document.querySelectorAll(".modal-backdrop.show").forEach(modal => closeModal(modal.id)); });
$("profileForm").addEventListener("submit", event => {
  event.preventDefault(); profile = { name:$("organizerName").value.trim() || "Event Organizer", email:$("organizerEmail").value.trim() };
  persist(); updateProfileUI(); showToast("Profile saved.");
});
function applyTheme(dark) {
  document.body.classList.toggle("light-mode", !dark);
  $("darkModeToggle").checked = dark;
  localStorage.setItem(STORAGE.theme, dark ? "dark" : "light");
}
$("darkModeToggle").addEventListener("change", event => { applyTheme(event.target.checked); showToast(event.target.checked ? "Dark mode enabled." : "Light mode enabled."); });
$("mobileMenu").addEventListener("click", () => $("sidebar").classList.toggle("open"));
$("sidebarSettings").addEventListener("click", () => navigate("settings"));
$("topAvatar").addEventListener("click", () => navigate("settings"));
$("todayLabel").textContent = new Date().toLocaleDateString("en", { weekday:"short", month:"short", day:"numeric" });
$("year").textContent = new Date().getFullYear();
updateProfileUI(); applyTheme(read(STORAGE.theme, "dark") !== "light"); renderEvents(); renderGuests();
