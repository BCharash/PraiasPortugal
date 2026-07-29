let beaches = [];
let selectedBeach = null;
let selectedSection = null;

const regionSelect = document.getElementById("regionSelect");
const beachSelect = document.getElementById("beachSelect");
const sectionSelect = document.getElementById("sectionSelect");

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

    sectionSelect.addEventListener("change", () => {
        selectSection(sectionSelect.value);
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

    populateSections();

}

function populateSections() {

    sectionSelect.innerHTML = "";

    selectedBeach.sections.forEach(section => {

        const option = document.createElement("option");

        option.value = section.id;
        option.textContent = section.name;

        sectionSelect.appendChild(option);

    });

    const defaultSection =
        selectedBeach.sections.find(s => s.isDefault) ??
        selectedBeach.sections[0];

    selectSection(defaultSection.id);

}

function selectSection(id) {

    selectedSection = selectedBeach.sections.find(s => s.id === id);

    displayBeach();

}

function displayBeach() {

    document.getElementById("region").textContent = selectedBeach.region;
    document.getElementById("municipality").textContent = selectedBeach.municipality;
    document.getElementById("district").textContent = selectedBeach.district;

    document.getElementById("latitude").textContent =
        selectedSection.latitude ?? "";

    document.getElementById("longitude").textContent =
        selectedSection.longitude ?? "";

}

loadBeaches();