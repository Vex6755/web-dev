// ---------- helpers ----------
const pad = (n) => String(n).padStart(2, "0");
const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// ---------- storage ----------
const STORAGE_KEY = "calendar-events";
let events = loadEvents();

function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}
function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// ---------- digital clock ----------
const clockTime = document.getElementById("clock-time");
const clockDate = document.getElementById("clock-date");
const formatBtn = document.getElementById("clock-format");
let use24h = false;

function tickClock() {
  const now = new Date();
  clockTime.textContent = now.toLocaleTimeString("en-US", {
    hour12: !use24h,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  clockDate.textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
formatBtn.addEventListener("click", () => {
  use24h = !use24h;
  formatBtn.textContent = use24h ? "Switch to 12-hour" : "Switch to 24-hour";
  tickClock();
});
tickClock();
setInterval(tickClock, 1000);

// ---------- calendar ----------
const grid = document.getElementById("grid");
const monthLabel = document.getElementById("month-label");
const today = new Date();
const todayKey = dateKey(
  today.getFullYear(),
  today.getMonth(),
  today.getDate(),
);
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selected = todayKey;

function renderCalendar() {
  monthLabel.textContent = new Date(viewYear, viewMonth).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    },
  );
  grid.innerHTML = "";

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  for (let i = 0; i < firstWeekday; i++) {
    const blank = document.createElement("span");
    blank.className = "blank";
    grid.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(viewYear, viewMonth, d);
    const weekday = new Date(viewYear, viewMonth, d).getDay();
    const count = events[key] ? events[key].length : 0;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day";
    btn.textContent = d;
    btn.setAttribute(
      "aria-label",
      `${key}, ${count} event${count === 1 ? "" : "s"}`,
    );

    if (weekday === 0 || weekday === 6) btn.classList.add("weekend");
    if (key === todayKey) btn.classList.add("today");
    if (key === selected) btn.classList.add("selected");
    if (count) btn.classList.add("has-event");

    // single click: view events
    btn.addEventListener("click", () => {
      selected = key;
      renderCalendar();
      renderPanel();
    });
    // double click: add event
    btn.addEventListener("dblclick", () => {
      selected = key;
      renderCalendar();
      renderPanel();
      openDialog();
    });
    grid.appendChild(btn);
  }
}

function changeMonth(step) {
  viewMonth += step;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear--;
  }
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear++;
  }
  renderCalendar();
}
document
  .getElementById("prev")
  .addEventListener("click", () => changeMonth(-1));
document.getElementById("next").addEventListener("click", () => changeMonth(1));

// ---------- event panel ----------
const panelDate = document.getElementById("panel-date");
const eventList = document.getElementById("event-list");

function renderPanel() {
  const [y, m, d] = selected.split("-").map(Number);
  panelDate.textContent = new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  eventList.innerHTML = "";

  const list = (events[selected] || [])
    .slice()
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  if (!list.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No events or reminders.";
    eventList.appendChild(li);
    return;
  }
  list.forEach((ev) => {
    const li = document.createElement("li");
    const text = document.createElement("span");
    if (ev.time) {
      const t = document.createElement("span");
      t.className = "time";
      t.textContent = ev.time;
      text.appendChild(t);
    }
    text.appendChild(document.createTextNode(ev.title));

    const del = document.createElement("button");
    del.type = "button";
    del.className = "del-btn";
    del.textContent = "Delete";
    del.addEventListener("click", () => {
      events[selected] = events[selected].filter((e) => e.id !== ev.id);
      if (!events[selected].length) delete events[selected];
      saveEvents();
      renderCalendar();
      renderPanel();
    });

    li.append(text, del);
    eventList.appendChild(li);
  });
}

// ---------- add-event dialog ----------
const dialog = document.getElementById("dialog");
const form = document.getElementById("event-form");
const titleInput = document.getElementById("ev-title");
const timeInput = document.getElementById("ev-time");

function openDialog() {
  form.reset();
  dialog.showModal();
  titleInput.focus();
}
document.getElementById("add-btn").addEventListener("click", openDialog);
document
  .getElementById("cancel")
  .addEventListener("click", () => dialog.close());

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  if (!events[selected]) events[selected] = [];
  events[selected].push({ id: Date.now(), title, time: timeInput.value });
  saveEvents();
  dialog.close();
  renderCalendar();
  renderPanel();
});

// ---------- init ----------
renderCalendar();
renderPanel();
