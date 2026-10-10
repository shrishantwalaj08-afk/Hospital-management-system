
const getData = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
        return [];
    }
};

const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const getCurrentUser = () => {
    try {
        return JSON.parse(sessionStorage.getItem("currentUser") || "null");
    } catch {
        return null;
    }
};

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const appointmentForm = document.getElementById("appointmentForm");

const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");
const appointmentMessage = document.getElementById("appointmentMessage");

const appointmentDate = document.getElementById("appointmentDate");

function showMessage(element, message, success = false) {
    element.textContent = message;
    element.style.color = success ? "green" : "red";
}

function updatePage() {
    const user = getCurrentUser();
    const notice = document.getElementById("appointmentNotice");
    const logoutButton = document.getElementById("logoutBtn");

    if (user) {
        notice.textContent = "Logged in as " + user.name;
        logoutButton.hidden = false;
        document.getElementById("patientName").value = user.name;
    } else {
        notice.textContent = "Please log in before booking an appointment.";
        logoutButton.hidden = true;
        document.getElementById("appointmentList").textContent =
            "Please log in to view your appointments.";
    }

    renderAppointments();
}

signupForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;

    if (!name || !email || password.length < 6) {
        showMessage(signupMessage, "Enter valid details. Password must have at least 6 characters.");
        return;
    }

    const users = getData("hospitalUsers");

    if (users.some(user => user.email === email)) {
        showMessage(signupMessage, "This email is already registered.");
        return;
    }

    users.push({ name, email, password });
    saveData("hospitalUsers", users);

    signupForm.reset();
    showMessage(signupMessage, "Account created! You can now log in.", true);
});

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const users = getData("hospitalUsers");
    const user = users.find(
        item => item.email === email && item.password === password
    );

    if (!user) {
        showMessage(loginMessage, "Incorrect email or password.");
        return;
    }

    sessionStorage.setItem(
        "currentUser",
        JSON.stringify({ name: user.name, email: user.email })
    );

    loginForm.reset();
    showMessage(loginMessage, "Login successful!", true);
    updatePage();
});

function logout() {
    sessionStorage.removeItem("currentUser");
    appointmentForm.reset();
    appointmentMessage.textContent = "";
    updatePage();
}

function renderAppointments() {
    const list = document.getElementById("appointmentList");
    const user = getCurrentUser();

    if (!user) {
        list.textContent = "Please log in to view your appointments.";
        return;
    }

    const appointments = getData("hospitalAppointments")
        .filter(item => item.email === user.email);

    list.replaceChildren();

    if (appointments.length === 0) {
        list.textContent = "You have no appointments yet.";
        return;
    }

    appointments.forEach(appointment => {
        const card = document.createElement("div");
        card.className = "appointment-card";

        const details = [
            ["Patient", appointment.patientName],
            ["Doctor", appointment.doctor],
            ["Date", appointment.date],
            ["Time", appointment.time],
            ["Reason", appointment.reason]
        ];

        details.forEach(([label, value]) => {
            const paragraph = document.createElement("p");
            const strong = document.createElement("strong");
            strong.textContent = label + ": ";
            paragraph.append(strong, document.createTextNode(value));
            card.appendChild(paragraph);
        });

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "cancel-btn";
        cancelButton.textContent = "Cancel Appointment";

        cancelButton.addEventListener("click", function () {
            const remaining = getData("hospitalAppointments").filter(
                item => item.id !== appointment.id
            );

            saveData("hospitalAppointments", remaining);
            renderAppointments();
        });

        card.appendChild(cancelButton);
        list.appendChild(card);
    });
}

appointmentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const user = getCurrentUser();

    if (!user) {
        showMessage(appointmentMessage, "Please log in before booking.");
        return;
    }

    const patientName = document.getElementById("patientName").value.trim();
    const doctor = document.getElementById("doctor").value;
    const date = appointmentDate.value;
    const time = document.getElementById("appointmentTime").value;
    const reason = document.getElementById("reason").value.trim();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(date + "T00:00:00");

    if (selectedDate < today) {
        showMessage(appointmentMessage, "Please select today or a future date.");
        return;
    }

    const appointments = getData("hospitalAppointments");

    const slotTaken = appointments.some(item =>
        item.doctor === doctor &&
        item.date === date &&
        item.time === time
    );

    if (slotTaken) {
        showMessage(appointmentMessage, "This doctor's time slot is already booked.");
        return;
    }

    appointments.push({
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        email: user.email,
        patientName,
        doctor,
        date,
        time,
        reason
    });

    saveData("hospitalAppointments", appointments);

    appointmentForm.reset();
    document.getElementById("patientName").value = user.name;

    showMessage(appointmentMessage, "Appointment booked successfully!", true);
    renderAppointments();
});

const today = new Date();
const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");

appointmentDate.min = localToday;

updatePage();