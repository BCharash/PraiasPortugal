//--------------------------------------------------
// Background
//--------------------------------------------------

function updateBackground(condition) {

    const backgroundClasses = [
        "background-sunny",
        "background-cloudy",
        "background-rain",
        "background-storm",
        "background-night"
    ];

    // Remove any existing background theme
    document.body.classList.remove(...backgroundClasses);

    // Apply the requested theme
    document.body.classList.add(`background-${condition}`);

}