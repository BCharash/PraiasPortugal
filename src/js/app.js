//--------------------------------------------------
// User Interface
//--------------------------------------------------

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
// Application Entry Point
//--------------------------------------------------

initializeApplication();