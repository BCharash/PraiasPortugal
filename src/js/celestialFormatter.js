//--------------------------------------------------
// Celestial Formatter
//
// Creates the visual representation of the sky.
//--------------------------------------------------


//--------------------------------------------------
// Public Functions
//--------------------------------------------------

function renderCelestialGraphic(
    celestialState,
    weather
) {

    if (!celestialState)
        return "";


    const width =
        96;

    const height =
        72;


    //--------------------------------------------------
    // Sun
    //--------------------------------------------------

    if (celestialState.sun.isVisible) {

        const x =
            celestialState.sun.position.x;

        const y =
            celestialState.sun.position.y;


        return `

            <svg
                viewBox="0 0 ${width} ${height}"
                width="${width}"
                height="${height}"
                xmlns="http://www.w3.org/2000/svg"
            >

                <g>

    <circle
        cx="${x}"
        cy="${y}"
        r="20"
        fill="#ffd34d"
        opacity="0.12"
    />

    <circle
        cx="${x}"
        cy="${y}"
        r="13"
        fill="#ffd34d"
    />

    <g
        stroke="#ffd34d"
        stroke-width="2"
        stroke-linecap="round"
    >

        <line
            x1="${x}"
            y1="${y - 18}"
            x2="${x}"
            y2="${y - 23}"
        />

        <line
            x1="${x + 18}"
            y1="${y}"
            x2="${x + 23}"
            y2="${y}"
        />

        <line
            x1="${x}"
            y1="${y + 18}"
            x2="${x}"
            y2="${y + 23}"
        />

        <line
            x1="${x - 18}"
            y1="${y}"
            x2="${x - 23}"
            y2="${y}"
        />

        <line
            x1="${x + 13}"
            y1="${y - 13}"
            x2="${x + 17}"
            y2="${y - 17}"
        />

        <line
            x1="${x + 13}"
            y1="${y + 13}"
            x2="${x + 17}"
            y2="${y + 17}"
        />

        <line
            x1="${x - 13}"
            y1="${y + 13}"
            x2="${x - 17}"
            y2="${y + 17}"
        />

        <line
            x1="${x - 13}"
            y1="${y - 13}"
            x2="${x - 17}"
            y2="${y - 17}"
        />

    </g>

</g>

            </svg>

        `;

    }


    //--------------------------------------------------
    // Nothing yet for night
    //--------------------------------------------------

    return "";

}