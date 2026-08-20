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


//--------------------------------------------------
// Current Coastal Condition
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
// Current Coastal Fog Risk
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
    // Atmospheric indicators
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


//--------------------------------------------------
// Forecast Coastal Fog / Mist
//
// Examines future hourly conditions.
//
// Forecast fog codes (45/48) are reported as
// forecast fog. They do NOT establish current fog.
//
// Calculated risk is used when the forecast model
// has not explicitly predicted fog.
//--------------------------------------------------

function getCoastalFogForecast(weather) {

    if (
        !weather ||
        !weather.hourly
    ) {

        return null;

    }


    const hourly =
        weather.hourly;


    //--------------------------------------------------
    // Make sure required hourly arrays exist.
    //--------------------------------------------------

    if (
        !hourly.time ||
        !hourly.temperature_2m ||
        !hourly.dew_point_2m ||
        !hourly.relative_humidity_2m ||
        !hourly.visibility ||
        !hourly.weather_code
    ) {

        return null;

    }


    //--------------------------------------------------
    // Examine future hours.
    //
    // Start with the next hour rather than the current
    // hour. Current conditions are handled separately.
    //--------------------------------------------------

    for (
        let i = 1;
        i < hourly.time.length;
        i++
    ) {

        const weatherCode =
            hourly.weather_code[i];


        //--------------------------------------------------
        // Explicit forecast fog
        //--------------------------------------------------

        if (
            weatherCode === 45 ||
            weatherCode === 48
        ) {

            return {
                level: "forecast",
                type: "fog",
                time: hourly.time[i],
                label: "Fog forecast"
            };

        }


        //--------------------------------------------------
        // Ignore precipitation / storm conditions.
        //--------------------------------------------------

        if (
            weatherCode === 51 ||
            weatherCode === 53 ||
            weatherCode === 55 ||
            weatherCode === 61 ||
            weatherCode === 63 ||
            weatherCode === 65 ||
            weatherCode === 71 ||
            weatherCode === 73 ||
            weatherCode === 75 ||
            weatherCode === 80 ||
            weatherCode === 81 ||
            weatherCode === 82 ||
            weatherCode === 95 ||
            weatherCode === 96 ||
            weatherCode === 99
        ) {

            continue;

        }


        //--------------------------------------------------
        // Atmospheric indicators
        //--------------------------------------------------

        const temperature =
            hourly.temperature_2m[i];

        const dewPoint =
            hourly.dew_point_2m[i];

        const humidity =
            hourly.relative_humidity_2m[i];

        const visibilityKm =
            hourly.visibility[i] / 1000;


        const spread =
            temperature -
            dewPoint;


        //--------------------------------------------------
        // High calculated risk
        //--------------------------------------------------

        if (
            spread <=
                COASTAL_FOG_THRESHOLDS.verySmallSpread &&

            humidity >=
                COASTAL_FOG_THRESHOLDS.highHumidity &&

            visibilityKm <=
                COASTAL_FOG_THRESHOLDS.veryReducedVisibility
        ) {

            return {
                level: "high",
                type: "mist",
                time: hourly.time[i],
                label: "Coastal fog risk: High"
            };

        }


        //--------------------------------------------------
        // Moderate calculated risk
        //--------------------------------------------------

        if (
            spread <=
                COASTAL_FOG_THRESHOLDS.smallSpread &&

            humidity >=
                COASTAL_FOG_THRESHOLDS.highHumidity &&

            visibilityKm <=
                COASTAL_FOG_THRESHOLDS.reducedVisibility
        ) {

            return {
                level: "moderate",
                type: "mist",
                time: hourly.time[i],
                label: "Coastal mist possible"
            };

        }

    }


    //--------------------------------------------------
    // No significant forecast risk
    //--------------------------------------------------

    return null;

}