//--------------------------------------------------
// Application Data
//--------------------------------------------------

let beachComplexes = [];
let beaches = [];

const regionSelect = document.getElementById("regionSelect");
const beachComplexSelect = document.getElementById("beachComplexSelect");
const beachSelect = document.getElementById("beachSelect");

const regionSpan = document.getElementById("region");
const municipalitySpan = document.getElementById("municipality");
const districtSpan = document.getElementById("district");
const latitudeSpan = document.getElementById("latitude");
const longitudeSpan = document.getElementById("longitude");


//--------------------------------------------------
// Application Startup
//--------------------------------------------------

async function loadData() {

    const complexResponse = await fetch("data/beach-complexes.json");
    beachComplexes = await complexResponse.json();

    const beachResponse = await fetch("data/beaches.json");
    beaches = await beachResponse.json();

    populateRegions();

    regionSelect.addEventListener("change", () => {
        populateBeachComplexes(regionSelect.value);
    });

    beachComplexSelect.addEventListener("change", () => {
        populateBeaches(beachComplexSelect.value);
    });

    beachSelect.addEventListener("change", () => {
        displayBeach(beachSelect.value);
    });

}

//--------------------------------------------------
// Domain Lookup
//--------------------------------------------------

function findBeach(id) {

    return beaches.find(beach => beach.id === id);

}

function findBeachComplex(id) {

    return beachComplexes.find(complex => complex.id === id);

}


//--------------------------------------------------
// Domain Lookup
//--------------------------------------------------

function findBeach(id) {

    return beaches.find(beach => beach.id === id);

}

function findBeachComplex(id) {

    return beachComplexes.find(complex => complex.id === id);

}


//--------------------------------------------------
// Beach Display
//--------------------------------------------------

function displayBeach(beachId) {

    const beach = findBeach(beachId);

    if (!beach)
        return;

    regionSpan.textContent = beach.region;
    municipalitySpan.textContent = beach.municipality;
    districtSpan.textContent = beach.district;
    latitudeSpan.textContent = beach.latitude ?? "";
    longitudeSpan.textContent = beach.longitude ?? "";

}


//--------------------------------------------------
// Application Entry Point
//--------------------------------------------------

loadData();