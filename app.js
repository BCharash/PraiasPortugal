let beaches = [];

async function loadBeaches() {
    const response = await fetch("data/beaches.json");
    beaches = await response.json();

    const select = document.getElementById("beachSelect");

    select.innerHTML = "";

    beaches.forEach(beach => {
        const option = document.createElement("option");
        option.value = beach.id;
        option.textContent = beach.name;
        select.appendChild(option);
    });

    // Display the first beach immediately
    showBeach();

    // Update when the selection changes
    select.addEventListener("change", showBeach);
}

function showBeach() {
    const select = document.getElementById("beachSelect");

    alert("Selected value = " + select.value);

    const beach = beaches.find(b => b.id === select.value);

    alert(JSON.stringify(beach));

    document.getElementById("latitude").textContent = beach.latitude;
    document.getElementById("longitude").textContent = beach.longitude;
}

loadBeaches();