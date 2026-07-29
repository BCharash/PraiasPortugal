let beachComplexes = [];
let beaches = [];

const regionSelect = document.getElementById("regionSelect");
const beachSelect = document.getElementById("beachSelect");
const beachDetailSelect = document.getElementById("sectionSelect");

const regionSpan = document.getElementById("region");
const municipalitySpan = document.getElementById("municipality");
const districtSpan = document.getElementById("district");
const latitudeSpan = document.getElementById("latitude");
const longitudeSpan = document.getElementById("longitude");

async function loadData() {

    const complexResponse = await fetch("data/beach-complexes.json");
    beachComplexes = await complexResponse.json();

    const beachResponse = await fetch("data/beaches.json");
    beaches = await beachResponse.json();

    populateRegions();

    regionSelect.addEventListener("change", () => {
        populateBeachComplexes(regionSelect.value);
    });

    beachSelect.addEventListener("change", () => {
        populateBeaches(beachSelect.value);
    });

    beachDetailSelect.addEventListener("change", () => {
        displayBeach(beachDetailSelect.value);
    });

}

function populateRegions() {

    const regions =
        [...new Set(beachComplexes.map(c => c.region))].sort();

    regionSelect.innerHTML = "";

    regions.forEach(region => {

        const option = document.createElement("option");

        option.value = region;
        option.textContent = region;

        regionSelect.appendChild(option);

    });

    if (regions.length > 0)
        populateBeachComplexes(regions[0]);

}

function populateBeachComplexes(region) {

    beachSelect.innerHTML = "";

    const complexes =
        beachComplexes.filter(c => c.region === region);

    complexes.forEach(complex => {

        const option = document.createElement("option");

        option.value = complex.id;
        option.textContent = complex.name;

        beachSelect.appendChild(option);

    });

    if (complexes.length > 0)
        populateBeaches(complexes[0].id);

}

function populateBeaches(beachComplexId) {

    beachDetailSelect.innerHTML = "";

    const complex =
        beachComplexes.find(c => c.id === beachComplexId);

    if (!complex)
        return;

    complex.beaches.forEach(beachId => {

        const beach =
            beaches.find(b => b.id === beachId);

        if (!beach)
            return;

        const option = document.createElement("option");

        option.value = beach.id;
        option.textContent = beach.name;

        beachDetailSelect.appendChild(option);

    });

    if (complex.beaches.length > 0)
        displayBeach(complex.beaches[0]);

}

function displayBeach(beachId) {

    const beach =
        beaches.find(b => b.id === beachId);

    if (!beach)
        return;

    regionSpan.textContent = beach.region;
    municipalitySpan.textContent = beach.municipality;
    districtSpan.textContent = beach.district;
    latitudeSpan.textContent = beach.latitude;
    longitudeSpan.textContent = beach.longitude;

}

loadData();