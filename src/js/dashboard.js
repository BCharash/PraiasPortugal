/*
 * dashboard.js
 *
 * Coordinates the Dashboard.
 */

function initializeDashboard() {

    initializeBeachHeader();
    initializeAlerts();
    initializeConditions();

}

function updateDashboard(beach) {

    updateBeachHeader(beach);
    updateAlerts(beach);
    updateConditions(beach);

}