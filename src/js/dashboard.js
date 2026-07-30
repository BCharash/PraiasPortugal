/*
 * dashboard.js
 *
 * Responsible for displaying the Dashboard.
 */

function initializeDashboard() {

    const dashboard = document.getElementById("dashboard");

    dashboard.innerHTML = `

        <h2>Dashboard</h2>

        <h3>Selected Beach</h3>

        <p id="dashboardBeachName">
            No beach selected
        </p>

        <h3>Alerts</h3>

        <p>No active alerts</p>

        <h3>Current Conditions</h3>

        <table>

            <tr>
                <td>🌡 Air</td>
                <td>--</td>

                <td>🌊 Sea</td>
                <td>--</td>
            </tr>

            <tr>
                <td>🌬 Wind</td>
                <td>--</td>

                <td>🏄 Surf</td>
                <td>--</td>
            </tr>

            <tr>
                <td>🌙 Tide</td>
                <td>--</td>

                <td>☀ UV</td>
                <td>--</td>
            </tr>

        </table>

    `;

    console.log("Dashboard initialized.");

}