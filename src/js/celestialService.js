//--------------------------------------------------
// Celestial Service
//
// Calculates the astronomical state of the Sun and
// Moon and supplies the coordinates used by the sky
// graphic.
//--------------------------------------------------


//--------------------------------------------------
// Fixed Portuguese display envelope
//--------------------------------------------------

// South is the horizontal center of the graphic.
// The display extends approximately 132 degrees to
// either side of South. This is sufficient to contain
// the maximum solar/lunar azimuth excursion anywhere
// in mainland Portugal throughout the year.
const CELESTIAL_AZIMUTH_HALF_RANGE = 132;

// Apparent solar-disc radius used only for the visual horizon transition.
const SOLAR_DISC_RADIUS_DEGREES = 0.27;


//--------------------------------------------------
// Public Functions
//--------------------------------------------------

function getCelestialState(weather) {

    if (!weather)
        return null;

    const now =
        parseCelestialTime(
            getCelestialSimulationTime(
                weather.currentTime,
                weather.sunrise
            )
        );

    if (!now)
        return null;

    //--------------------------------------------------
    // Resolve the complete sunrise-to-sunrise cycle for
    // the actual date represented by `now`.
    //
    // This is deliberately independent of application
    // history. The state is determined entirely from the
    // requested date/time and the beach coordinates.
    //--------------------------------------------------

    const cycle =
        resolveCelestialCycle(
            now,
            weather
        );

    //--------------------------------------------------
    // Sun
    //--------------------------------------------------

    let sunPosition = null;

    if (cycle) {

        sunPosition =
            getSunDisplayPosition(
                now,
                cycle.sunrise,
                cycle.sunset,
                cycle.nextSunrise,
                weather.latitude,
                weather.longitude,
                weather.utcOffsetSeconds,
                cycle.presentationState
            );

    }

    const sunIsVisible =
        cycle &&
        now >= cycle.sunrise &&
        now <= cycle.sunset;

    //--------------------------------------------------
    // Moon
    //--------------------------------------------------

    const moonrise =
        parseCelestialTime(weather.moonrise);

    const moonset =
        parseCelestialTime(weather.moonset);

    const moonIsVisible =
        moonrise !== null &&
        moonset !== null &&
        isCelestialTimeBetween(
            now,
            moonrise,
            moonset
        );

    //--------------------------------------------------
    // Moon phase
    //--------------------------------------------------

    const moonPhase =
        normalizeMoonPhase(
            weather.moonPhase
        );

    const moonIllumination =
        calculateMoonIllumination(
            moonPhase
        );

    return {

        azimuthHalfRange:
            CELESTIAL_AZIMUTH_HALF_RANGE,

        currentTime:
            now,

        sun: {

            isVisible:
                sunIsVisible,

            presentationState:
                cycle?.presentationState || null,

            position:
                sunPosition

        },

        moon: {

            isVisible:
                moonIsVisible,

            phase:
                moonPhase,

            illumination:
                moonIllumination,

            phaseName:
                getMoonPhaseName(
                    moonPhase
                ),

            position:
                null

        }

    };

}


//--------------------------------------------------
// Celestial cycle resolution
//
// Given an absolute local civil date/time, determine
// the surrounding sunrise/sunset events. This makes
// celestial presentation deterministic for any date,
// including after midnight and during transitions.
//--------------------------------------------------

function resolveCelestialCycle(now, weather) {

    if (
        !now ||
        weather?.latitude == null ||
        weather?.longitude == null
    )
        return null;

    const makeDate = (offsetDays, hour = 12) => {
        const date = new Date(now.getTime());
        date.setHours(hour, 0, 0, 0);
        date.setDate(date.getDate() + offsetDays);
        return date;
    };

    const previousDay =
        makeDate(-1);

    const currentDay =
        makeDate(0);

    const nextDay =
        makeDate(1);

    const previousHorizon =
        getSolarHorizonTimes(
            previousDay,
            weather.latitude,
            weather.longitude,
            weather.utcOffsetSeconds
        );

    const currentHorizon =
        getSolarHorizonTimes(
            currentDay,
            weather.latitude,
            weather.longitude,
            weather.utcOffsetSeconds
        );

    const nextHorizon =
        getSolarHorizonTimes(
            nextDay,
            weather.latitude,
            weather.longitude,
            weather.utcOffsetSeconds
        );

    if (!currentHorizon)
        return null;

    // Preserve the weather provider's current-day civil sunrise/sunset
    // when they belong to the same calendar date. Neighboring dates have
    // to be calculated locally because the weather object only supplies
    // the currently loaded day's values.
    const weatherSunrise =
        parseCelestialTime(weather.sunrise);

    const weatherSunset =
        parseCelestialTime(weather.sunset);

    const sameCalendarDate = (a, b) =>
        a && b &&
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const sunriseForCurrentDate =
        sameCalendarDate(weatherSunrise, currentHorizon.sunrise)
            ? weatherSunrise
            : currentHorizon.sunrise;

    const sunsetForCurrentDate =
        sameCalendarDate(weatherSunset, currentHorizon.sunset)
            ? weatherSunset
            : currentHorizon.sunset;

    let relevantSunrise;
    let relevantSunset;
    let nextSunrise;

    if (now < sunriseForCurrentDate) {

        // Before today's sunrise, the current cycle began yesterday.
        relevantSunset =
            previousHorizon?.sunset || null;

        relevantSunrise =
            sunriseForCurrentDate;

        nextSunrise =
            sunriseForCurrentDate;

    } else if (now <= sunsetForCurrentDate) {

        // Daytime and both visual transitions belong to today's cycle.
        relevantSunrise =
            sunriseForCurrentDate;

        relevantSunset =
            sunsetForCurrentDate;

        nextSunrise =
            nextHorizon?.sunrise || null;

    } else {

        // After today's sunset, the cycle runs through tonight to
        // tomorrow's sunrise.
        relevantSunrise =
            sunriseForCurrentDate;

        relevantSunset =
            sunsetForCurrentDate;

        nextSunrise =
            nextHorizon?.sunrise || null;

    }

    if (!relevantSunrise || !relevantSunset || !nextSunrise)
        return null;

    let presentationState = "DAY";

    const sunriseTransitionEnd =
        new Date(relevantSunrise.getTime() + 5 * 60000);

    const sunsetTransitionStart =
        new Date(relevantSunset.getTime() - 5 * 60000);

    const nightParkStart =
        new Date(relevantSunset.getTime() + 1 * 60000);

    const nightParkEnd =
        new Date(nextSunrise.getTime() - 1 * 60000);

    if (
        now >= relevantSunrise &&
        now <= sunriseTransitionEnd
    ) {

        presentationState = "SUNRISE TRANSITION";

    } else if (
        now >= sunsetTransitionStart &&
        now <= relevantSunset
    ) {

        presentationState = "SUNSET TRANSITION";

    } else if (
        now >= nightParkStart &&
        now <= nightParkEnd
    ) {

        presentationState = "NIGHT PARKED";

    } else if (now < relevantSunrise) {

        presentationState = "NIGHT PARKED";

    } else if (now > relevantSunset) {

        presentationState = "NIGHT PARKED";

    }

    return {
        previousSunset:
            previousHorizon?.sunset || null,

        sunrise:
            relevantSunrise,

        sunset:
            relevantSunset,

        nextSunrise,

        presentationState
    };

}


//--------------------------------------------------
// Temporary celestial time simulation
//--------------------------------------------------

function getCelestialSimulationTime(defaultTime, sunriseTime) {

    if (typeof window === "undefined")
        return defaultTime;

    //--------------------------------------------------
    // The development simulator owns an explicit local
    // date/time. The service simply consumes it.
    //--------------------------------------------------

    if (window.celestialSimulatorTime instanceof Date) {

        const d =
            window.celestialSimulatorTime;

        const pad = value =>
            String(value).padStart(2, "0");

        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
               `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    //--------------------------------------------------
    // URL initialization.
    //
    // New form:
    //     ?celestialSim=2026-09-08T07:13
    //
    // The old HHMM form remains accepted for convenience.
    //--------------------------------------------------

    const value =
        new URLSearchParams(window.location.search)
            .get("celestialSim");

    if (!value)
        return defaultTime;

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
        return value;

    if (!/^\d{4}$/.test(value))
        return defaultTime;

    const base =
        parseCelestialTime(defaultTime);

    if (!base)
        return defaultTime;

    const hour =
        Number(value.slice(0, 2));

    const minute =
        Number(value.slice(2, 4));

    if (
        (hour > 23 && !(hour === 24 && minute === 0)) ||
        minute > 59
    )
        return defaultTime;

    const simulatedDate =
        new Date(base.getTime());

    if (hour === 24) {
        simulatedDate.setDate(
            simulatedDate.getDate() + 1
        );
        simulatedDate.setHours(0, 0, 0, 0);
    } else {
        simulatedDate.setHours(
            hour,
            minute,
            0,
            0
        );
    }

    const pad = value =>
        String(value).padStart(2, "0");

    return `${simulatedDate.getFullYear()}-${pad(simulatedDate.getMonth() + 1)}-${pad(simulatedDate.getDate())}` +
           `T${pad(simulatedDate.getHours())}:${pad(simulatedDate.getMinutes())}`;

}


//--------------------------------------------------
// Time Parsing
//--------------------------------------------------

// Open-Meteo supplies local civil times because the
// forecast request specifies Europe/Lisbon. The value
// is therefore deliberately parsed as a wall-clock time
// rather than allowing the browser's timezone to alter it.
function parseCelestialTime(value) {

    if (!value)
        return null;


    const parts =
        value.split("T");


    if (parts.length !== 2)
        return null;


    const dateParts =
        parts[0].split("-");

    const timeParts =
        parts[1].split(":");


    if (
        dateParts.length !== 3 ||
        timeParts.length < 2
    )
        return null;


    return new Date(
        Number(dateParts[0]),
        Number(dateParts[1]) - 1,
        Number(dateParts[2]),
        Number(timeParts[0]),
        Number(timeParts[1])
    );

}


//--------------------------------------------------
// Time Range
//--------------------------------------------------

function isCelestialTimeBetween(
    now,
    start,
    end
) {

    if (end >= start) {

        return (
            now >= start &&
            now <= end
        );

    }


    return (
        now >= start ||
        now <= end
    );

}


//--------------------------------------------------
// Solar Position
//
// NOAA/Meeus-style solar position calculation.
// Azimuth: 0=N, 90=E, 180=S, 270=W.
// Altitude: degrees above/below the horizon.
//--------------------------------------------------

function calculateSolarPosition(
    localDate,
    latitude,
    longitude,
    utcOffsetSeconds = 0
) {

    if (latitude == null || longitude == null)
        return null;


    //--------------------------------------------------
    // The input Date represents a local civil wall-clock
    // time. Use its local calendar/time components directly.
    // The UTC offset is applied exactly once in the true
    // solar-time correction below.
    //--------------------------------------------------

    const year =
        localDate.getFullYear();

    const month =
        localDate.getMonth() + 1;

    const day =
        localDate.getDate();

    const hour =
        localDate.getHours();

    const minute =
        localDate.getMinutes();

    const second =
        localDate.getSeconds();


    const decimalHour =
        hour +
        minute / 60 +
        second / 3600;


    const dayOfYear =
        Math.floor(
            (Date.UTC(year, month - 1, day) -
             Date.UTC(year, 0, 0)) /
            86400000
        );


    const gamma =
        2 * Math.PI / 365 *
        (dayOfYear - 1 +
         (decimalHour - 12) / 24);


    const equationOfTime =
        229.18 * (
            0.000075 +
            0.001868 * Math.cos(gamma) -
            0.032077 * Math.sin(gamma) -
            0.014615 * Math.cos(2 * gamma) -
            0.040849 * Math.sin(2 * gamma)
        );


    const declination =
        0.006918 -
        0.399912 * Math.cos(gamma) +
        0.070257 * Math.sin(gamma) -
        0.006758 * Math.cos(2 * gamma) +
        0.000907 * Math.sin(2 * gamma) -
        0.002697 * Math.cos(3 * gamma) +
        0.00148 * Math.sin(3 * gamma);


    //--------------------------------------------------
    // True solar time
    //
    // local civil time
    // + equation of time
    // + longitude correction
    // - UTC-offset correction
    //
    // This converts the Portugal civil clock directly to
    // the local apparent solar time at the beach.
    //--------------------------------------------------

    const trueSolarMinutes =
        decimalHour * 60 +
        equationOfTime +
        4 * longitude -
        utcOffsetSeconds / 60;


    let hourAngle =
        trueSolarMinutes / 4 - 180;


    while (hourAngle < -180)
        hourAngle += 360;

    while (hourAngle > 180)
        hourAngle -= 360;


    const latitudeRadians =
        latitude * Math.PI / 180;

    const declinationRadians =
        declination;

    const hourAngleRadians =
        hourAngle * Math.PI / 180;


    const cosZenith =
        Math.sin(latitudeRadians) *
        Math.sin(declinationRadians) +
        Math.cos(latitudeRadians) *
        Math.cos(declinationRadians) *
        Math.cos(hourAngleRadians);


    const zenith =
        Math.acos(
            Math.max(-1, Math.min(1, cosZenith))
        );


    const altitude =
        90 -
        zenith * 180 / Math.PI;


    const azimuthRadians =
        Math.atan2(
            Math.sin(hourAngleRadians),
            Math.cos(hourAngleRadians) *
                Math.sin(latitudeRadians) -
                Math.tan(declinationRadians) *
                Math.cos(latitudeRadians)
        );


    let azimuth =
        azimuthRadians * 180 / Math.PI + 180;


    if (azimuth < 0)
        azimuth += 360;

    if (azimuth >= 360)
        azimuth -= 360;


    return {

        azimuth,

        altitude

    };

}


//--------------------------------------------------
// Sun display position
//
// Above the horizon, use absolute astronomical azimuth.
// Below the horizon, use a relative night-time azimuth
// running from sunset (right) to the following sunrise
// (left). The underlying astronomical azimuth is still
// available on the solar position itself.
//--------------------------------------------------

function getSunDisplayPosition(
    now,
    todaySunrise,
    todaySunset,
    nextSunrise,
    latitude,
    longitude,
    utcOffsetSeconds = 0,
    presentationState = null
) {

    const position =
        calculateSolarPosition(
            now,
            latitude,
            longitude,
            utcOffsetSeconds
        );

    if (!position)
        return null;

    // Keep the astronomical position intact. The formatter is responsible
    // for reconciling that position with the deliberately oversized Sun
    // graphic at the horizon.
    position.displayAzimuth = position.azimuth;
    position.localTime = new Date(now.getTime());
    position.sunriseTime = todaySunrise;
    position.sunsetTime = todaySunset;
    position.nextSunriseTime = nextSunrise;
    position.sunriseAltitude =
        calculateSolarPosition(
            todaySunrise,
            latitude,
            longitude,
            utcOffsetSeconds
        )?.altitude ?? 0;
    position.sunsetAltitude =
        calculateSolarPosition(
            todaySunset,
            latitude,
            longitude,
            utcOffsetSeconds
        )?.altitude ?? 0;
    position.latitude = latitude;
    position.longitude = longitude;
    position.utcOffsetSeconds = utcOffsetSeconds;
    position.isBelowHorizon = false;
    position.isNightParked = false;
    position.presentationState = presentationState;

    if (!todaySunrise || !todaySunset || !nextSunrise)
        return position;

    const sunriseTransitionStart =
        new Date(todaySunrise.getTime() - 4 * 60000);

    const sunriseTransitionEnd =
        new Date(todaySunrise.getTime() + 5 * 60000);

    const sunsetTransitionStart =
        new Date(todaySunset.getTime() - 5 * 60000);

    const sunsetTransitionEnd =
        new Date(todaySunset.getTime() + 4 * 60000);

    //--------------------------------------------------
    // Sunrise / sunset state information.
    //
    // These timestamps are deliberately based on the same civil times
    // shown to the user by Open-Meteo. This prevents the graphic horizon
    // event from drifting away from the displayed sunrise/sunset time.
    //--------------------------------------------------

    position.sunriseTransition =
        now >= sunriseTransitionStart &&
        now <= sunriseTransitionEnd;

    position.sunsetTransition =
        now >= sunsetTransitionStart &&
        now <= sunsetTransitionEnd;

    //--------------------------------------------------
    // Night azimuth.
    //
    // During the visual horizon transition we retain the astronomical
    // azimuth. Once the Sun's entire visual graphic has cleared the
    // horizon, it follows the fixed eastward night track.
    //--------------------------------------------------

    const sunsetPosition =
        calculateSolarPosition(
            todaySunset,
            latitude,
            longitude,
            utcOffsetSeconds
        );

    const sunrisePosition =
        calculateSolarPosition(
            nextSunrise,
            latitude,
            longitude,
            utcOffsetSeconds
        );

    const isNight =
        presentationState === "NIGHT PARKED" ||
        (now > todaySunset && now < nextSunrise);

    // Once the Sun has reached the next minute after sunset,
    // immediately place it on the horizontal nighttime track.
    // Likewise, keep it on that track until one minute before
    // the following sunrise, when the astronomical emergence begins.
    const nightParkStart =
        new Date(todaySunset.getTime() + 1 * 60000);

    const nightParkEnd =
        new Date(nextSunrise.getTime() - 1 * 60000);

    // The Sun is parked on the horizontal nighttime track beginning
    // one minute after sunset, and remains there until one minute
    // before the following sunrise. The exact sunset/sunrise minutes
    // remain available for the visual horizon transition.
    if (
        isNight &&
        now >= nightParkStart &&
        now <= nightParkEnd
    ) {

        position.isNightParked = true;
        position.isBelowHorizon = true;

        if (sunsetPosition && sunrisePosition) {

            const progress =
                Math.max(
                    0,
                    Math.min(
                        1,
                        (now.getTime() - todaySunset.getTime()) /
                        (nextSunrise.getTime() - todaySunset.getTime())
                    )
                );

            position.displayAzimuth =
                sunsetPosition.azimuth +
                (sunrisePosition.azimuth - sunsetPosition.azimuth) *
                progress;
        }

    } else if (isNight) {

        // The Sun remains dim only after the disc itself has cleared
        // the horizon. During the short visual descent immediately
        // after sunset it remains fully bright.
        position.isBelowHorizon =
            now >= todaySunset.getTime() + 4 * 60000;

        if (position.isBelowHorizon && sunsetPosition && sunrisePosition) {
            const progress =
                Math.max(0, Math.min(1,
                    (now.getTime() - todaySunset.getTime()) /
                    (nextSunrise.getTime() - todaySunset.getTime())
                ));

            position.displayAzimuth =
                sunsetPosition.azimuth +
                (sunrisePosition.azimuth - sunsetPosition.azimuth) *
                progress;
        }
    }

    return position;

}

//--------------------------------------------------
// Solar Horizon Times
//
// Calculate the geometric sunrise and sunset for the
// same solar-position model used by the graphic. This
// keeps both ends of the path exactly on altitude = 0.
//--------------------------------------------------

function getSolarHorizonTimes(localDate, latitude, longitude, utcOffsetSeconds = 0) {

    if (localDate == null || latitude == null || longitude == null)
        return null;

    const year = localDate.getFullYear();
    const month = localDate.getMonth();
    const day = localDate.getDate();

    const dateAtHour = hour =>
        new Date(year, month, day, hour, 0, 0, 0);

    const getSolarTerms = date => {
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const d = date.getDate();
        const h = date.getHours();
        const min = date.getMinutes();
        const sec = date.getSeconds();

        const decimalHour = h + min / 60 + sec / 3600;
        const dayOfYear = Math.floor(
            (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000
        );

        const gamma = 2 * Math.PI / 365 *
            (dayOfYear - 1 + (decimalHour - 12) / 24);

        const equationOfTime = 229.18 * (
            0.000075 +
            0.001868 * Math.cos(gamma) -
            0.032077 * Math.sin(gamma) -
            0.014615 * Math.cos(2 * gamma) -
            0.040849 * Math.sin(2 * gamma)
        );

        const declination =
            0.006918 -
            0.399912 * Math.cos(gamma) +
            0.070257 * Math.sin(gamma) -
            0.006758 * Math.cos(2 * gamma) +
            0.000907 * Math.sin(2 * gamma) -
            0.002697 * Math.cos(3 * gamma) +
            0.00148 * Math.sin(3 * gamma);

        return { equationOfTime, declination };
    };

    // Iterate once or twice because declination/EoT vary slightly
    // across the day. The horizon crossing is geometric altitude 0°.
    let estimate = dateAtHour(12);

    for (let iteration = 0; iteration < 3; iteration++) {
        const terms = getSolarTerms(estimate);
        const lat = latitude * Math.PI / 180;
        const dec = terms.declination;

        const cosH = -Math.tan(lat) * Math.tan(dec);

        if (cosH < -1 || cosH > 1)
            return null;

        const hourAngle = Math.acos(cosH) * 180 / Math.PI;
        const solarNoonMinutes =
            720 - 4 * longitude - terms.equationOfTime + utcOffsetSeconds / 60;

        const sunriseMinutes = solarNoonMinutes - hourAngle * 4;
        const sunsetMinutes = solarNoonMinutes + hourAngle * 4;

        estimate = new Date(year, month, day, 0, 0, 0, 0);

        return {
            sunrise: new Date(estimate.getTime() + sunriseMinutes * 60000),
            sunset: new Date(estimate.getTime() + sunsetMinutes * 60000)
        };
    }

    return null;
}


//--------------------------------------------------
// Relative Azimuth
//
// Converts absolute azimuth into angular distance from
// South. This is the coordinate used horizontally by
// the graphic.
//--------------------------------------------------

function getRelativeAzimuth(azimuth) {

    let relative =
        azimuth - 180;


    while (relative < -180)
        relative += 360;

    while (relative > 180)
        relative -= 360;


    return relative;

}


//--------------------------------------------------
// Graphic X Position
//--------------------------------------------------

function getAzimuthGraphicPosition(azimuth) {

    const relative =
        getRelativeAzimuth(azimuth);


    const normalized =
        relative /
        CELESTIAL_AZIMUTH_HALF_RANGE;


    // East is left; West is right.
    const x =
        50 +
        normalized * 50;


    return Math.max(
        0,
        Math.min(100, x)
    );

}


//--------------------------------------------------
// Moon Phase
//--------------------------------------------------

function normalizeMoonPhase(phase) {

    if (phase == null)
        return null;


    return (
        ((phase % 1) + 1) % 1
    );

}


function calculateMoonIllumination(phase) {

    if (phase == null)
        return null;


    return (
        1 -
        Math.cos(
            2 * Math.PI * phase
        )
    ) / 2;

}


function getMoonPhaseName(phase) {

    if (phase == null)
        return "--";


    if (
        phase < 0.0625 ||
        phase >= 0.9375
    ) {
        return "New Moon";
    }

    if (phase < 0.25)
        return "Waxing Crescent";

    if (phase < 0.3125)
        return "First Quarter";

    if (phase < 0.50)
        return "Waxing Gibbous";

    if (phase < 0.5625)
        return "Full Moon";

    if (phase < 0.75)
        return "Waning Gibbous";

    if (phase < 0.8125)
        return "Last Quarter";

    return "Waning Crescent";

}
