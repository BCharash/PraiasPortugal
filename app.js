let beachComplexes = [];
let beaches = [];

const regionSelect = document.getElementById("regionSelect");

async function loadData() {

    const complexResponse =
        await fetch("data/beach-complexes.json");

    beachComplexes =
        await complexResponse.json();

    const beachResponse =
        await fetch("data/beaches.json");

    beaches =
        await beachResponse.json();

    populateRegions();

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

}

loadData();