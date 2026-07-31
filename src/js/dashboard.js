/*
 * --------------------------------------------------
 * dashboard.js
 * --------------------------------------------------
 *
 * Purpose:
 *     Coordinate the dashboard widgets.
 *
 * Responsibilities:
 *     - Initialize dashboard widgets.
 *     - Update dashboard widgets.
 */

//--------------------------------------------------
// Initialization
//--------------------------------------------------

function initializeDashboard() {

    initializeBeachHeader();
    initializeAlerts();
    initializeConditions();

}


//--------------------------------------------------
// Updates
//--------------------------------------------------

function updateDashboard(beach, weather) {

    updateBeachHeader(beach);
    updateAlerts(beach);
    updateConditions(weather);

}