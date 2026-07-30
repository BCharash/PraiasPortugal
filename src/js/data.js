//--------------------------------------------------
// Application Data
//--------------------------------------------------

let beachComplexes = [];
let beaches = [];


//--------------------------------------------------
// Data Initialization
//--------------------------------------------------

async function initializeData() {

    const complexResponse = await fetch("data/beach-complexes.json");
    beachComplexes = await complexResponse.json();

    const beachResponse = await fetch("data/beaches.json");
    beaches = await beachResponse.json();

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