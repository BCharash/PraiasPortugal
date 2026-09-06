//--------------------------------------------------
// Celestial Formatter
//
// Creates the visual representation of the sky.
// The graphic uses the fixed Portuguese azimuth
// coordinate system supplied by celestialService.js.
//--------------------------------------------------


function getSunDisplayGraphicPosition(sun) {
    return getAzimuthGraphicPosition(
        sun.displayAzimuth != null ? sun.displayAzimuth : sun.azimuth
    );
}

function getPathGraphicPosition(position, sunset, nextSunrise, weather) {
    if (!position.isBelowHorizon)
        return getAzimuthGraphicPosition(position.azimuth);

    if (!sunset || !nextSunrise || nextSunrise <= sunset)
        return getAzimuthGraphicPosition(position.azimuth);

    const sunsetPosition = calculateSolarPosition(
        sunset, weather.latitude, weather.longitude, weather.utcOffsetSeconds
    );
    const sunrisePosition = calculateSolarPosition(
        nextSunrise, weather.latitude, weather.longitude, weather.utcOffsetSeconds
    );

    if (!sunsetPosition || !sunrisePosition)
        return getAzimuthGraphicPosition(position.azimuth);

    const progress =
        Math.max(0, Math.min(1,
            (position._pathTime - sunset.getTime()) /
            (nextSunrise.getTime() - sunset.getTime())
        ));

    const relativeAzimuth =
        sunsetPosition.azimuth +
        (sunrisePosition.azimuth - sunsetPosition.azimuth) * progress;

    return getAzimuthGraphicPosition(relativeAzimuth);
}

function getBelowHorizonAltitudeRange(weather, sunrise) {

    if (!weather || !sunrise)
        return 20;

    const horizonTimes =
        getSolarHorizonTimes(
            sunrise,
            weather.latitude,
            weather.longitude,
            weather.utcOffsetSeconds
        );

    if (!horizonTimes?.sunset)
        return 20;

    const nextDay =
        new Date(
            sunrise.getFullYear(),
            sunrise.getMonth(),
            sunrise.getDate() + 1,
            12, 0, 0, 0, 0
        );

    const nextHorizon =
        getSolarHorizonTimes(
            nextDay,
            weather.latitude,
            weather.longitude,
            weather.utcOffsetSeconds
        );

    if (!nextHorizon?.sunrise)
        return 20;

    let minimumAltitude = 0;
    const samples = 96;

    for (let i = 0; i <= samples; i++) {

        const progress = i / samples;
        const time =
            new Date(
                horizonTimes.sunset.getTime() +
                progress *
                (nextHorizon.sunrise.getTime() - horizonTimes.sunset.getTime())
            );

        const position =
            calculateSolarPosition(
                time,
                weather.latitude,
                weather.longitude,
                weather.utcOffsetSeconds
            );

        if (position)
            minimumAltitude = Math.min(
                minimumAltitude,
                position.altitude
            );
    }

    // Keep a small floor so the mapping remains stable even in
    // unusual circumstances where the sampled minimum is shallow.
    return Math.max(1, Math.abs(minimumAltitude));

}


//--------------------------------------------------
// Celestial Graphic
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
        // Horizon = 0 degrees. Above-horizon altitude retains
        // the existing scale. Negative altitude is compressed
        // into the available 20% below the horizon.
        //--------------------------------------------------

        const belowHorizonAltitudeRange =
            getBelowHorizonAltitudeRange(
                weather,
                parseCelestialTime(weather.sunrise)
            );

        // Leave enough room at the bottom for the Sun disk and rays.
        // The curve itself still occupies the full conceptual night
        // band; the drawable altitude range ends just above the SVG edge.
        const belowHorizonBottomPadding = 22;
        const horizonY = graphicHeight * 0.80;
        const belowHorizonBottomY =
            Math.max(horizonY, graphicHeight - belowHorizonBottomPadding);
        const belowHorizonHeight =
            belowHorizonBottomY - horizonY;

        const altitudeToY =
            altitude => {

                if (altitude >= 0) {
                    return graphicHeight *
                        (0.80 - altitude / 100 * 0.80);
                }

                // Compress the complete negative-altitude range into
                // the available lower band, while reserving enough
                // space for the Sun graphic itself at the deepest point.
                const depth =
                    Math.min(1, Math.abs(altitude) / belowHorizonAltitudeRange);

                return horizonY + depth * belowHorizonHeight;
            };


        //--------------------------------------------------
        // Current Sun position
        //--------------------------------------------------

        const xPercent =
            getSunDisplayGraphicPosition(
                sun,
                weather
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

        const nextDay =
            sunrise
                ? new Date(
                    sunrise.getFullYear(),
                    sunrise.getMonth(),
                    sunrise.getDate() + 1,
                    12, 0, 0, 0
                )
                : null;

        const nextHorizon =
            nextDay
                ? getSolarHorizonTimes(
                    nextDay,
                    weather.latitude,
                    weather.longitude,
                    weather.utcOffsetSeconds
                )
                : null;

        const nextSunrise =
            nextHorizon?.sunrise || null;

        const pathPoints = [];
        const pathSegments = 96;

        const addPathPoint = (position, command) => {

            if (!position)
                return;

            const pathXPercent =
                getPathGraphicPosition(
                    position,
                    sunset,
                    nextSunrise,
                    weather
                );

            const pathX =
                graphicWidth * pathXPercent / 100;

            const pathY =
                altitudeToY(position.altitude);

            pathPoints.push(
                `${command} ${pathX} ${pathY}`
            );
        };

        // Above-horizon path: sunrise today -> sunset today.
        if (sunrise && sunset && sunset > sunrise) {

            for (let i = 0; i <= pathSegments; i++) {

                const progress = i / pathSegments;
                const localTime =
                    new Date(
                        sunrise.getTime() +
                        progress * (sunset.getTime() - sunrise.getTime())
                    );

                const position =
                    calculateSolarPosition(
                        localTime,
                        weather.latitude,
                        weather.longitude,
                        weather.utcOffsetSeconds
                    );

                if (position) {
                    if (i === 0 || i === pathSegments)
                        position.altitude = 0;

                    position._pathTime = localTime.getTime();
                    addPathPoint(position, i === 0 ? "M" : "L");
                }
            }
        }

        // Below-horizon path: sunset today -> sunrise tomorrow.
        // X is intentionally relative: right -> left.
        if (sunset && nextSunrise && nextSunrise > sunset) {

            for (let i = 1; i <= pathSegments; i++) {

                const progress = i / pathSegments;
                const localTime =
                    new Date(
                        sunset.getTime() +
                        progress * (nextSunrise.getTime() - sunset.getTime())
                    );

                const position =
                    calculateSolarPosition(
                        localTime,
                        weather.latitude,
                        weather.longitude,
                        weather.utcOffsetSeconds
                    );

                if (position) {
                    position.isBelowHorizon = true;
                    position._pathTime = localTime.getTime();
                    addPathPoint(position, "L");
                }
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


                <defs>
                    <!-- Below-horizon Sun imagery must never cross the horizon. -->
                    <clipPath id="sunBelowHorizonClip">
                        <rect
                            x="0"
                            y="${horizonY}"
                            width="${width}"
                            height="${Math.max(0, height - horizonY)}"
                        />
                    </clipPath>
                </defs>

                <g
                    opacity="${sun.isBelowHorizon ? 0.30 : 1}"
                    clip-path="${sun.isBelowHorizon ? 'url(#sunBelowHorizonClip)' : 'none'}"
                >

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
