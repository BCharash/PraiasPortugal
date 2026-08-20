//--------------------------------------------------
// Coastal Conditions
//
// Interprets weather data for beach-specific
// coastal conditions such as mist and fog risk.
//--------------------------------------------------


//--------------------------------------------------
// Risk Thresholds
//
// These are deliberately conservative and isolated
// so they can be adjusted as we learn from actual
// beach conditions.
//--------------------------------------------------

const COASTAL_FOG_THRESHOLDS = {

    // Temperature / dew-point spread
    verySmallSpread:
        1.0,

    smallSpread:
        2.0,


    // Relative humidity
    highHumidity:
        90,


    // Visibility, kilometres
    reducedVisibility:
        10,

    veryReducedVisibility:
        5

};


//--------------------------------------------------
// Public Functions
//--------------------------------------------------


function getCurrentCoastalCondition(weather) {

    if (!weather)
        return null;


    //--------------------------------------------------
    // Confirmed current fog
    //
    // Only the CURRENT weather code can establish
    // current fog.
    //--------------------------------------------------

    if (
        weather.weatherCode === 45 ||
        weather.weatherCode === 48
    ) {

        return {
            type: "fog",
            label: "Fog"
        };

    }


    //--------------------------------------------------
    // No current coastal condition
    //--------------------------------------------------

    return null;

}


//--------------------------------------------------
// Forecast Coastal Fog Risk
//--------------------------------------------------

function getCoastalFogRisk(weather) {

    if (!weather)
        return null;


    //--------------------------------------------------
    // Never classify precipitation or thunderstorms
    // as coastal fog risk.
    //--------------------------------------------------

    if (
        weather.weatherCode === 51 ||
        weather.weatherCode === 53 ||
        weather.weatherCode === 55 ||
        weather.weatherCode === 61 ||
        weather.weatherCode === 63 ||
        weather.weatherCode === 65 ||
        weather.weatherCode === 71 ||
        weather.weatherCode === 73 ||
        weather.weatherCode === 75 ||
        weather.weatherCode === 80 ||
        weather.weatherCode === 81 ||
        weather.weatherCode === 82 ||
        weather.weatherCode === 95 ||
        weather.weatherCode === 96 ||
        weather.weatherCode === 99
    ) {

        return null;

    }


    //--------------------------------------------------
    // Required atmospheric data
    //--------------------------------------------------

    if (
        weather.airTemperature == null ||
        weather.dewPoint == null ||
        weather.relativeHumidity == null ||
        weather.visibility == null
    ) {

        return null;

    }


    //--------------------------------------------------
    // Temperature / dew-point spread
    //--------------------------------------------------

    const spread =
        weather.airTemperature -
        weather.dewPoint;


    //--------------------------------------------------
    // Visibility in kilometres
    //--------------------------------------------------

    const visibilityKm =
        weather.visibility / 1000;


    //--------------------------------------------------
    // Strong atmospheric indicators
    //--------------------------------------------------

    const verySmallSpread =
        spread <=
        COASTAL_FOG_THRESHOLDS.verySmallSpread;

    const smallSpread =
        spread <=
        COASTAL_FOG_THRESHOLDS.smallSpread;

    const highHumidity =
        weather.relativeHumidity >=
        COASTAL_FOG_THRESHOLDS.highHumidity;

    const reducedVisibility =
        visibilityKm <=
        COASTAL_FOG_THRESHOLDS.reducedVisibility;

    const veryReducedVisibility =
        visibilityKm <=
        COASTAL_FOG_THRESHOLDS.veryReducedVisibility;


    //--------------------------------------------------
    // High risk
    //
    // Requires strong evidence from several independent
    // atmospheric variables.
    //--------------------------------------------------

    if (
        verySmallSpread &&
        highHumidity &&
        veryReducedVisibility
    ) {

        return {
            level: "high",
            label: "Coastal fog risk: High"
        };

    }


    //--------------------------------------------------
    // Moderate risk
    //
    // Requires near-saturation plus reduced visibility.
    //--------------------------------------------------

    if (
        smallSpread &&
        highHumidity &&
        reducedVisibility
    ) {

        return {
            level: "moderate",
            label: "Coastal mist possible"
        };

    }


    //--------------------------------------------------
    // No significant coastal fog risk
    //--------------------------------------------------

    return null;

}
