/*
 * dashboard.js
 *
 * Coordinates the Dashboard.
 */

function initializeDashboard() {

    initializeBeachHeader();
    initializeAlerts();

}

function updateDashboard(beach) {

    updateBeachHeader(beach);
    updateAlerts(beach);

}