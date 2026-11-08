/*
--------------------------------------------------
display.js
--------------------------------------------------

Purpose:

    Display information in the user interface.

Responsibilities:

    - Display information about the selected beach.

This module should not:

    - Load data.
    - Search for data.
    - Start the application.

*/

//--------------------------------------------------
// Display Helpers
//--------------------------------------------------

/*
Display text in an HTML element.

Parameters:

    element - The HTML element to update.

    value   - The value to display.

If the value is null or undefined, an empty string
is displayed instead.
*/

function setText(element, value) {

    element.textContent = value ?? "";

}


//--------------------------------------------------
// Beach Display
//--------------------------------------------------

/*
Display the information for the selected beach.

Parameters:

    beachId - The unique identifier of the beach.

*/

let beachDisplayGeneration = 0;

// Re-render accepted state only. Never fetch on units/language/text-size changes.
function renderCurrentDashboard() {
    const data = currentDashboardData;
    if (!data || appState.selectedBeachId !== data.beach.id) return;
    if (data.weather) {
        const weather = data.weather;
        const state = weatherState.evaluate({beachId:weather.requestedBeachId,
            latitude:weather.requestedLatitude, longitude:weather.requestedLongitude,
            conditionTimeMs:weather.conditionTimeMs, fetchedAtMs:weather.fetchedAtMs, weather}, data.beach, Date.now());
        data.weather = state.weather;
        data.weatherStatus = {...data.weatherStatus, freshness:state.status};
    }
    if (appState.currentPage === "dashboard") updateDashboard(data);
}

async function displayBeach(beachId, {forceWeather = false} = {}) {
    const found = findBeach(beachId);
    if (!found || appState.selectedBeachId !== found.id) return;
    const beach = {...found};
    const generation = ++beachDisplayGeneration;
    const current = () => generation === beachDisplayGeneration && appState.selectedBeachId === beach.id &&
        findBeach(beach.id)?.latitude === beach.latitude && findBeach(beach.id)?.longitude === beach.longitude;
    const data = {beach, weather:getDatasetData("weather",beach), marine:null, tide:null,
        weatherStatus:getDataStatus("weather",beach), weatherPending:true,
        marineStatus:"loading", marinePending:true};
    currentDashboardData = data;
    setText(regionSpan, beach.region);
    setText(municipalitySpan, beach.municipality);
    setText(districtSpan, beach.district);
    setText(latitudeSpan, beach.latitude);
    setText(longitudeSpan, beach.longitude);
    const link = document.getElementById("viewOnMapLink");
    if (link) link.href = `https://www.google.com/maps/search/?api=1&query=${beach.latitude},${beach.longitude}`;
    updateFavoriteButton();
    renderCurrentDashboard();

    const weatherWork = refreshWeatherDataset(beach, {force:forceWeather}).then(result => {
        if (!current() || !isWeatherResultActive(result)) return;
        data.weather = isWeatherResultCurrent(result) ? result.data : null;
        data.weatherStatus = getDataStatus("weather",beach);
        data.weatherPending = false;
        renderCurrentDashboard();
    }, error => {
        if (!current()) return;
        data.weather = null;
        data.weatherStatus = {freshness:"unavailable", refreshStatus:"error", error};
        data.weatherPending = false;
        renderCurrentDashboard();
    });
    const marineWork = (async () => {
        try {
            const marine = await getCurrentMarineConditions(beach);
            if (!current()) return;
            data.tide = getTideInformation(marine);
            data.marine = marine;
            data.marineStatus = marine ? "ready" : "unavailable";
        } catch (error) {
            if (!current()) return;
            data.marine = null; data.tide = null; data.marineStatus = "error";
        }
        if (!current()) return;
        data.marinePending = false;
        renderCurrentDashboard();
    })();
    await Promise.all([weatherWork, marineWork]);
}
