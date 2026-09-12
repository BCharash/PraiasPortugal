//--------------------------------------------------
// Celestial Formatter
//
// Creates the visual representation of the sky.
// The graphic uses the fixed Portuguese azimuth
// coordinate system supplied by celestialService.js.
//--------------------------------------------------


function getSunDisplayGraphicPosition(sun) {

    const isNightTime =
        sun?.localTime instanceof Date &&
        sun?.sunsetTime instanceof Date &&
        sun?.nextSunriseTime instanceof Date &&
        sun.localTime > sun.sunsetTime &&
        sun.localTime < sun.nextSunriseTime;

    if ((sun?.isBelowHorizon || sun?.isNightParked || isNightTime) &&
        Number.isFinite(sun.azimuth) &&
        Number.isFinite(sun.sunsetAzimuth) &&
        Number.isFinite(sun.sunriseAzimuth)) {

        return getNightProjectedX(
            sun.azimuth,
            sun.sunsetAzimuth,
            sun.sunriseAzimuth
        );
    }

    const azimuth =
        sun.displayAzimuth != null ? sun.displayAzimuth : sun.azimuth;

    // Daytime horizontal position is a linear astronomical azimuth scale
    // centered on south (180°).  It is deliberately independent of
    // latitude or east/west ground distance.
    return getAzimuthGraphicPosition(azimuth);
}

function normalizeSignedAngle(degrees) {
    let value = Number(degrees);
    if (!Number.isFinite(value))
        return 0;
    value = ((value + 180) % 360 + 360) % 360 - 180;
    return value;
}

function getNightProjectedX(azimuth, sunsetAzimuth, sunriseAzimuth) {

    // The Sun's astronomical azimuth increases with time in this
    // convention.  Therefore the nighttime arc must be the forward
    // (clockwise) arc from sunset to the following sunrise, not the
    // shortest signed arc between the two endpoints.
    //
    // This distinction is crucial in winter.  Near the winter solstice
    // the Sun travels approximately:
    //   southwest -> west -> north -> east -> southeast
    // so the azimuth crosses 360° and the nighttime arc is roughly 240°,
    // not the tempting -120° shortest path.
    const totalArc =
        ((Number(sunriseAzimuth) - Number(sunsetAzimuth)) % 360 + 360) % 360;

    if (totalArc < 0.0001)
        return getAzimuthGraphicPosition(sunsetAzimuth);

    // Unwrap the current azimuth onto that same forward branch.
    const traveled =
        ((Number(azimuth) - Number(sunsetAzimuth)) % 360 + 360) % 360;

    // Project the actual astronomical nighttime azimuth arc onto the
    // horizontal interval occupied by the daytime sunset/sunrise points.
    // The projection therefore preserves the winter turning point at
    // north instead of sending the Sun off the right edge and back onto
    // the left.  It is a projection of astronomical azimuth, not a
    // time-based interpolation.
    const progress = Math.max(0, Math.min(1, traveled / totalArc));

    const sunsetX = getAzimuthGraphicPosition(sunsetAzimuth);
    const sunriseX = getAzimuthGraphicPosition(sunriseAzimuth);

    return sunsetX + progress * (sunriseX - sunsetX);
}

function smoothstep(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
}

function getSunVisualState(sun) {

    if (!sun || !sun.localTime)
        return {
            discReveal: 1,
            graphicOpacity: 1,
            parkBelowHorizon: false
        };

    const now = new Date(sun.localTime.getTime());
    now.setSeconds(0, 0);

    const sunrise = sun.sunriseTime instanceof Date
        ? new Date(sun.sunriseTime.getTime())
        : null;

    const sunset = sun.sunsetTime instanceof Date
        ? new Date(sun.sunsetTime.getTime())
        : null;

    if (!sunrise || !sunset)
        return {
            discReveal: 1,
            graphicOpacity: 1,
            parkBelowHorizon: false
        };

    sunrise.setSeconds(0, 0);
    sunset.setSeconds(0, 0);

    const minute = 60000;
    const sunriseOffset = Math.round((now.getTime() - sunrise.getTime()) / minute);
    const sunsetOffset = Math.round((now.getTime() - sunset.getTime()) / minute);

    // Sunset sequence.
    if (sunsetOffset === -3)
        return { discReveal: 0.90, graphicOpacity: 1, parkBelowHorizon: false };
    if (sunsetOffset === -2)
        return { discReveal: 0.67, graphicOpacity: 1, parkBelowHorizon: false };
    if (sunsetOffset === -1)
        return { discReveal: 0.34, graphicOpacity: 1, parkBelowHorizon: false };
    if (sunsetOffset === 0)
        return { discReveal: 0.10, graphicOpacity: 1, parkBelowHorizon: false };
    if (sunsetOffset === 1)
        return { discReveal: 0, graphicOpacity: 1, parkBelowHorizon: false };

    // From sunset+2 through sunrise-2 the complete graphic is dimmed
    // and vertically parked below the horizon.
    if (sunsetOffset >= 2 || sunriseOffset <= -2)
        return { discReveal: 1, graphicOpacity: 0.30, parkBelowHorizon: true };

    // Sunrise sequence.
    if (sunriseOffset === -1)
        return { discReveal: 0, graphicOpacity: 1, parkBelowHorizon: false };
    if (sunriseOffset === 0)
        return { discReveal: 0.10, graphicOpacity: 1, parkBelowHorizon: false };
    if (sunriseOffset === 1)
        return { discReveal: 0.34, graphicOpacity: 1, parkBelowHorizon: false };
    if (sunriseOffset === 2)
        return { discReveal: 0.67, graphicOpacity: 1, parkBelowHorizon: false };
    if (sunriseOffset === 3)
        return { discReveal: 0.90, graphicOpacity: 1, parkBelowHorizon: false };

    return {
        discReveal: 1,
        graphicOpacity: 1,
        parkBelowHorizon: false
    };
}

function getSunDiscReveal(sun) {
    return getSunVisualState(sun).discReveal;
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

    // Fixed vertical scale: use nearly all available daytime height while
    // retaining a small top margin. 82 degrees covers Portugal's highest
    // possible midday solar altitude with a little visual headroom.
    const TOP_MARGIN_RATIO = 0.08;
    const HORIZON_RATIO = 0.80;
    const MAX_SOLAR_ALTITUDE = 82;
    const usableHeight =
        graphicHeight * (HORIZON_RATIO - TOP_MARGIN_RATIO);
    const pixelsPerAltitudeDegree =
        usableHeight / MAX_SOLAR_ALTITUDE;

    const normalY =
        graphicHeight * HORIZON_RATIO -
        sun.altitude * pixelsPerAltitudeDegree;

    const SUN_VISUAL_RADIUS_PX = 21;

    const nightY =
        horizonY + SUN_VISUAL_RADIUS_PX;

    if (getSunVisualState(sun).parkBelowHorizon)
        return nightY;

    return normalY;
}

function getPathGraphicPosition(position, sunset, nextSunrise, weather) {

    const isNightTime =
        position?.localTime instanceof Date &&
        sunset instanceof Date &&
        nextSunrise instanceof Date &&
        position.localTime > sunset &&
        position.localTime < nextSunrise;

    if ((position?.isBelowHorizon || position?.isNightParked || isNightTime) &&
        Number.isFinite(position.azimuth)) {

        const sunsetAzimuth =
            Number.isFinite(position.sunsetAzimuth)
                ? position.sunsetAzimuth
                : calculateSolarPosition(
                    sunset,
                    weather.latitude,
                    weather.longitude,
                    getPortugalUtcOffsetSeconds(sunset)
                )?.azimuth;

        const sunriseAzimuth =
            Number.isFinite(position.sunriseAzimuth)
                ? position.sunriseAzimuth
                : calculateSolarPosition(
                    nextSunrise,
                    weather.latitude,
                    weather.longitude,
                    getPortugalUtcOffsetSeconds(nextSunrise)
                )?.azimuth;

        if (Number.isFinite(sunsetAzimuth) &&
            Number.isFinite(sunriseAzimuth)) {
            return getNightProjectedX(
                position.azimuth,
                sunsetAzimuth,
                sunriseAzimuth
            );
        }
    }

    return getAzimuthGraphicPosition(position.azimuth);
}

function getBelowHorizonAltitudeRange(weather, sunrise) {

    if (!weather || !sunrise)
        return 20;

    const horizonTimes =
        getSolarHorizonTimes(
            sunrise,
            weather.latitude,
            weather.longitude,
            getPortugalUtcOffsetSeconds(sunrise)
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
            getPortugalUtcOffsetSeconds(nextDay)
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
                getPortugalUtcOffsetSeconds(time)
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

        // Use the same reveal value for the disk opacity. At the exact
        // sunrise/sunset minute this is 0, leaving only glow and rays.
        const sunDiscReveal = sunsetDiscReveal;

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

        // Use the date-aware horizon times carried by the celestial state.
        // These are the correct times for the simulator's displayed date,
        // not necessarily the date on which the weather forecast was loaded.
        const sunrise =
            sun.sunriseTime || null;

        const sunset =
            sun.sunsetTime || null;

        const nextSunrise =
            sun.nextSunriseTime || null;

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
                    getPortugalUtcOffsetSeconds(position.sunriseTime)
                )?.altitude ?? 0;
            position.sunsetAltitude =
                calculateSolarPosition(
                    sunset,
                    weather.latitude,
                    weather.longitude,
                    getPortugalUtcOffsetSeconds(sunset)
                )?.altitude ?? 0;
            position.latitude = weather.latitude;
            position.longitude = weather.longitude;
            position.utcOffsetSeconds = getPortugalUtcOffsetSeconds(position.localTime);

            if (
                position._pathTime >= sunset.getTime() + 2 * 60000 &&
                position._pathTime <= nextSunrise.getTime() - 2 * 60000
            ) {
                position.isNightParked = true;
                position.isBelowHorizon = true;
            } else {
                position.isNightParked = false;
                position.isBelowHorizon = false;
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
                        getPortugalUtcOffsetSeconds(localTime)
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
                    getPortugalUtcOffsetSeconds(sunset)
                );

            const sunrisePosition =
                calculateSolarPosition(
                    nextSunrise,
                    weather.latitude,
                    weather.longitude,
                    getPortugalUtcOffsetSeconds(nextSunrise)
                );

            let nightPathStarted = false;

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
                        getPortugalUtcOffsetSeconds(localTime)
                    );

                if (position) {
                    position.isBelowHorizon =
                        position.altitude < -SOLAR_DISC_RADIUS_DEGREES;

                    position._pathTime = localTime.getTime();

                    // Start the below-horizon track as a new subpath at
                    // sunset+2. This deliberately removes the diagonal
                    // connector from the sunset horizon to the nighttime
                    // horizontal azimuth track.
                    const parkStart = sunset.getTime() + 2 * 60000;
                    const command =
                        !nightPathStarted &&
                        localTime.getTime() >= parkStart
                            ? "M"
                            : "L";

                    if (command === "M")
                        nightPathStarted = true;

                    addPathPoint(position, command);
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


                <!-- Fixed geometric horizon: solid blue-green guide. -->
                <line
                    x1="0"
                    y1="${horizonY}"
                    x2="${width}"
                    y2="${horizonY}"
                    stroke="#4f9f9a"
                    stroke-width="1.5"
                    opacity="0.65"
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
                    opacity="${getSunVisualState(sun).graphicOpacity}"
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
                        opacity="${sunDiscReveal <= 0 ? 0 : 1}"
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
