//--------------------------------------------------
// Coastal Conditions
//
// Interprets weather data for beach-specific
// coastal conditions such as mist and fog risk.
//--------------------------------------------------


//--------------------------------------------------
// Public Functions
//--------------------------------------------------

function getCoastalConditions(weather) {

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
    // No coastal qualifier yet
    //--------------------------------------------------

    return null;

}