//--------------------------------------------------
// Application Data
//--------------------------------------------------

let areas = [];
let beaches = [];


//--------------------------------------------------
// Data Initialization
//--------------------------------------------------

async function initializeData() {

    const areaResponse =
        await fetch("data/areas.json");

    areas =
        await areaResponse.json();


    const beachResponse =
        await fetch("data/beaches.json");

    beaches =
        await beachResponse.json();

}


//--------------------------------------------------
// Domain Lookup
//--------------------------------------------------

function findBeach(id) {

    return beaches.find(
        beach => beach.id === id
    );

}


function findArea(id) {

    return areas.find(
        area => area.id === id
    );

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

    return [
        ...new Set(
            areas.map(
                area => area.region
            )
        )
    ].sort();

}


/*
 * Return the areas in a region.
 *
 * Parameters:
 *     region - The region to search.
 *
 * Returns:
 *     An array of areas.
 */

function getAreas(region) {

    return areas.filter(
        area => area.region === region
    );

}


/*
 * Return the beaches belonging to an area.
 *
 * Parameters:
 *     areaId - The area to search.
 *
 * Returns:
 *     An array of beach objects.
 */

function getBeaches(areaId) {

    const area =
        findArea(areaId);


    if (!area)
        return [];


    return area.beaches
        .map(
            beachId =>
                findBeach(beachId)
        )
        .filter(
            beach =>
                beach !== undefined
        );

}