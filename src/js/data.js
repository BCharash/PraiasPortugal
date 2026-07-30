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


//--------------------------------------------------
// Data Queries
//--------------------------------------------------

/*
 * Return a sorted list of all regions.
 *
 * Returns:
 *     An array containing the unique region names.
 */
function getRegions() {

    return [...new Set(beachComplexes.map(c => c.region))].sort();

}

/*
 * Return the beach complexes in a region.
 *
 * Parameters:
 *     region - The region to search.
 *
 * Returns:
 *     An array of beach complexes.
 */
function getBeachComplexes(region) {

    return beachComplexes.filter(
        complex => complex.region === region
    );

}

/*
 * Return the beaches belonging to a beach complex.
 *
 * Parameters:
 *     beachComplexId - The beach complex to search.
 *
 * Returns:
 *     An array of beach objects.
 */
function getBeaches(beachComplexId) {

    const complex = findBeachComplex(beachComplexId);

    if (!complex)
        return [];

    return complex.beaches
        .map(beachId => findBeach(beachId))
        .filter(beach => beach !== undefined);

}