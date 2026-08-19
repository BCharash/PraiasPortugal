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
        `relative_humidity_2m,` +
        `wind_speed_10m,` +
        `wind_direction_10m,` +
        `wind_gusts_10m,` +
        `weather_code,` +
        `cloud_cover,` +
        `cloud_cover_low,` +
        `cloud_cover_mid,` +
        `cloud_cover_high,` +
        `precipitation_probability,` +
        `precipitation,` +
        `rain,` +
        `showers,` +
        `snowfall,` +
        `uv_index,` +
        `is_day` +
        `&timezone=Europe%2FLisbon` +
        `&daily=` +
        `temperature_2m_max,` +
        `temperature_2m_min,` +
        `uv_index_max,` +
        `precipitation_probability_max,` +
        `sunrise,` +
        `sunset,` +
        `moon_phase,` +
        `moonrise,` +
        `moonset`;

    const response =
        await fetch(url);

    const data =
        await response.json();

    return {

        //--------------------------------------------------
        // Air
        //--------------------------------------------------

        airTemperature:
            data.current.temperature_2m,

        apparentTemperature:
            data.current.apparent_temperature,

        relativeHumidity:
            data.current.relative_humidity_2m,

        highTemperature:
            data.daily.temperature_2m_max[0],

        lowTemperature:
            data.daily.temperature_2m_min[0],


        //--------------------------------------------------
        // Wind
        //--------------------------------------------------

        windSpeed:
            data.current.wind_speed_10m,

        windDirection:
            data.current.wind_direction_10m,

        windGusts:
            data.current.wind_gusts_10m,


        //--------------------------------------------------
        // Clouds
        //--------------------------------------------------

        cloudCover:
            data.current.cloud_cover,

        cloudCoverLow:
            data.current.cloud_cover_low,

        cloudCoverMid:
            data.current.cloud_cover_mid,

        cloudCoverHigh:
            data.current.cloud_cover_high,


        //--------------------------------------------------
        // Precipitation
        //--------------------------------------------------

        precipitationProbability:
            data.current.precipitation_probability,

        precipitationProbabilityMax:
            data.daily.precipitation_probability_max[0],

        precipitation:
            data.current.precipitation,

        rain:
            data.current.rain,

        showers:
            data.current.showers,

        snowfall:
            data.current.snowfall,


        //--------------------------------------------------
        // Weather
        //--------------------------------------------------

        weatherCode:
            data.current.weather_code,

        description:
            getWeatherDescription(
                data.current.weather_code
            ),

        icon:
            getWeatherIcon(
                data.current.weather_code,
                data.current.is_day === 1
            ),


        //--------------------------------------------------
        // UV
        //--------------------------------------------------

        uvIndex:
            data.current.uv_index,

        uvIndexMax:
            data.daily.uv_index_max[0],


        //--------------------------------------------------
        // Daylight
        //--------------------------------------------------

        sunrise:
            data.daily.sunrise[0],

        sunset:
            data.daily.sunset[0],


        //--------------------------------------------------
        // Moon
        //--------------------------------------------------

        moonPhase:
            data.daily.moon_phase[0],

        moonrise:
            data.daily.moonrise[0],

        moonset:
            data.daily.moonset[0],


        //--------------------------------------------------
        // Day / Night
        //--------------------------------------------------

        isDay:
            data.current.is_day === 1

    };

}


//--------------------------------------------------
// Private Functions
//--------------------------------------------------

function getWeatherDescription(weatherCode) {

    switch (weatherCode) {

        case 0:  return "Clear sky";
        case 1:  return "Mainly clear";
        case 2:  return "Partly cloudy";
        case 3:  return "Overcast";

        case 45:
        case 48:
            return "Fog";

        case 51:
        case 53:
        case 55:
            return "Drizzle";

        case 61:
        case 63:
        case 65:
            return "Rain";

        case 71:
        case 73:
        case 75:
            return "Snow";

        case 80:
        case 81:
        case 82:
            return "Rain showers";

        case 95:
            return "Thunderstorm";

        case 96:
        case 99:
            return "Thunderstorm with hail";

        default:
            return "Unknown";

    }

}


function getWeatherIcon(weatherCode, isDay) {

    switch (weatherCode) {

        case 0:
            return isDay ? "clear-day" : "clear-night";

        case 1:
            return isDay ? "mainly-clear-day" : "mainly-clear-night";

        case 2:
            return isDay ? "partly-cloudy-day" : "partly-cloudy-night";

        case 3:
            return "cloudy";

        case 45:
        case 48:
            return "fog";

        case 51:
        case 53:
        case 55:
            return "drizzle";

        case 61:
        case 63:
        case 65:
        case 80:
        case 81:
        case 82:
            return "rain";

        case 71:
        case 73:
        case 75:
            return "snow";

        case 95:
        case 96:
        case 99:
            return "thunderstorm";

        default:
            return "unknown";

    }

}