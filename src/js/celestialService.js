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


    //--------------------------------------------------
    // Resolve the solar cycle from the actual date/time being displayed.
    // The weather object's sunrise/sunset belong to the forecast load date;
    // they must not be used as the calendar anchor when the clock crosses
    // midnight.
    //--------------------------------------------------

    const now =
        parseCelestialTime(
            getCelestialSimulationTime(
                weather.currentTime,
                weather.sunrise
            )
        );

    let sunrise = null;
    let sunset = null;
    let previousSunset = null;
    let nextSunrise = null;

    if (now) {

        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            12, 0, 0, 0
        );

        const yesterday = new Date(today.getTime());
        yesterday.setDate(yesterday.getDate() - 1);

        const tomorrow = new Date(today.getTime());
        tomorrow.setDate(tomorrow.getDate() + 1);

        // For the forecast's loaded date, preserve the exact Open-Meteo
        // civil sunrise/sunset shown elsewhere in the app. For any other
        // simulated date, calculate the corresponding horizon times locally.
        const forecastDate = parseCelestialTime(weather.currentTime);
        const sameCalendarDate = date =>
            forecastDate &&
            date.getFullYear() === forecastDate.getFullYear() &&
            date.getMonth() === forecastDate.getMonth() &&
            date.getDate() === forecastDate.getDate();

        const forecastSunrise = parseCelestialTime(weather.sunrise);
        const forecastSunset = parseCelestialTime(weather.sunset);

        const todayHorizon =
            sameCalendarDate(today) && forecastSunrise && forecastSunset
                ? {
                    sunrise: forecastSunrise,
                    sunset: forecastSunset
                }
                : getSolarHorizonTimes(
                    today,
                    weather.latitude,
                    weather.longitude,
                    weather.utcOffsetSeconds
                );

        const yesterdayHorizon =
            getSolarHorizonTimes(
                yesterday,
                weather.latitude,
                weather.longitude,
                weather.utcOffsetSeconds
            );

        const tomorrowHorizon =
            getSolarHorizonTimes(
                tomorrow,
                weather.latitude,
                weather.longitude,
                weather.utcOffsetSeconds
            );

        sunrise = todayHorizon?.sunrise || null;
        sunset = todayHorizon?.sunset || null;
        previousSunset = yesterdayHorizon?.sunset || null;
        nextSunrise = tomorrowHorizon?.sunrise || null;
    }


    //--------------------------------------------------
    // Sun
    //--------------------------------------------------

    let sunPosition = null;

    if (
        now &&
        sunrise &&
        sunset &&
        previousSunset &&
        nextSunrise
    ) {

        sunPosition =
            getSunDisplayPosition(
                now,
                sunrise,
                sunset,
                previousSunset,
                nextSunrise,
                weather.latitude,
                weather.longitude,
                weather.utcOffsetSeconds
            );
    }


    const sunIsVisible =
        sunrise !== null &&
        sunset !== null &&
        now !== null &&
        now >= sunrise &&
        now <= sunset;


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
        now !== null &&
        isCelestialTimeBetween(
            now,
            moonrise,
            moonset
        );


    const moonPhase =
        normalizeMoonPhase(weather.moonPhase);

    const moonIllumination =
        calculateMoonIllumination(moonPhase);


    return {

        azimuthHalfRange:
            CELESTIAL_AZIMUTH_HALF_RANGE,

        sun: {
            isVisible: sunIsVisible,
            position: sunPosition
        },

        moon: {
            isVisible: moonIsVisible,
            phase: moonPhase,
            illumination: moonIllumination,
            phaseName: getMoonPhaseName(moonPhase),
            position: null
        }
    };

}


//--------------------------------------------------
// Temporary celestial time simulation
//--------------------------------------------------

function getCelestialSimulationTime(defaultTime, sunriseTime) {

    if (typeof window === "undefined")
        return defaultTime;

    const params = new URLSearchParams(window.location.search);
    const devMode = params.has("dev");
    const value = params.get("celestialSim");

    // In ?dev mode the simulator keeps the simulated civil time in memory.
    // Use that value as the authoritative clock; the URL itself remains
    // simply ?dev. This also means crossing midnight changes the calendar
    // date used for sunrise/sunset and for both celestial path segments.
    if (devMode &&
        typeof window.celestialSimulatorTime !== "undefined" &&
        window.celestialSimulatorTime instanceof Date &&
        !Number.isNaN(window.celestialSimulatorTime.getTime())) {
        const simulated = window.celestialSimulatorTime;
        const pad = value => String(value).padStart(2, "0");

        return `${simulated.getFullYear()}-${pad(simulated.getMonth() + 1)}-${pad(simulated.getDate())}` +
            `T${pad(simulated.getHours())}:${pad(simulated.getMinutes())}`;
    }

    if (!value)
        return defaultTime;

    // New simulator format: an explicit local civil date and time.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
        return value;

    // Backward-compatible four-digit time format. In this legacy mode
    // retain the forecast date rather than inventing a sunrise-to-sunrise
    // date shift; the new simulator carries the date explicitly.
    if (!/^\d{4}$/.test(value))
        return defaultTime;

    const base = parseCelestialTime(defaultTime);
    if (!base)
        return defaultTime;

    const hour = Number(value.slice(0, 2));
    const minute = Number(value.slice(2, 4));

    if (hour > 23 || minute > 59)
        return defaultTime;

    base.setHours(hour, minute, 0, 0);

    return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
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
    previousSunset,
    nextSunrise,
    latitude,
    longitude,
    utcOffsetSeconds = 0
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
    position.previousSunsetTime = previousSunset;
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

    const isBeforeSunrise =
        now < todaySunrise;

    const isAfterSunset =
        now > todaySunset;

    const isNight =
        (isBeforeSunrise && now > previousSunset) ||
        (isAfterSunset && now < nextSunrise);

    const nightParkStart =
        isBeforeSunrise
            ? new Date(previousSunset.getTime() + 1 * 60000)
            : new Date(todaySunset.getTime() + 1 * 60000);

    const nightParkEnd =
        isBeforeSunrise
            ? new Date(todaySunrise.getTime() - 1 * 60000)
            : new Date(nextSunrise.getTime() - 1 * 60000);

    if (isNight && now >= nightParkStart && now <= nightParkEnd) {

        position.isNightParked = true;
        position.isBelowHorizon = true;

        const parkStart =
            isBeforeSunrise ? previousSunset : todaySunset;

        const parkEnd =
            isBeforeSunrise ? todaySunrise : nextSunrise;

        const startPosition =
            calculateSolarPosition(
                parkStart, latitude, longitude, utcOffsetSeconds
            );

        const endPosition =
            calculateSolarPosition(
                parkEnd, latitude, longitude, utcOffsetSeconds
            );

        if (startPosition && endPosition) {
            const progress = Math.max(0, Math.min(1,
                (now.getTime() - parkStart.getTime()) /
                (parkEnd.getTime() - parkStart.getTime())
            ));

            position.displayAzimuth =
                startPosition.azimuth +
                (endPosition.azimuth - startPosition.azimuth) * progress;
        }

    } else if (isNight) {

        // During the four-minute visual descent/rise immediately around
        // the horizon, retain the astronomical position. Once the disk
        // has cleared the horizon, the Sun uses the parked night track.
        const transitionBoundary =
            isBeforeSunrise
                ? todaySunrise.getTime() - 4 * 60000
                : todaySunset.getTime() + 4 * 60000;

        position.isBelowHorizon =
            isBeforeSunrise
                ? now < transitionBoundary
                : now >= transitionBoundary;
    }

    if (
        now >= sunriseTransitionStart &&
        now <= sunriseTransitionEnd
    ) {
        position.presentationState =
            "SUNRISE TRANSITION";
    } else if (
        now >= sunsetTransitionStart &&
        now <= todaySunset.getTime()
    ) {
        position.presentationState =
            "SUNSET TRANSITION";
    } else if (
        now > sunriseTransitionEnd &&
        now < sunsetTransitionStart
    ) {
        position.presentationState =
            "DAY";
    } else {
        position.presentationState =
            "NIGHT PARKED";
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
