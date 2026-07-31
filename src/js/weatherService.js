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
        `&current=` +
        `temperature_2m,` +
        `apparent_temperature,` +
        `wind_speed_10m,` +
        `wind_direction_10m,` +
        `wind_gusts_10m,` +
        `weather_code,` +
        `is_day`;

 const response = await fetch(url);

console.log("Response Status:", response.status);

const text = await response.text();

console.log("Raw Response:");
console.log(text);

const data = JSON.parse(text);

    return {

        airTemperature:      data.current.temperature_2m,
        apparentTemperature: data.current.apparent_temperature,

        windSpeed:           data.current.wind_speed_10m,
        windDirection:       data.current.wind_direction_10m,
        windGusts:           data.current.wind_gusts_10m,

        weatherCode:         data.current.weather_code,
        isDay:               data.current.is_day

    };

}


//--------------------------------------------------
// Private Functions
//--------------------------------------------------