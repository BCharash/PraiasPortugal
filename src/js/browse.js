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

    beachComplexSelect.innerHTML = "";

    const complexes =
        beachComplexes.filter(c => c.region === region);

    complexes.forEach(complex => {

        const option = document.createElement("option");

        option.value = complex.id;
        option.textContent = complex.name;

        beachComplexSelect.appendChild(option);

    });

    if (complexes.length > 0)
        populateBeaches(complexes[0].id);

}

function populateBeaches(beachComplexId) {

    beachSelect.innerHTML = "";

    const complex = findBeachComplex(beachComplexId);

    if (!complex)
        return;

    complex.beaches.forEach(beachId => {

        const beach = findBeach(beachId);

        if (!beach)
            return;

        const option = document.createElement("option");

        option.value = beach.id;
        option.textContent = beach.name;

        beachSelect.appendChild(option);

    });

    if (complex.beaches.length > 0)
        displayBeach(complex.beaches[0]);

}