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

function smoothstep(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
}

function getSunDiscReveal(sun) {

    if (!sun || !sun.localTime)
        return 1;

    const now = sun.localTime.getTime();

    // Sunrise/sunset supplied by the forecast belong to the forecast date.
    // The celestial simulation can move the displayed time to the following
    // calendar day, so compare wall-clock times on the same calendar date
    // as the Sun being displayed.
    const alignHorizonToSunDate = horizonTime => {
        if (!(horizonTime instanceof Date) || !sun.localTime)
            return null;

        const aligned = new Date(horizonTime.getTime());
        aligned.setFullYear(
            sun.localTime.getFullYear(),
            sun.localTime.getMonth(),
            sun.localTime.getDate()
        );
        return aligned.getTime();
    };

    const sunrise = alignHorizonToSunDate(sun.sunriseTime);
    const sunset = alignHorizonToSunDate(sun.sunsetTime);
    const transition = 5 * 60000;

    if (Number.isFinite(sunrise)) {
        const elapsed = now - sunrise;

        // Sunrise: 0% at sunrise, then 20/40/60/80/100%
        // at each successive minute.
        if (elapsed >= 0 && elapsed <= transition) {
            return Math.max(
                0,
                Math.min(1, elapsed / transition)
            );
        }
    }

    if (Number.isFinite(sunset)) {
        const remaining = sunset - now;

        // Sunset: 100% five minutes before sunset, then
        // 80/60/40/20%, reaching 0% exactly at sunset.
        if (remaining >= 0 && remaining <= transition) {
            return Math.max(
                0,
                Math.min(1, remaining / transition)
            );
        }
    }

    return 1;
}


function getSunGraphicY(
    sun,
    graphicHeight,
    horizonY,
    pixelsPerDegree
) {

    //--------------------------------------------------
    // The Sun remains on its astronomical vertical course.
    // Horizon crossing is handled visually by the disc reveal;
    // the Sun's calculated position is not altered.
    //--------------------------------------------------

    const normalY =
        graphicHeight *
        (0.80 - sun.altitude / 100 * 0.80);

    const SUN_VISUAL_RADIUS_PX = 21;

    const nightY =
        horizonY + SUN_VISUAL_RADIUS_PX;

    if (sun.isNightParked)
        return nightY;

    return normalY;
}

function getPathGraphicPosition(position, sunset, nextSunrise, weather) {
    if (!position.isNightParked)
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
        // The established daytime mapping is preserved. Only the
        // deliberately oversized Sun's horizon crossing uses a faster
        // visual scale. The transition is anchored to the same sunrise
        // and sunset timestamps displayed to the user.
        //--------------------------------------------------

        const horizonY = graphicHeight * 0.80;

        const SUN_DISC_RADIUS_PX = 12;
        const SUN_DISC_RADIUS_DEGREES = 0.27;

        const pixelsPerDegree =
            SUN_DISC_RADIUS_PX / SUN_DISC_RADIUS_DEGREES;

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


        // Preserve the exact daytime arc away from the horizon while
        // using the visual horizon-transition state around sunrise/sunset.
        const y =
            getSunGraphicY(
                sun,
                graphicHeight,
                horizonY,
                pixelsPerDegree
            );

        const sunsetDiscReveal =
            getSunDiscReveal(sun);

        const sunDiscTop =
            y - 12;

        const sunDiscRevealHeight =
            24 * sunsetDiscReveal;


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

        // Use the same civil sunrise/sunset timestamps displayed in the
        // conditions panel. The celestial graphic must not invent a second
        // set of horizon times.
        const sunrise =
            openMeteoSunrise;

        const sunset =
            openMeteoSunset;

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

            position.localTime =
                new Date(position._pathTime);
            position.sunriseTime =
                position._pathTime > sunset.getTime()
                    ? nextSunrise
                    : sunrise;
            position.sunsetTime =
                sunset;
            position.sunriseAltitude =
                calculateSolarPosition(
                    position.sunriseTime,
                    weather.latitude,
                    weather.longitude,
                    weather.utcOffsetSeconds
                )?.altitude ?? 0;
            position.sunsetAltitude =
                calculateSolarPosition(
                    sunset,
                    weather.latitude,
                    weather.longitude,
                    weather.utcOffsetSeconds
                )?.altitude ?? 0;
            position.latitude = weather.latitude;
            position.longitude = weather.longitude;
            position.utcOffsetSeconds = weather.utcOffsetSeconds;

            if (
                position._pathTime >= sunset.getTime() + 1 * 60000 &&
                position._pathTime <= nextSunrise.getTime() - 1 * 60000
            ) {
                position.isNightParked = true;
                position.isBelowHorizon = true;
            } else {
                position.isNightParked = false;
                position.isBelowHorizon =
                    position._pathTime >= sunset.getTime() + 4 * 60000;
            }

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
                getSunGraphicY(
                    position,
                    graphicHeight,
                    horizonY,
                    pixelsPerDegree
                );

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
        // The exact sunset minute remains on the astronomical arc for the
        // visual transition. Beginning one minute after sunset, the Sun
        // drops to the controlled horizontal nighttime track. The same
        // behavior reverses one minute before the following sunrise.
        if (sunset && nextSunrise && nextSunrise > sunset) {

            const sunsetPosition =
                calculateSolarPosition(
                    sunset,
                    weather.latitude,
                    weather.longitude,
                    weather.utcOffsetSeconds
                );

            const sunrisePosition =
                calculateSolarPosition(
                    nextSunrise,
                    weather.latitude,
                    weather.longitude,
                    weather.utcOffsetSeconds
                );

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
                    position.isBelowHorizon =
                        position.altitude < -SOLAR_DISC_RADIUS_DEGREES;

                    if (
                        position.isBelowHorizon &&
                        sunsetPosition &&
                        sunrisePosition
                    ) {
                        position.displayAzimuth =
                            sunsetPosition.azimuth +
                            (sunrisePosition.azimuth - sunsetPosition.azimuth) *
                            progress;
                    }

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
                    y1="${horizonY}"
                    x2="${width}"
                    y2="${horizonY}"
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

                    <!-- During sunrise, reveal only the portion of the
                         Sun graphic that has emerged above the horizon. -->
                    <clipPath id="sunAboveHorizonClip">
                        <rect
                            x="0"
                            y="0"
                            width="${width}"
                            height="${Math.max(0, horizonY)}"
                        />
                    </clipPath>

                    <!-- Sunrise disc reveal: the bright disc appears
                         evenly over the five minutes beginning at sunrise. -->
                    <clipPath id="sunriseDiscRevealClip">
                        <rect
                            x="${x - 12}"
                            y="${y - 12}"
                            width="24"
                            height="${24 * getSunDiscReveal(sun)}"
                        />
                    </clipPath>

                    <!-- Sunset disc reveal: the bright disc disappears
                         evenly over the five minutes leading to sunset. -->
                    <clipPath id="sunsetDiscRevealClip">
                        <rect
                            x="${x - 12}"
                            y="${sunDiscTop}"
                            width="24"
                            height="${sunDiscRevealHeight}"
                        />
                    </clipPath>
                </defs>

                <g
                    opacity="${sun.isBelowHorizon || (sun.sunsetTime && sun.localTime && sun.localTime.getTime() >= sun.sunsetTime.getTime() + 1 * 60000) ? 0.30 : 1}"
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
                        clip-path="${sun.sunsetTransition ? 'url(#sunsetDiscRevealClip)' : (sun.sunriseTransition ? 'url(#sunriseDiscRevealClip)' : 'none')}"
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
