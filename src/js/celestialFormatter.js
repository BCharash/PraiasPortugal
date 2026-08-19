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
        100;

    const height =
        60;


    //--------------------------------------------------
    // Sun
    //--------------------------------------------------

    if (celestialState.sun.isVisible) {

        
        const progress =
            celestialState.sun.position.progress;

        const x =
            10 + progress * 80;

        

        const arc =
            Math.sin(
                progress * Math.PI
            );

        const y =
            52 - arc * 38;

        return `

            <svg
                viewBox="0 0 ${width} ${height}"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >

               

                <g
                    transform="translate(${x} ${y}) scale(0.36 1) translate(${-x} ${-y})"
                >

    <circle
        cx="${x}"
        cy="${y}"
        r="13"
        fill="#ffd34d"
        opacity="0.12"
    />

    <circle
        cx="${x}"
        cy="${y}"
        r="8"
        fill="#ffd34d"
    />

    <g
        stroke="#ffd34d"
        stroke-width="2"
        stroke-linecap="round"
    >

        <line
            x1="${x}"
            y1="${y - 11}"
            x2="${x}"
            y2="${y - 15}"
        />

        <line
            x1="${x + 11}"
            y1="${y}"
            x2="${x + 15}"
            y2="${y}"
        />

        <line
            x1="${x}"
            y1="${y + 11}"
            x2="${x}"
            y2="${y + 15}"
        />

        <line
            x1="${x - 11}"
            y1="${y}"
            x2="${x - 15}"
            y2="${y}"
        />

                <line
            x1="${x + 7.8}"
            y1="${y - 7.8}"
            x2="${x + 10.6}"
            y2="${y - 10.6}"
        />

        <line
            x1="${x + 7.8}"
            y1="${y + 7.8}"
            x2="${x + 10.6}"
            y2="${y + 10.6}"
        />

        <line
            x1="${x - 7.8}"
            y1="${y + 7.8}"
            x2="${x - 10.6}"
            y2="${y + 10.6}"
        />

        <line
            x1="${x - 7.8}"
            y1="${y - 7.8}"
            x2="${x - 10.6}"
            y2="${y - 10.6}"
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