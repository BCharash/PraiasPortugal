//--------------------------------------------------
// Celestial Service
//
// Calculates the current astronomical state from
// the sunrise, sunset, moonrise, moonset, and
// moon phase data supplied by the weather service.
//--------------------------------------------------


//--------------------------------------------------
// Public Functions
//--------------------------------------------------

function getCelestialState(weather) {

    if (!weather)
        return null;


    const now =
        new Date();


    //--------------------------------------------------
    // Sun
    //--------------------------------------------------

    const sunrise =
        parseCelestialTime(weather.sunrise);

    const sunset =
        parseCelestialTime(weather.sunset);

    const sunIsVisible =
        sunrise !== null &&
        sunset !== null &&
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
                sunIsVisible
                    ? getCelestialPosition(
                          now,
                          sunrise,
                          sunset
                      )
                    : null

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
                moonIsVisible
                    ? getCelestialPosition(
                          now,
                          moonrise,
                          moonset
                      )
                    : null

        }

    };

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

    //--------------------------------------------------
    // Normal same-day interval
    //--------------------------------------------------

    if (end >= start) {

        return (
            now >= start &&
            now <= end
        );

    }


    //--------------------------------------------------
    // Interval crossing midnight
    //--------------------------------------------------

    return (
        now >= start ||
        now <= end
    );

}


//--------------------------------------------------
// Celestial Position
//
// Returns a normalized position along an
// abstract sky arc.
//
// No horizon, land, or sea is implied.
//--------------------------------------------------

function getCelestialPosition(
    now,
    rise,
    set
) {

    const total =
        set.getTime() -
        rise.getTime();

    const elapsed =
        now.getTime() -
        rise.getTime();


    let progress =
        elapsed / total;


    progress =
        Math.max(
            0,
            Math.min(
                1,
                progress
            )
        );


    //--------------------------------------------------
    // Horizontal position
    //--------------------------------------------------

    const x =
        14 +
        progress * 68;


    //--------------------------------------------------
    // Vertical position
    //--------------------------------------------------

    const arc =
        Math.sin(
            progress * Math.PI
        );


    const y =
        51 -
        arc * 34;


    return {

        x,
        y,

        progress

    };

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


    //--------------------------------------------------
    // New Moon
    //--------------------------------------------------

    if (
        phase < 0.0625 ||
        phase >= 0.9375
    ) {

        return "New Moon";

    }


    //--------------------------------------------------
    // Waxing Crescent
    //--------------------------------------------------

    if (phase < 0.25)
        return "Waxing Crescent";


    //--------------------------------------------------
    // First Quarter
    //--------------------------------------------------

    if (phase < 0.3125)
        return "First Quarter";


    //--------------------------------------------------
    // Waxing Gibbous
    //--------------------------------------------------

    if (phase < 0.50)
        return "Waxing Gibbous";


    //--------------------------------------------------
    // Full Moon
    //--------------------------------------------------

    if (phase < 0.5625)
        return "Full Moon";


    //--------------------------------------------------
    // Waning Gibbous
    //--------------------------------------------------

    if (phase < 0.75)
        return "Waning Gibbous";


    //--------------------------------------------------
    // Last Quarter
    //--------------------------------------------------

    if (phase < 0.8125)
        return "Last Quarter";


    //--------------------------------------------------
    // Waning Crescent
    //--------------------------------------------------

    return "Waning Crescent";

}