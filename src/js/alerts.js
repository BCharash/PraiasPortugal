//--------------------------------------------------
// Alerts Widget
//--------------------------------------------------

function initializeAlerts() {

    const alerts = document.getElementById("dashboardAlerts");

    if (!alerts)
        return;

    alerts.textContent = "No active alerts";

}


function updateAlerts(beach) {

    const alerts = document.getElementById("dashboardAlerts");

    if (!alerts)
        return;

    // Placeholder until alert data is available.
    alerts.textContent = "No active alerts";

}