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


//--------------------------------------------------
// Public Functions
//--------------------------------------------------

function getCelestialState(weather) {

    if (!weather)
        return null;


    const sunrise =
        parseCelestialTime(weather.sunrise);

    const sunset =
        parseCelestialTime(weather.sunset);

    const now =
        parseCelestialTime(weather.currentTime);


    //--------------------------------------------------
    // Sun
    //--------------------------------------------------

    let sunPosition = null;

    if (
        now &&
        sunrise &&
        sunset
    ) {

        sunPosition =
            calculateSolarPosition(
                now,
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

        sun: {

            isVisible:
                sunIsVisible,

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
