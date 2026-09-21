// =====================================================
// GEOAPIFY API KEY
// =====================================================

const GEOAPIFY_API_KEY = "11be815b43e7480994adf2ab605e9fb2";


// =====================================================
// VARIABLES
// =====================================================

let map;

let userLocation = null;

let destination = null;

let destinationMarker = null;

let userMarker = null;

let trackingId = null;

let selectedMode = "drive";


// =====================================================
// INITIALIZE MAP
// =====================================================

function initializeMap() {

    map = new maplibregl.Map({

        container: "map",

        style:
            `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${GEOAPIFY_API_KEY}`,

        center: [
            72.8777,
            19.0760
        ],

        zoom: 12
    });


    // Navigation controls

    map.addControl(
        new maplibregl.NavigationControl(),
        "top-right"
    );


    // Map loaded

    map.on("load", function () {

        console.log("MAP LOADED SUCCESSFULLY");

    });


    // Map error

    map.on("error", function (event) {

        console.error("MAP ERROR:", event);

    });
}


// =====================================================
// SEARCH PLACE
// =====================================================

async function searchPlace() {

    const input =
        document.getElementById("searchInput");

    const resultsContainer =
        document.getElementById("searchResults");

    const query =
        input.value.trim();


    if (!query) {

        resultsContainer.innerHTML = "";

        return;
    }


    resultsContainer.innerHTML =
        `<div class="search-result">
            Searching...
        </div>`;


    try {

        const url =
            `https://api.geoapify.com/v1/geocode/search` +
            `?text=${encodeURIComponent(query)}` +
            `&limit=5` +
            `&apiKey=${GEOAPIFY_API_KEY}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `Search API failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        displaySearchResults(
            data.features
        );

    } catch (error) {

        console.error(
            "SEARCH ERROR:",
            error
        );


        resultsContainer.innerHTML =
            `<div class="search-result">
                Search failed. Check API key.
            </div>`;
    }
}


// =====================================================
// DISPLAY SEARCH RESULTS
// =====================================================

function displaySearchResults(features) {

    const resultsContainer =
        document.getElementById("searchResults");


    if (!features || features.length === 0) {

        resultsContainer.innerHTML =
            `<div class="search-result">
                No places found.
            </div>`;

        return;
    }


    resultsContainer.innerHTML = "";


    features.forEach(function (feature) {

        const properties =
            feature.properties;


        const result =
            document.createElement("div");


        result.className =
            "search-result";


        result.innerHTML =
            properties.formatted ||
            "Unknown location";


        result.addEventListener(
            "click",
            function () {

                selectDestination(feature);

            }
        );


        resultsContainer.appendChild(result);

    });
}


// =====================================================
// SELECT DESTINATION
// =====================================================

function selectDestination(feature) {

    const coordinates =
        feature.geometry.coordinates;


    const longitude =
        coordinates[0];

    const latitude =
        coordinates[1];


    destination = {

        longitude:
            longitude,

        latitude:
            latitude
    };


    // Remove previous destination marker

    if (destinationMarker) {

        destinationMarker.remove();

    }


    // Create new marker

    destinationMarker =
        new maplibregl.Marker({
            color: "#0f766e"
        })
            .setLngLat([
                longitude,
                latitude
            ])
            .addTo(map);


    // Move map

    map.flyTo({

        center: [
            longitude,
            latitude
        ],

        zoom: 15,

        duration: 1000
    });


    // Clear search results

    document.getElementById(
        "searchResults"
    ).innerHTML = "";


    console.log(
        "DESTINATION:",
        destination
    );
}


// =====================================================
// GET CURRENT LOCATION
// =====================================================

function getCurrentLocation() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported by this browser."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            updateUserLocation(
                position
            );

        },

        function (error) {

            console.error(
                "LOCATION ERROR:",
                error
            );


            document.getElementById(
                "locationStatus"
            ).textContent =
                "Unable to get location";
        },

        {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0

        }
    );
}


// =====================================================
// UPDATE USER LOCATION
// =====================================================

function updateUserLocation(position) {

    const latitude =
        position.coords.latitude;

    const longitude =
        position.coords.longitude;

    const accuracy =
        position.coords.accuracy;


    userLocation = {

        latitude:
            latitude,

        longitude:
            longitude,

        accuracy:
            accuracy
    };


    // Update marker

    if (!userMarker) {

        userMarker =
            new maplibregl.Marker({
                color: "#000000"
            })
                .setLngLat([
                    longitude,
                    latitude
                ])
                .addTo(map);

    } else {

        userMarker.setLngLat([
            longitude,
            latitude
        ]);

    }


    // Move map

    map.flyTo({

        center: [
            longitude,
            latitude
        ],

        zoom: 15,

        duration: 800
    });


    // Update status

    document.getElementById(
        "locationStatus"
    ).textContent =
        `Location active • Accuracy ${Math.round(accuracy)} m`;


    document.getElementById(
        "statusDot"
    ).classList.add("active");


    console.log(
        "USER LOCATION:",
        userLocation
    );
}


// =====================================================
// START TRACKING
// =====================================================

function startTracking() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported."
        );

        return;
    }


    trackingId =
        navigator.geolocation.watchPosition(

            function (position) {

                updateUserLocation(
                    position
                );

            },

            function (error) {

                console.error(
                    "TRACKING ERROR:",
                    error
                );

            },

            {

                enableHighAccuracy: true,

                maximumAge: 2000,

                timeout: 10000

            }
        );


    const button =
        document.getElementById(
            "trackingBtn"
        );


    button.textContent =
        "Stop Tracking";


    button.classList.add(
        "stop"
    );
}


// =====================================================
// STOP TRACKING
// =====================================================

function stopTracking() {

    if (trackingId !== null) {

        navigator.geolocation.clearWatch(
            trackingId
        );

        trackingId = null;
    }


    const button =
        document.getElementById(
            "trackingBtn"
        );


    button.textContent =
        "Start Tracking";


    button.classList.remove(
        "stop"
    );


    document.getElementById(
        "locationStatus"
    ).textContent =
        "Tracking stopped";


    document.getElementById(
        "statusDot"
    ).classList.remove(
        "active"
    );
}


// =====================================================
// GET ROUTE
// =====================================================

async function getRoute() {

    if (!userLocation) {

        alert(
            "First click My Location or Start Tracking."
        );

        return;
    }


    if (!destination) {

        alert(
            "First search and select a destination."
        );

        return;
    }


    try {

        const start =
            `${userLocation.longitude},${userLocation.latitude}`;


        const end =
            `${destination.longitude},${destination.latitude}`;


        const url =
            `https://api.geoapify.com/v1/routing` +
            `?waypoints=${start}|${end}` +
            `&mode=${selectedMode}` +
            `&apiKey=${GEOAPIFY_API_KEY}`;


        console.log(
            "ROUTE REQUEST:",
            url
        );


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `Routing API failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        console.log(
            "ROUTE DATA:",
            data
        );


        displayRoute(data);

    } catch (error) {

        console.error(
            "ROUTE ERROR:",
            error
        );


        alert(
            "Unable to calculate route."
        );
    }
}


// =====================================================
// DISPLAY ROUTE
// =====================================================

function displayRoute(data) {

    if (
        !data.features ||
        data.features.length === 0
    ) {

        alert(
            "No route found."
        );

        return;
    }


    const route =
        data.features[0];


    const geometry =
        route.geometry;


    // Remove existing route

    if (
        map.getSource("route")
    ) {

        map.removeLayer(
            "route-line"
        );

        map.removeSource(
            "route"
        );
    }


    // Add route source

    map.addSource(
        "route",
        {

            type: "geojson",

            data: {

                type: "Feature",

                geometry: geometry

            }

        }
    );


    // Add route line

    map.addLayer({

        id: "route-line",

        type: "line",

        source: "route",

        layout: {

            "line-join": "round",

            "line-cap": "round"

        },

        paint: {

            "line-color": "#0f766e",

            "line-width": 6

        }

    });


    // Route summary

    const properties =
        route.properties;


    const distance =
        properties.distance;


    const time =
        properties.time;


    document.getElementById(
        "distance"
    ).textContent =
        formatDistance(distance);


    document.getElementById(
        "duration"
    ).textContent =
        formatDuration(time);


    // Directions

    displayDirections(
        properties
    );


    // Fit route

    fitRoute(
        geometry
    );
}


// =====================================================
// FORMAT DISTANCE
// =====================================================

function formatDistance(
    meters
) {

    if (meters < 1000) {

        return `${Math.round(meters)} m`;

    }


    return `${(
        meters / 1000
    ).toFixed(2)} km`;
}


// =====================================================
// FORMAT DURATION
// =====================================================

function formatDuration(
    seconds
) {

    const minutes =
        Math.round(
            seconds / 60
        );


    if (minutes < 60) {

        return `${minutes} min`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    const remainingMinutes =
        minutes % 60;


    return `${hours}h ${remainingMinutes}m`;
}


// =====================================================
// DISPLAY DIRECTIONS
// =====================================================

function displayDirections(
    properties
) {

    const directionsList =
        document.getElementById(
            "directionsList"
        );


    directionsList.innerHTML = "";


    let steps = [];


    if (
        properties.legs &&
        properties.legs.length > 0
    ) {

        properties.legs.forEach(
            function (leg) {

                if (leg.steps) {

                    steps =
                        steps.concat(
                            leg.steps
                        );

                }

            }
        );
    }


    document.getElementById(
        "directionCount"
    ).textContent =
        `${steps.length} steps`;


    if (steps.length === 0) {

        directionsList.innerHTML =
            `<p class="empty-message">
                No turn-by-turn instructions available.
            </p>`;

        return;
    }


    steps.forEach(
        function (step, index) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "direction-item";


            const instruction =
                step.instruction ||
                {};


            const text =
                instruction.text ||
                instruction.type ||
                "Continue";


            const distance =
                step.distance || 0;


            item.innerHTML = `

                <div class="direction-number">
                    ${index + 1}
                </div>

                <div class="direction-text">
                    ${text}
                </div>

                <div class="direction-distance">
                    ${formatDistance(distance)}
                </div>

            `;


            directionsList.appendChild(
                item
            );

        }
    );
}


// =====================================================
// FIT ROUTE ON MAP
// =====================================================

function fitRoute(
    geometry
) {

    const coordinates =
        geometry.coordinates;


    const bounds =
        new maplibregl.LngLatBounds();


    coordinates.forEach(
        function (coordinate) {

            bounds.extend(
                coordinate
            );

        }
    );


    map.fitBounds(
        bounds,
        {

            padding: 100,

            duration: 1000

        }
    );
}


// =====================================================
// CLEAR ROUTE
// =====================================================

function clearRoute() {

    if (
        map.getSource("route")
    ) {

        if (
            map.getLayer("route-line")
        ) {

            map.removeLayer(
                "route-line"
            );

        }


        map.removeSource(
            "route"
        );
    }


    document.getElementById(
        "distance"
    ).textContent = "—";


    document.getElementById(
        "duration"
    ).textContent = "—";


    document.getElementById(
        "directionsList"
    ).innerHTML =
        `<p class="empty-message">
            Search for a destination and get a route.
        </p>`;


    document.getElementById(
        "directionCount"
    ).textContent =
        "0 steps";
}


// =====================================================
// EVENTS
// =====================================================


// Search button

document.getElementById(
    "searchBtn"
).addEventListener(
    "click",
    searchPlace
);


// Enter key search

document.getElementById(
    "searchInput"
).addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            searchPlace();

        }

    }
);


// My location

document.getElementById(
    "locationBtn"
).addEventListener(
    "click",
    getCurrentLocation
);


// Tracking

document.getElementById(
    "trackingBtn"
).addEventListener(
    "click",
    function () {

        if (
            trackingId === null
        ) {

            startTracking();

        } else {

            stopTracking();

        }

    }
);


// Route

document.getElementById(
    "routeBtn"
).addEventListener(
    "click",
    getRoute
);


// Clear route

document.getElementById(
    "clearRouteBtn"
).addEventListener(
    "click",
    clearRoute
);


// Zoom in

document.getElementById(
    "zoomIn"
).addEventListener(
    "click",
    function () {

        map.zoomIn();

    }
);


// Zoom out

document.getElementById(
    "zoomOut"
).addEventListener(
    "click",
    function () {

        map.zoomOut();

    }
);


// Travel modes

document.querySelectorAll(
    ".mode-btn"
).forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                document
                    .querySelectorAll(
                        ".mode-btn"
                    )
                    .forEach(
                        function (btn) {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );


                button.classList.add(
                    "active"
                );


                selectedMode =
                    button.dataset.mode;


                console.log(
                    "MODE:",
                    selectedMode
                );

            }
        );

    }
);


// =====================================================
// START MAP
// =====================================================

initializeMap();