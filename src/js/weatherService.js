//--------------------------------------------------
// Weather Service
//
// Retrieves current weather conditions for a beach.
//--------------------------------------------------


//--------------------------------------------------
// Public Functions
//--------------------------------------------------

async function getCurrentWeather(beach) {

    const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${beach.latitude}` +
        `&longitude=${beach.longitude}` +
        `&current=temperature_2m,wind_speed_10m,wind_direction_10m`;

    const response = await fetch(url);

    const data = await response.json();

    console.log("Weather Service:", data);

    return {

        airTemperature: data.current.temperature_2m,
        windSpeed: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m

    };

}


//--------------------------------------------------
// Private Functions
//--------------------------------------------------
