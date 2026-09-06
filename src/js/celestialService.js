//--------------------------------------------------
// Celestial Service
//
// Calculates the astronomical state used by the
// celestial graphic.
//
// Solar position is calculated from the selected
// beach's latitude/longitude and the current instant.
// Civil time is interpreted in Europe/Lisbon, including
// daylight-saving time.
//--------------------------------------------------


//--------------------------------------------------
// Constants
//--------------------------------------------------

const CELESTIAL_TIME_ZONE =
    "Europe/Lisbon";


//--------------------------------------------------
// Public Functions
//--------------------------------------------------

function getCelestialState(weather) {

    if (!weather)
        return null;


    const now =
        new Date();


    //--------------------------------------------------
    // Solar coordinates
    //--------------------------------------------------

    const latitude =
        Number(weather.latitude);

    const longitude =
        Number(weather.longitude);


    const solarPosition =
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
            ? calculateSolarPosition(
                  now,
                  latitude,
                  longitude
              )
            : null;


    //--------------------------------------------------
    // Sunrise / sunset
    //
    // These remain the provider's local civil times for
    // the selected beach. They are used for the labels.
    //--------------------------------------------------

    const sunrise =
        parseCelestialTime(
            weather.sunrise
        );

    const sunset =
        parseCelestialTime(
            weather.sunset
        );


    const sunIsVisible =
        solarPosition !== null &&
        solarPosition.altitude >= 0;


    //--------------------------------------------------
    // Moon
    //
    // Moon positioning is intentionally not redesigned
    // yet. The existing phase data remains available for
    // the next implementation stage.
    //--------------------------------------------------

    const moonrise =
        parseCelestialTime(
            weather.moonrise
        );

    const moonset =
        parseCelestialTime(
            weather.moonset
        );


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

        sun: {

            isVisible:
                sunIsVisible,

            position:
                solarPosition,

            sunrise,

            sunset

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
// Solar Position
//
// NOAA/Meeus-style solar position calculation.
//
// Returns:
//     altitude - degrees above geometric horizon
//     azimuth  - degrees clockwise from north
//
// The calculation uses the actual instant (UTC
// internally), so the result is independent of the
// browser's local timezone. Europe/Lisbon is used when
// determining the local civil date for the daily path.
//--------------------------------------------------

function calculateSolarPosition(
    date,
    latitude,
    longitude
) {

    const julianDay =
        date.getTime() / 86400000 +
        2440587.5;


    const julianCentury =
        (julianDay - 2451545.0) /
        36525;


    const geomMeanLongSun =
        normalizeDegrees(
            280.46646 +
            julianCentury * (
                36000.76983 +
                julianCentury * 0.0003032
            )
        );


    const geomMeanAnomalySun =
        357.52911 +
        julianCentury * (
            35999.05029 -
            julianCentury * 0.0001537
        );


    const eccentricityEarthOrbit =
        0.016708634 -
        julianCentury * (
            0.000042037 +
            0.0000001267 * julianCentury
        );


    const anomalyRadians =
        degreesToRadians(
            geomMeanAnomalySun
        );


    const sunEquationOfCenter =
        Math.sin(anomalyRadians) * (
            1.914602 -
            julianCentury * (
                0.004817 +
                0.000014 * julianCentury
            )
        ) +
        Math.sin(2 * anomalyRadians) * (
            0.019993 -
            0.000101 * julianCentury
        ) +
        Math.sin(3 * anomalyRadians) *
        0.000289;


    const sunTrueLongitude =
        geomMeanLongSun +
        sunEquationOfCenter;


    const omega =
        125.04 -
        1934.136 * julianCentury;


    const solarApparentLongitude =
        sunTrueLongitude -
        0.00569 -
        0.00478 * Math.sin(
            degreesToRadians(omega)
        );


    const meanObliquity =
        23 + (
            26 + (
                21.448 -
                julianCentury * (
                    46.815 +
                    julianCentury * (
                        0.00059 -
                        julianCentury * 0.001813
                    )
                )
            ) / 60
        ) / 60;


    const obliquityCorrection =
        meanObliquity +
        0.00256 * Math.cos(
            degreesToRadians(omega)
        );


    const obliquityRadians =
        degreesToRadians(
            obliquityCorrection
        );


    const apparentLongitudeRadians =
        degreesToRadians(
            solarApparentLongitude
        );


    const solarDeclination =
        radiansToDegrees(
            Math.asin(
                Math.sin(obliquityRadians) *
                Math.sin(apparentLongitudeRadians)
            )
        );


    //--------------------------------------------------
    // Equation of time
    //--------------------------------------------------

    const y =
        Math.tan(
            obliquityRadians / 2
        ) ** 2;


    const equationOfTime =
        4 * radiansToDegrees(1) * (
            y * Math.sin(2 * degreesToRadians(geomMeanLongSun)) -
            2 * eccentricityEarthOrbit * Math.sin(anomalyRadians) +
            4 * eccentricityEarthOrbit * y *
                Math.sin(anomalyRadians) *
                Math.cos(2 * degreesToRadians(geomMeanLongSun)) -
            0.5 * y * y *
                Math.sin(4 * degreesToRadians(geomMeanLongSun)) -
            1.25 * eccentricityEarthOrbit * eccentricityEarthOrbit *
                Math.sin(2 * anomalyRadians)
        );


    //--------------------------------------------------
    // True solar time and hour angle
    //
    // UTC is used here. Longitude is positive east.
    //--------------------------------------------------

    const utcMinutes =
        date.getUTCHours() * 60 +
        date.getUTCMinutes() +
        date.getUTCSeconds() / 60 +
        date.getUTCMilliseconds() / 60000;


    let trueSolarTime =
        utcMinutes +
        equationOfTime +
        4 * longitude;


    trueSolarTime =
        ((trueSolarTime % 1440) + 1440) % 1440;


    let hourAngle =
        trueSolarTime / 4 - 180;


    if (hourAngle < -180)
        hourAngle += 360;


    //--------------------------------------------------
    // Solar zenith / altitude
    //--------------------------------------------------

    const latitudeRadians =
        degreesToRadians(latitude);


    const declinationRadians =
        degreesToRadians(
            solarDeclination
        );


    const hourAngleRadians =
        degreesToRadians(
            hourAngle
        );


    const cosineZenith =
        clamp(
            Math.sin(latitudeRadians) *
                Math.sin(declinationRadians) +
            Math.cos(latitudeRadians) *
                Math.cos(declinationRadians) *
                Math.cos(hourAngleRadians),
            -1,
            1
        );


    const zenith =
        radiansToDegrees(
            Math.acos(cosineZenith)
        );


    const altitude =
        90 - zenith;


    //--------------------------------------------------
    // Solar azimuth
    //
    // Clockwise from north:
    //     0   N
    //     90  E
    //     180 S
    //     270 W
    //--------------------------------------------------

    const azimuth =
        normalizeDegrees(
            radiansToDegrees(
                Math.atan2(
                    Math.sin(hourAngleRadians),
                    Math.cos(hourAngleRadians) *
                        Math.sin(latitudeRadians) -
                    Math.tan(declinationRadians) *
                        Math.cos(latitudeRadians)
                )
            ) +
            180
        );


    return {

        altitude,

        azimuth,

        declination:
            solarDeclination,

        equationOfTime

    };

}


//--------------------------------------------------
// Daily Solar Path
//--------------------------------------------------

function getSolarPath(
    date,
    latitude,
    longitude
) {

    const localDate =
        getLocalDateParts(
            date,
            CELESTIAL_TIME_ZONE
        );


    const start =
        zonedDateTimeToUtc(
            {
                year: localDate.year,
                month: localDate.month,
                day: localDate.day,
                hour: 0,
                minute: 0,
                second: 0
            },
            CELESTIAL_TIME_ZONE
        );


    const points = [];

    const minutesPerDay =
        24 * 60;


    for (
        let minute = 0;
        minute <= minutesPerDay;
        minute += 10
    ) {

        const instant =
            new Date(
                start.getTime() +
                minute * 60000
            );


        const position =
            calculateSolarPosition(
                instant,
                latitude,
                longitude
            );


        points.push({

            date: instant,

            altitude:
                position.altitude,

            azimuth:
                position.azimuth

        });

    }


    return points;

}


//--------------------------------------------------
// Time Parsing
//--------------------------------------------------

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


    return zonedDateTimeToUtc(
        {
            year:
                Number(dateParts[0]),
            month:
                Number(dateParts[1]),
            day:
                Number(dateParts[2]),
            hour:
                Number(timeParts[0]),
            minute:
                Number(timeParts[1]),
            second:
                Number(timeParts[2] || 0)
        },
        CELESTIAL_TIME_ZONE
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
// Time Zone Helpers
//--------------------------------------------------

function getLocalDateParts(
    date,
    timeZone
) {

    const formatter =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        );


    const parts =
        formatter.formatToParts(date);


    return {

        year:
            Number(
                parts.find(
                    part => part.type === "year"
                ).value
            ),

        month:
            Number(
                parts.find(
                    part => part.type === "month"
                ).value
            ),

        day:
            Number(
                parts.find(
                    part => part.type === "day"
                ).value
            )

    };

}


function getTimeZoneOffsetMinutes(
    date,
    timeZone
) {

    const formatter =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hourCycle: "h23"
            }
        );


    const parts =
        formatter.formatToParts(date);


    const getPart =
        type => Number(
            parts.find(
                part => part.type === type
            ).value
        );


    const localAsUtc =
        Date.UTC(
            getPart("year"),
            getPart("month") - 1,
            getPart("day"),
            getPart("hour"),
            getPart("minute"),
            getPart("second")
        );


    return (
        localAsUtc - date.getTime()
    ) / 60000;

}


function zonedDateTimeToUtc(
    parts,
    timeZone
) {

    let guess =
        Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            parts.hour || 0,
            parts.minute || 0,
            parts.second || 0
        );


    //--------------------------------------------------
    // Two passes handle normal DST transitions.
    //--------------------------------------------------

    for (let i = 0; i < 2; i++) {

        const offset =
            getTimeZoneOffsetMinutes(
                new Date(guess),
                timeZone
            );

        guess =
            Date.UTC(
                parts.year,
                parts.month - 1,
                parts.day,
                parts.hour || 0,
                parts.minute || 0,
                parts.second || 0
            ) -
            offset * 60000;

    }


    return new Date(guess);

}


//--------------------------------------------------
// Numeric Helpers
//--------------------------------------------------

function degreesToRadians(degrees) {

    return degrees * Math.PI / 180;

}


function radiansToDegrees(radians) {

    return radians * 180 / Math.PI;

}


function normalizeDegrees(degrees) {

    return (
        (degrees % 360) +
        360
    ) % 360;

}


function clamp(value, min, max) {

    return Math.min(
        max,
        Math.max(min, value)
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


//--------------------------------------------------
// Moon Illumination
//--------------------------------------------------

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


//--------------------------------------------------
// Moon Phase Name
//--------------------------------------------------

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
