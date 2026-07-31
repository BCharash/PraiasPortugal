//--------------------------------------------------
// Beach Header Widget
//--------------------------------------------------

function initializeBeachHeader() {

    const beachName = document.getElementById("dashboardBeachName");

    if (beachName) {
        beachName.textContent = "No beach selected";
    }

}


function updateBeachHeader(beach) {

    const beachName = document.getElementById("dashboardBeachName");

    if (!beachName) return;

    beachName.textContent = beach.name;

}