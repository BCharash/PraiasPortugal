let beachComplexes = [];
let beaches = [];

async function loadData() {

    const complexResponse = await fetch("data/beach-complexes.json");
    beachComplexes = await complexResponse.json();

    const beachResponse = await fetch("data/beaches.json");
    beaches = await beachResponse.json();

    console.log("Beach Complexes:", beachComplexes);
    console.log("Beaches:", beaches);

}

loadData();