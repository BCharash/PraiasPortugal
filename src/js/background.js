//
// background.js
//
// Controls the visual background of the application.
//

const BACKGROUND_CLASSES = [
    "background-sunny",
    "background-cloudy",
    "background-rain",
    "background-storm",
    "background-night"
];

export function updateBackground(condition) {

    // Remove any existing background theme
    document.body.classList.remove(...BACKGROUND_CLASSES);

    // Apply the new theme
    document.body.classList.add(`background-${condition}`);
}