//--------------------------------------------------
// Celestial Formatter
//
// Creates the visual representation of the sky.
// The graphic uses the fixed Portuguese azimuth
// coordinate system supplied by celestialService.js.
//--------------------------------------------------


function renderCelestialGraphic(
    celestialState,
    weather,
    graphicWidth,
    graphicHeight
) {

    if (!celestialState)
        return "";


    const width = graphicWidth;
    const height = graphicHeight;


    //--------------------------------------------------
    // Sun
    //--------------------------------------------------

    if (
        celestialState.sun &&
        celestialState.sun.position
    ) {

        const sun =
            celestialState.sun.position;


        //--------------------------------------------------
        // Fixed vertical coordinate system
        //
        // Horizon = 0 degrees.
        // Display range = +80 to -20 degrees.
        //--------------------------------------------------

        const altitudeToY =
            altitude =>
                graphicHeight *
                (0.80 - altitude / 100 * 0.80);


        //--------------------------------------------------
        // Current Sun position
        //--------------------------------------------------

        const xPercent =
            getAzimuthGraphicPosition(
                sun.azimuth
            );


        const x =
            graphicWidth *
            xPercent / 100;


        const y =
            altitudeToY(
                sun.altitude
            );


        //--------------------------------------------------
        // Sun path
        //
        // Use the same solar-position calculation as the current Sun.
        // The path is sampled between the supplied civil sunrise and
        // sunset times.  The first and last points are explicitly the
        // geometric horizon (altitude = 0).  No baseline correction is
        // applied to the interior of the curve.
        //--------------------------------------------------

        const openMeteoSunrise =
            parseCelestialTime(weather.sunrise);

        const openMeteoSunset =
            parseCelestialTime(weather.sunset);

        const horizonTimes =
            getSolarHorizonTimes(
                openMeteoSunrise || new Date(),
                weather.latitude,
                weather.longitude,
                weather.utcOffsetSeconds
            );

        const sunrise =
            horizonTimes?.sunrise || openMeteoSunrise;

        const sunset =
            horizonTimes?.sunset || openMeteoSunset;

        const pathPoints = [];
        const pathSegments = 96;

        if (sunrise && sunset && sunset > sunrise) {

            for (let i = 0; i <= pathSegments; i++) {

                const progress =
                    i / pathSegments;

                const localTime =
                    new Date(
                        sunrise.getTime() +
                        progress *
                        (sunset.getTime() - sunrise.getTime())
                    );

                const position =
                    calculateSolarPosition(
                        localTime,
                        weather.latitude,
                        weather.longitude,
                        weather.utcOffsetSeconds
                    );

                if (!position)
                    continue;

                const pathXPercent =
                    getAzimuthGraphicPosition(
                        position.azimuth
                    );

                const pathX =
                    graphicWidth * pathXPercent / 100;

                // The path is sampled between the geometric horizon
                // crossings, so altitude is used directly for every point.
                const pathAltitude =
                    position.altitude;

                const pathY =
                    altitudeToY(pathAltitude);

                pathPoints.push(
                    `${i === 0 ? "M" : "L"} ${pathX} ${pathY}`
                );
            }
        }

        const sunPath =
            pathPoints.join(" ");


        return `

            <svg
                viewBox="0 0 ${width} ${height}"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >

                <path
                    d="${sunPath}"
                    fill="none"
                    stroke="#ffd34d"
                    stroke-width="2"
                    stroke-dasharray="7 7"
                    stroke-linecap="round"
                    opacity="0.30"
                />

                <!-- Temporary horizon guide: altitude = 0 degrees -->
                <line
                    x1="0"
                    y1="${altitudeToY(0)}"
                    x2="${width}"
                    y2="${altitudeToY(0)}"
                    stroke="#ffffff"
                    stroke-width="1"
                    stroke-dasharray="4 5"
                    opacity="0.28"
                />


                <g>

                    <!-- Soft glow -->
                    <circle
                        cx="${x}"
                        cy="${y}"
                        r="19"
                        fill="#ffd34d"
                        opacity="0.12"
                    />

                    <!-- 24 px Sun disk -->
                    <circle
                        cx="${x}"
                        cy="${y}"
                        r="12"
                        fill="#ffd34d"
                    />

                    <!-- Sun rays -->
                    <g
                        stroke="#ffd34d"
                        stroke-width="2"
                        stroke-linecap="round"
                    >

                        <line x1="${x}" y1="${y - 15}" x2="${x}" y2="${y - 20}" />
                        <line x1="${x + 15}" y1="${y}" x2="${x + 20}" y2="${y}" />
                        <line x1="${x}" y1="${y + 15}" x2="${x}" y2="${y + 20}" />
                        <line x1="${x - 15}" y1="${y}" x2="${x - 20}" y2="${y}" />

                        <line x1="${x + 10.6}" y1="${y - 10.6}" x2="${x + 14.2}" y2="${y - 14.2}" />
                        <line x1="${x + 10.6}" y1="${y + 10.6}" x2="${x + 14.2}" y2="${y + 14.2}" />
                        <line x1="${x - 10.6}" y1="${y + 10.6}" x2="${x - 14.2}" y2="${y + 14.2}" />
                        <line x1="${x - 10.6}" y1="${y - 10.6}" x2="${x - 14.2}" y2="${y - 14.2}" />

                    </g>

                </g>

            </svg>

        `;

    }


    return "";

}
