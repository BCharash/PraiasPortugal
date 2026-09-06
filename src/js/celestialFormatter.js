//--------------------------------------------------
// Celestial Formatter
//
// Projects real solar altitude/azimuth coordinates
// into the celestial sky graphic.
//--------------------------------------------------


//--------------------------------------------------
// Display Coordinate System
//--------------------------------------------------

const CELESTIAL_TOP_ALTITUDE =
    85;

const CELESTIAL_BOTTOM_ALTITUDE =
    -20;

const CELESTIAL_HORIZON_ALTITUDE =
    0;

const CELESTIAL_BELOW_HORIZON_ALTITUDE =
    -10;

const CELESTIAL_BODY_RADIUS =
    12;


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
    // Solar path
    //--------------------------------------------------

    let solarPath = "";


    if (
        weather &&
        Number.isFinite(Number(weather.latitude)) &&
        Number.isFinite(Number(weather.longitude))
    ) {

        const pathPoints =
            getSolarPath(
                new Date(),
                Number(weather.latitude),
                Number(weather.longitude)
            );


        let pathStarted = false;


        for (const point of pathPoints) {

            //--------------------------------------------------
            // The visible solar path is the portion above
            // the geometric horizon. Below-horizon solar
            // positions are represented separately by the
            // current body position.
            //--------------------------------------------------

            if (point.altitude < CELESTIAL_HORIZON_ALTITUDE) {

                pathStarted = false;
                continue;

            }


            const x =
                projectAzimuth(
                    point.azimuth,
                    graphicWidth
                );


            const y =
                projectAltitude(
                    point.altitude,
                    graphicHeight
                );


            solarPath +=
                `${pathStarted ? "L" : "M"} ${x} ${y} `;


            pathStarted = true;

        }

    }


    //--------------------------------------------------
    // Current Sun position
    //--------------------------------------------------

    let sunMarkup = "";


    const sunPosition =
        celestialState.sun.position;


    if (sunPosition) {

        const sunX =
            projectAzimuth(
                sunPosition.azimuth,
                graphicWidth
            );


        const displayedAltitude =
            sunPosition.altitude >=
            CELESTIAL_HORIZON_ALTITUDE
                ? sunPosition.altitude
                : CELESTIAL_BELOW_HORIZON_ALTITUDE;


        const sunY =
            projectAltitude(
                displayedAltitude,
                graphicHeight
            );


        const belowHorizon =
            sunPosition.altitude <
            CELESTIAL_HORIZON_ALTITUDE;


        const opacity =
            belowHorizon ? 0.38 : 1;


        sunMarkup = `

            <g opacity="${opacity}">

                <!-- Soft solar glow -->

                <circle
                    cx="${sunX}"
                    cy="${sunY}"
                    r="19"
                    fill="#ffd34d"
                    opacity="0.12"
                />


                <!-- Solar disk: 24 px diameter -->

                <circle
                    cx="${sunX}"
                    cy="${sunY}"
                    r="${CELESTIAL_BODY_RADIUS}"
                    fill="#ffd34d"
                />


                <!-- Sun rays -->

                <g
                    stroke="#ffd34d"
                    stroke-width="2"
                    stroke-linecap="round"
                >

                    <line
                        x1="${sunX}"
                        y1="${sunY - 15}"
                        x2="${sunX}"
                        y2="${sunY - 20}"
                    />

                    <line
                        x1="${sunX + 15}"
                        y1="${sunY}"
                        x2="${sunX + 20}"
                        y2="${sunY}"
                    />

                    <line
                        x1="${sunX}"
                        y1="${sunY + 15}"
                        x2="${sunX}"
                        y2="${sunY + 20}"
                    />

                    <line
                        x1="${sunX - 15}"
                        y1="${sunY}"
                        x2="${sunX - 20}"
                        y2="${sunY}"
                    />


                    <line
                        x1="${sunX + 11}"
                        y1="${sunY - 11}"
                        x2="${sunX + 15}"
                        y2="${sunY - 15}"
                    />

                    <line
                        x1="${sunX + 11}"
                        y1="${sunY + 11}"
                        x2="${sunX + 15}"
                        y2="${sunY + 15}"
                    />

                    <line
                        x1="${sunX - 11}"
                        y1="${sunY + 11}"
                        x2="${sunX - 15}"
                        y2="${sunY + 15}"
                    />

                    <line
                        x1="${sunX - 11}"
                        y1="${sunY - 11}"
                        x2="${sunX - 15}"
                        y2="${sunY - 15}"
                    />

                </g>

            </g>

        `;

    }


    //--------------------------------------------------
    // Horizon
    //--------------------------------------------------

    const horizonY =
        projectAltitude(
            CELESTIAL_HORIZON_ALTITUDE,
            graphicHeight
        );


    return `

        <svg
            viewBox="0 0 ${width} ${height}"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
        >

            <!--
                Real geometric horizon: altitude = 0°.
            -->

            <line
                x1="0"
                y1="${horizonY}"
                x2="${width}"
                y2="${horizonY}"
                stroke="#ffffff"
                stroke-width="1"
                opacity="0.22"
            />


            <!--
                Actual solar trajectory above the horizon.
                South is centered; North is the seam at the
                left/right edges.
            -->

            <path
                d="${solarPath}"
                fill="none"
                stroke="#ffd34d"
                stroke-width="2"
                stroke-dasharray="7 7"
                stroke-linecap="round"
                opacity="0.30"
            />


            ${sunMarkup}

        </svg>

    `;

}


//--------------------------------------------------
// Azimuth Projection
//
// South (180°) is centered.
// East (90°) is right.
// West (270°) is left.
// North (0°/360°) is the seam.
//--------------------------------------------------

function projectAzimuth(
    azimuth,
    graphicWidth
) {

    const signedDifference =
        ((
            azimuth -
            180 +
            540
        ) % 360) - 180;


    return graphicWidth * (
        0.5 -
        signedDifference / 360
    );

}


//--------------------------------------------------
// Altitude Projection
//--------------------------------------------------

function projectAltitude(
    altitude,
    graphicHeight
) {

    const clampedAltitude =
        Math.max(
            CELESTIAL_BOTTOM_ALTITUDE,
            Math.min(
                CELESTIAL_TOP_ALTITUDE,
                altitude
            )
        );


    const range =
        CELESTIAL_TOP_ALTITUDE -
        CELESTIAL_BOTTOM_ALTITUDE;


    return graphicHeight * (
        CELESTIAL_TOP_ALTITUDE -
        clampedAltitude
    ) / range;

}
