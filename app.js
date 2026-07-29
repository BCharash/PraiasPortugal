let beachComplexes = [];
let beaches = [];

const regionSelect = document.getElementById("regionSelect");
const beachSelect = document.getElementById("beachSelect");

async function loadData() {

    const complexResponse = await fetch("data/beach-complexes.json");
    beachComplexes = await complexResponse.json();

    const beachResponse = await fetch("data/beaches.json");
    beaches = await beachResponse.json();

    populateRegions();

    regionSelect.addEventListener("change", () => {
        populateBeachComplexes(regionSelect.value);
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

}

loadData();