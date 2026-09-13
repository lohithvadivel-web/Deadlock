// vehicle-client/ui/map.js
// Handles the radar and nearby vehicle display.
//
// Step 8:
// Radar rendering is separated from main.js.


// --------------------------------------------------
// RADAR CONFIGURATION
// --------------------------------------------------

const RADAR_SIZE = 360;

const CENTER = RADAR_SIZE / 2;


// --------------------------------------------------
// VEHICLE DATA
// --------------------------------------------------

let vehicles = [
    {
        id: "V101",
        distance: 180,
        angle: 35,
        speed: 42,
        status: "SAFE"
    },

    {
        id: "V102",
        distance: 320,
        angle: 120,
        speed: 31,
        status: "WARNING"
    },

    {
        id: "V103",
        distance: 95,
        angle: 220,
        speed: 12,
        status: "CRITICAL"
    },

    {
        id: "V104",
        distance: 260,
        angle: 300,
        speed: 38,
        status: "SAFE"
    }
];


// --------------------------------------------------
// GET RADAR ELEMENT
// --------------------------------------------------

function getRadar() {

    const radar = document.getElementById("radar");

    if (!radar) {
        console.warn("Radar element not found.");
        return null;
    }

    return radar;
}


// --------------------------------------------------
// CONVERT DISTANCE TO RADAR POSITION
// --------------------------------------------------

function distanceToRadius(distance) {

    // Maximum radar range used by the vehicle UI.
    const MAX_DISTANCE = 500;

    // Keep vehicle inside the radar.
    const MAX_RADIUS = 145;

    const radius =
        (distance / MAX_DISTANCE) * MAX_RADIUS;

    return Math.min(radius, MAX_RADIUS);
}


// --------------------------------------------------
// CONVERT POLAR COORDINATES TO SCREEN POSITION
// --------------------------------------------------

function getVehiclePosition(distance, angle) {

    const radius =
        distanceToRadius(distance);

    const angleRadians =
        (angle - 90) * Math.PI / 180;

    const x =
        CENTER + radius * Math.cos(angleRadians);

    const y =
        CENTER + radius * Math.sin(angleRadians);

    return {
        x,
        y
    };
}


// --------------------------------------------------
// CREATE VEHICLE DOT
// --------------------------------------------------

function createVehicleDot(vehicle) {

    const dot =
        document.createElement("div");

    dot.classList.add("vehicle-dot");

    // Select colour/status.
    if (vehicle.status === "SAFE") {

        dot.classList.add(
            "vehicle-safe"
        );

    } else if (vehicle.status === "WARNING") {

        dot.classList.add(
            "vehicle-warning"
        );

    } else if (vehicle.status === "CRITICAL") {

        dot.classList.add(
            "vehicle-critical"
        );
    }


    const position =
        getVehiclePosition(
            vehicle.distance,
            vehicle.angle
        );


    dot.style.left =
        `${position.x}px`;

    dot.style.top =
        `${position.y}px`;


    dot.title =
        `${vehicle.id} — ${vehicle.distance}m`;


    return dot;
}


// --------------------------------------------------
// RENDER RADAR
// --------------------------------------------------

export function renderRadar() {

    const radar = getRadar();

    if (!radar) {
        return;
    }


    // Remove previously rendered vehicles.
    radar
        .querySelectorAll(".dynamic-vehicle")
        .forEach((element) => {
            element.remove();
        });


    vehicles.forEach((vehicle) => {

        const dot =
            createVehicleDot(vehicle);

        dot.classList.add(
            "dynamic-vehicle"
        );

        radar.appendChild(dot);
    });


    console.log(
        "Radar rendered:",
        vehicles.length,
        "vehicles"
    );
}


// --------------------------------------------------
// UPDATE VEHICLE LIST
// --------------------------------------------------

export function renderVehicleList() {

    const vehicleList =
        document.getElementById("vehList");

    if (!vehicleList) {
        console.warn(
            "Vehicle list element not found."
        );

        return;
    }


    vehicleList.innerHTML = "";


    vehicles.forEach((vehicle) => {

        const row =
            document.createElement("div");

        row.className =
            "vehicle-row";


        const statusClass =
            vehicle.status === "SAFE"
                ? "vehicle-safe"
                : vehicle.status === "WARNING"
                    ? "vehicle-warning"
                    : "vehicle-critical";


        row.innerHTML = `
            <div class="vehicle-info">

                <div class="mini-dot ${statusClass}">
                </div>

                <div>

                    <div class="vehicle-name">
                        Vehicle ${vehicle.id}
                    </div>

                    <div class="vehicle-meta">
                        ${vehicle.speed} km/h ·
                        ${vehicle.distance}m
                    </div>

                </div>

            </div>

            <div class="vehicle-status">
                ${vehicle.status}
            </div>
        `;


        vehicleList.appendChild(row);
    });
}


// --------------------------------------------------
// UPDATE VEHICLES
// --------------------------------------------------

export function setVehicles(newVehicles) {

    if (!Array.isArray(newVehicles)) {

        console.warn(
            "setVehicles expected an array."
        );

        return;
    }


    vehicles = newVehicles;

    renderRadar();

    renderVehicleList();
}


// --------------------------------------------------
// GET CURRENT VEHICLES
// --------------------------------------------------

export function getVehicles() {

    return [...vehicles];
}


// --------------------------------------------------
// INITIALIZE MAP
// --------------------------------------------------

export function initializeMap() {

    console.log(
        "Saathi radar/map initialized."
    );

    renderRadar();

    renderVehicleList();
}