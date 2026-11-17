
// =====================================
// EVENTIFY - EVENT PLANNER
// COMPLETE JAVASCRIPT
// =====================================


// =====================================
// ELEMENTS
// =====================================

const modal = document.getElementById("eventModal");
const eventForm = document.getElementById("eventForm");

const eventName = document.getElementById("eventName");
const eventDate = document.getElementById("eventDate");
const eventLocation = document.getElementById("eventLocation");
const eventGuests = document.getElementById("eventGuests");
const eventCategory = document.getElementById("eventCategory");
const eventStatus = document.getElementById("eventStatus");

const modalTitle = document.getElementById("modalTitle");
const eventSubmit = document.getElementById("eventSubmit");

const sidebarName = document.getElementById("sidebarName");


// =====================================
// LOCAL STORAGE DATA
// =====================================

let events = JSON.parse(localStorage.getItem("events")) || [];
let guests = JSON.parse(localStorage.getItem("guests")) || [];

// Add default category and status to events saved by older versions.
events = events.map(function(event) {
    const eventDate = new Date(event.date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
        ...event,
        category: event.category || "Other",
        status: event.status || (eventDate < today ? "Completed" : "Upcoming")
    };
});
localStorage.setItem("events", JSON.stringify(events));

let editingIndex = null;


// =====================================
// PAGE NAVIGATION
// =====================================

const pages = {
    dashboard: document.getElementById("dashboardPage"),
    events: document.getElementById("eventsPage"),
    guests: document.getElementById("guestsPage"),
    settings: document.getElementById("settingsPage")
};

const menus = document.querySelectorAll(".menu li[data-page]");

function showPage(pageName) {

    Object.keys(pages).forEach(function(key) {

        pages[key].classList.toggle(
            "active-page",
            key === pageName
        );

    });

    menus.forEach(function(menu) {

        menu.classList.toggle(
            "active",
            menu.dataset.page === pageName
        );

    });

    if (pageName === "dashboard" || pageName === "events") {
        displayEvents();
    }

    if (pageName === "guests") {
        displayGuests();
        updateGuestEventOptions();
    }

}

menus.forEach(function(menu) {

    menu.addEventListener("click", function() {
        showPage(menu.dataset.page);
    });

});

document.getElementById("viewAllEvents").addEventListener(
    "click",
    function() {
        showPage("events");
    }
);


// =====================================
// CREATE EVENT MODAL
// =====================================

function openModal() {

    editingIndex = null;

    eventForm.reset();
    eventCategory.value = "Other";
    eventStatus.value = "Upcoming";

    modalTitle.textContent = "Create New Event";
    eventSubmit.textContent = "Save Event";

    modal.style.display = "flex";

}

document.getElementById("openCreateEvent")
    .addEventListener("click", openModal);

document.getElementById("openCreateEventMenu")
    .addEventListener("click", openModal);

document.getElementById("myEventsCreate")
    .addEventListener("click", openModal);


document.getElementById("closeModal")
    .addEventListener("click", function() {

        modal.style.display = "none";

    });


modal.addEventListener("click", function(e) {

    if (e.target === modal) {
        modal.style.display = "none";
    }

});


// =====================================
// SAVE EVENTS
// =====================================

function saveEvents() {

    localStorage.setItem(
        "events",
        JSON.stringify(events)
    );

    displayEvents();
    updateGuestEventOptions();

}


// =====================================
// DISPLAY EVENTS
// =====================================

function displayEvents() {

    const eventList = document.getElementById("eventList");
    const allEventsList = document.getElementById("allEventsList");

    eventList.innerHTML = "";
    allEventsList.innerHTML = "";

    let upcoming = 0;
    let completed = 0;
    let totalGuests = 0;

    const dashboardSearch =
        document.getElementById("dashboardSearch").value.toLowerCase();

    const eventsSearch =
        document.getElementById("eventsSearch").value.toLowerCase();


    events.forEach(function(event, index) {

        const date = new Date(event.date + "T00:00:00");
        const statusValue = event.status || "Upcoming";

        if (statusValue === "Upcoming") upcoming++;
        if (statusValue === "Completed") completed++;

        totalGuests += Number(event.guests);

        const formattedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });


        // CREATE EVENT CARD
        function createCard() {

            const card = document.createElement("div");
            card.className = "event-card";

            const details = document.createElement("div");

            const name = document.createElement("h3");
            name.textContent = event.name;

            const eventDateText = document.createElement("p");
            eventDateText.innerHTML =
                '<i class="fa-solid fa-calendar"></i> ';
            eventDateText.append(formattedDate);

            const location = document.createElement("p");
            location.innerHTML =
                '<i class="fa-solid fa-location-dot"></i> ';
            location.append(event.location);

            const guestsText = document.createElement("p");
            guestsText.innerHTML =
                '<i class="fa-solid fa-users"></i> ';
            guestsText.append(event.guests + " Guests");

            const meta = document.createElement("div");
            meta.className = "event-meta";

            const categoryTag = document.createElement("span");
            categoryTag.className = "category-tag";
            categoryTag.textContent = event.category || "Other";

            const status = document.createElement("span");
            const safeStatus = (event.status || "Upcoming").toLowerCase();
            status.className = "status status-" + safeStatus;
            status.textContent = event.status || "Upcoming";

            meta.append(categoryTag, status);

            details.append(
                name,
                eventDateText,
                location,
                guestsText,
                meta
            );


            // ACTION BUTTONS
            const actions = document.createElement("div");
            actions.className = "event-actions";


            const editButton = document.createElement("button");

            editButton.className = "edit-btn";
            editButton.textContent = "Edit";

            editButton.addEventListener("click", function() {
                editEvent(index);
            });


            const deleteButton = document.createElement("button");

            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", function() {
                deleteEvent(index);
            });


            actions.append(
                status,
                editButton,
                deleteButton
            );

            card.append(details, actions);

            return card;

        }


        // DASHBOARD: UPCOMING EVENTS ONLY
        if (event.status === "Upcoming" || event.status === "Ongoing") {

            const matchesDashboardSearch =
                event.name.toLowerCase().includes(dashboardSearch) ||
                event.location.toLowerCase().includes(dashboardSearch) ||
                (event.category || "Other").toLowerCase().includes(dashboardSearch) ||
                (event.status || "Upcoming").toLowerCase().includes(dashboardSearch);

            if (matchesDashboardSearch) {
                eventList.appendChild(createCard());
            }

        }


        // MY EVENTS: ALL EVENTS
        const matchesEventsSearch =
            event.name.toLowerCase().includes(eventsSearch) ||
            event.location.toLowerCase().includes(eventsSearch) ||
            (event.category || "Other").toLowerCase().includes(eventsSearch) ||
            (event.status || "Upcoming").toLowerCase().includes(eventsSearch);

        if (matchesEventsSearch) {
            allEventsList.appendChild(createCard());
        }

    });


    // EMPTY MESSAGES
    if (eventList.children.length === 0) {

        eventList.innerHTML =
            '<p class="empty-message">No matching upcoming events.</p>';

    }

    if (allEventsList.children.length === 0) {

        allEventsList.innerHTML =
            '<p class="empty-message">No matching events found.</p>';

    }


    // UPDATE DASHBOARD STATISTICS
    document.getElementById("totalEvents").textContent =
        events.length;

    document.getElementById("upcomingEvents").textContent =
        upcoming;

    document.getElementById("totalGuests").textContent =
        totalGuests;

    document.getElementById("completedEvents").textContent =
        completed;

}


// =====================================
// EDIT EVENT
// =====================================

function editEvent(index) {

    const event = events[index];

    editingIndex = index;

    eventName.value = event.name;
    eventDate.value = event.date;
    eventLocation.value = event.location;
    eventGuests.value = event.guests;
    eventCategory.value = event.category || "Other";
    eventStatus.value = event.status || "Upcoming";

    modalTitle.textContent = "Edit Event";
    eventSubmit.textContent = "Update Event";

    modal.style.display = "flex";

}


// =====================================
// DELETE EVENT
// =====================================

function deleteEvent(index) {

    if (confirm("Are you sure you want to delete this event?")) {

        const deletedEvent = events[index].name;

        events.splice(index, 1);

        // Remove guests assigned to deleted event
        guests = guests.filter(function(guest) {
            return guest.event !== deletedEvent;
        });

        saveEvents();

        saveGuests();

        alert("Event deleted successfully!");

    }

}


// =====================================
// CREATE OR UPDATE EVENT
// =====================================

eventForm.addEventListener("submit", function(e) {

    e.preventDefault();

    const newEvent = {

        name: eventName.value.trim(),
        date: eventDate.value,
        location: eventLocation.value.trim(),
        guests: Number(eventGuests.value),
        category: eventCategory.value,
        status: eventStatus.value

    };


    if (editingIndex === null) {

        events.push(newEvent);

        alert("Event created successfully!");

    } else {

        const oldName = events[editingIndex].name;

        events[editingIndex] = newEvent;

        // Update guest event assignments if event name changes
        guests.forEach(function(guest) {

            if (guest.event === oldName) {
                guest.event = newEvent.name;
            }

        });

        saveGuests();

        alert("Event updated successfully!");

    }


    saveEvents();

    eventForm.reset();

    modal.style.display = "none";

    editingIndex = null;

});


// =====================================
// EVENT SEARCH
// =====================================

document.getElementById("dashboardSearch")
    .addEventListener("input", displayEvents);

document.getElementById("eventsSearch")
    .addEventListener("input", displayEvents);


// =====================================
// GUEST MANAGEMENT
// =====================================

const guestForm = document.getElementById("guestForm");

const guestName = document.getElementById("guestName");
const guestEmail = document.getElementById("guestEmail");
const guestEvent = document.getElementById("guestEvent");

const guestList = document.getElementById("guestList");


// SAVE GUESTS
function saveGuests() {

    localStorage.setItem(
        "guests",
        JSON.stringify(guests)
    );

    displayGuests();

}


// UPDATE EVENT DROPDOWN
function updateGuestEventOptions() {

    const selectedValue = guestEvent.value;

    guestEvent.innerHTML =
        '<option value="">Select an event</option>';

    events.forEach(function(event) {

        const option = document.createElement("option");

        option.value = event.name;
        option.textContent = event.name;

        guestEvent.appendChild(option);

    });

    if (events.some(function(event) {
        return event.name === selectedValue;
    })) {

        guestEvent.value = selectedValue;

    }

}


// DISPLAY GUESTS
function displayGuests() {

    guestList.innerHTML = "";

    const search = document.getElementById("guestSearch")
        .value.toLowerCase();

    const filteredGuests = guests
        .map(function(guest, index) {
            return { ...guest, originalIndex: index };
        })
        .filter(function(guest) {

            return guest.name.toLowerCase().includes(search) ||
                guest.email.toLowerCase().includes(search) ||
                guest.event.toLowerCase().includes(search);

        });


    if (filteredGuests.length === 0) {

        guestList.innerHTML =
            '<p class="empty-message">No matching guests found.</p>';

        return;

    }


    filteredGuests.forEach(function(guest) {

        const card = document.createElement("div");

        card.className = "event-card";

        const details = document.createElement("div");

        const name = document.createElement("h3");
        name.textContent = guest.name;

        const email = document.createElement("p");
        email.textContent = "Email: " + guest.email;

        const event = document.createElement("p");
        event.textContent = "Event: " + guest.event;

        details.append(name, email, event);


        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Remove";

        deleteButton.addEventListener("click", function() {

            if (confirm("Are you sure you want to remove this guest?")) {

                guests.splice(guest.originalIndex, 1);

                saveGuests();
                displayEvents();

            }

        });


        card.append(details, deleteButton);

        guestList.appendChild(card);

    });

}


// ADD GUEST
guestForm.addEventListener("submit", function(e) {

    e.preventDefault();

    const selectedEvent = guestEvent.value;

    if (!events.some(function(event) {
        return event.name === selectedEvent;
    })) {

        alert("Please select a valid event first.");
        return;

    }


    const newGuest = {

        name: guestName.value.trim(),
        email: guestEmail.value.trim(),
        event: selectedEvent

    };


    guests.push(newGuest);

    saveGuests();

    guestForm.reset();

    updateGuestEventOptions();

    displayGuests();

    displayEvents();

    alert("Guest added successfully!");

});


// GUEST SEARCH
document.getElementById("guestSearch")
    .addEventListener("input", displayGuests);


// =====================================
// SETTINGS
// =====================================

const settingsForm = document.getElementById("settingsForm");

const organizerName =
    document.getElementById("organizerName");

const organizerEmail =
    document.getElementById("organizerEmail");

const darkMode =
    document.getElementById("darkMode");


// LOAD SETTINGS
organizerName.value =
    localStorage.getItem("organizerName") || "Event Organizer";

organizerEmail.value =
    localStorage.getItem("organizerEmail") || "";

darkMode.checked =
    localStorage.getItem("darkMode") === "true";


// UPDATE SIDEBAR PROFILE
function updateProfile() {

    sidebarName.textContent =
        organizerName.value || "Event Organizer";

}

updateProfile();


// SAVE SETTINGS
settingsForm.addEventListener("submit", function(e) {

    e.preventDefault();

    localStorage.setItem(
        "organizerName",
        organizerName.value.trim()
    );

    localStorage.setItem(
        "organizerEmail",
        organizerEmail.value.trim()
    );

    updateProfile();

    alert("Settings saved successfully!");

});


// =====================================
// DARK MODE
// =====================================

function applyDarkMode() {

    document.body.classList.toggle(
        "dark-mode",
        darkMode.checked
    );

    localStorage.setItem(
        "darkMode",
        darkMode.checked
    );

}

darkMode.addEventListener("change", applyDarkMode);

applyDarkMode();


// =====================================
// INITIALIZE WEBSITE
// =====================================

updateGuestEventOptions();

displayEvents();

displayGuests();

showPage("dashboard");
