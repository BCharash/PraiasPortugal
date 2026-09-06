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
    weather,
    graphicWidth,
    graphicHeight
) {

    if (!celestialState)
        return "";


    const width =
        graphicWidth;

    const height =
        graphicHeight;


    //--------------------------------------------------
    // Sun
    //--------------------------------------------------

    if (celestialState.sun.isVisible) {

        const progress =
            celestialState.sun.position.progress;


        //--------------------------------------------------
        // Sun position
        //
        // This is the existing sun trajectory.
        // The path below uses these exact same equations.
        //--------------------------------------------------

        const x =
            graphicWidth *
            (0.10 + progress * 0.80);


        const arc =
            Math.sin(
                progress * Math.PI
            );


        const y =
            graphicHeight *
            (0.87 - arc * 0.63);


        //--------------------------------------------------
        // Sun path
        //
        // Generate the dashed path from the exact same
        // mathematical curve used for the sun position.
        //--------------------------------------------------

        const pathPoints = [];

        const pathSegments = 40;


        for (let i = 0; i <= pathSegments; i++) {

            const pathProgress =
                i / pathSegments;


            const pathX =
                graphicWidth *
                (0.10 + pathProgress * 0.80);


            const pathArc =
                Math.sin(
                    pathProgress * Math.PI
                );


            const pathY =
                graphicHeight *
                (0.87 - pathArc * 0.63);


            pathPoints.push(
                `${i === 0 ? "M" : "L"} ${pathX} ${pathY}`
            );
        }


        const sunPath =
            pathPoints.join(" ");


        //--------------------------------------------------
        // SVG
        //--------------------------------------------------

        return `

            <svg
                viewBox="0 0 ${width} ${height}"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >

                <!--
                    Apparent path of the sun.
                    The path uses exactly the same trajectory
                    equation as the sun itself.
                -->

                <path
                    d="${sunPath}"
                    fill="none"
                    stroke="#ffd34d"
                    stroke-width="2"
                    stroke-dasharray="7 7"
                    stroke-linecap="round"
                    opacity="0.30"
                />


                <!--
                    Sun

                    Actual solar/lunar disk:
                    24 px diameter (r = 12).
                -->

                <g>

                    <!-- Soft solar glow -->

                    <circle
                        cx="${x}"
                        cy="${y}"
                        r="19"
                        fill="#ffd34d"
                        opacity="0.12"
                    />


                    <!-- Solar disk -->

                    <circle
                        cx="${x}"
                        cy="${y}"
                        r="12"
                        fill="#ffd34d"
                    />


                    <!--
                        Sun rays
                    -->

                    <g
                        stroke="#ffd34d"
                        stroke-width="2"
                        stroke-linecap="round"
                    >

                        <line
                            x1="${x}"
                            y1="${y - 15}"
                            x2="${x}"
                            y2="${y - 20}"
                        />

                        <line
                            x1="${x + 15}"
                            y1="${y}"
                            x2="${x + 20}"
                            y2="${y}"
                        />

                        <line
                            x1="${x}"
                            y1="${y + 15}"
                            x2="${x}"
                            y2="${y + 20}"
                        />

                        <line
                            x1="${x - 15}"
                            y1="${y}"
                            x2="${x - 20}"
                            y2="${y}"
                        />


                        <line
                            x1="${x + 11.0}"
                            y1="${y - 11.0}"
                            x2="${x + 15.0}"
                            y2="${y - 15.0}"
                        />

                        <line
                            x1="${x + 11.0}"
                            y1="${y + 11.0}"
                            x2="${x + 15.0}"
                            y2="${y + 15.0}"
                        />

                        <line
                            x1="${x - 11.0}"
                            y1="${y + 11.0}"
                            x2="${x - 15.0}"
                            y2="${y + 15.0}"
                        />

                        <line
                            x1="${x - 11.0}"
                            y1="${y - 11.0}"
                            x2="${x - 15.0}"
                            y2="${y - 15.0}"
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