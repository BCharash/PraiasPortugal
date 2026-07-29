let beaches = [];
let selectedBeach = null;

const regionSelect = document.getElementById("regionSelect");
const beachSelect = document.getElementById("beachSelect");

async function loadBeaches() {
    const response = await fetch("data/beaches.json");
    beaches = await response.json();

    populateRegions();

    regionSelect.addEventListener("change", () => {
        populateBeaches(regionSelect.value);
    });

    beachSelect.addEventListener("change", () => {
        selectBeach(beachSelect.value);
    });
}

function populateRegions() {

    const regions = [...new Set(beaches.map(b => b.region))].sort();

    regionSelect.innerHTML = "";

    regions.forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
    });

    populateBeaches(regions[0]);
}

function populateBeaches(region) {

    beachSelect.innerHTML = "";

    const filtered = beaches.filter(b => b.region === region);

    filtered.forEach(beach => {

        const option = document.createElement("option");

        option.value = beach.id;
        option.textContent = beach.name;

        beachSelect.appendChild(option);

    });

    if (filtered.length > 0)
        selectBeach(filtered[0].id);

}

function selectBeach(id) {

    selectedBeach = beaches.find(b => b.id === id);

    displayBeach();

}

function displayBeach() {

    document.getElementById("region").textContent = selectedBeach.region;
    document.getElementById("municipality").textContent = selectedBeach.municipality;
    document.getElementById("district").textContent = selectedBeach.district;
    document.getElementById("latitude").textContent = selectedBeach.latitude;
    document.getElementById("longitude").textContent = selectedBeach.longitude;

}

loadBeaches();