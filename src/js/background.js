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

    document.body.classList.remove(...backgroundClasses);

    document.body.classList.add(`background-${condition}`);

}