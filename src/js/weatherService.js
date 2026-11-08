//--------------------------------------------------
// Weather Service: one provider request, normalized values and metadata.
// Refresh, freshness policy and deadlines belong to the data manager.
//--------------------------------------------------

const WEATHER_CURRENT_FIELDS = [
    "temperature_2m", "apparent_temperature", "relative_humidity_2m", "dew_point_2m",
    "visibility", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m",
    "weather_code", "cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high",
    "precipitation_probability", "precipitation", "rain", "showers", "snowfall", "uv_index", "is_day"
];
const WEATHER_HOURLY_FIELDS = [
    "temperature_2m", "relative_humidity_2m", "dew_point_2m", "visibility",
    "cloud_cover_low", "wind_speed_10m", "weather_code"
];
const WEATHER_DAILY_FIELDS = [
    "temperature_2m_max", "temperature_2m_min", "uv_index_max", "precipitation_probability_max",
    "sunrise", "sunset", "moon_phase", "moonrise", "moonset"
];

async function getCurrentWeather(beach, {signal} = {}) {
    if (!beach || !(typeof beach.id === "string" ? beach.id.trim() !== "" : Number.isFinite(beach.id)) ||
        !Number.isFinite(beach.latitude) || Math.abs(beach.latitude) > 90 ||
        !Number.isFinite(beach.longitude) || Math.abs(beach.longitude) > 180) {
        throw new Error("A valid beach identity and coordinates are required for weather.");
    }
    // Capture identity before awaiting: callers cannot retarget an in-flight response.
    const requested = {id: beach.id, latitude: beach.latitude, longitude: beach.longitude};
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
        latitude: requested.latitude, longitude: requested.longitude,
        current: WEATHER_CURRENT_FIELDS.join(","), hourly: WEATHER_HOURLY_FIELDS.join(","),
        daily: WEATHER_DAILY_FIELDS.join(","), timezone: "Europe/Lisbon"
    });
    const checkAbort = () => {
        if (signal?.aborted) throw signal.reason || new DOMException("Weather request aborted", "AbortError");
    };
    checkAbort();
    const response = await fetch(url.href, {signal});
    checkAbort();
    if (!response.ok) throw new Error(`Unable to retrieve weather (HTTP ${response.status}).`);
    const data = await response.json();
    checkAbort();
    return normalizeWeatherResponse(data, requested, Date.now());
}

function normalizeWeatherResponse(data, requested, fetchedAtMs) {
    const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
    if (!object(data) || data.error || !object(data.current) ||
        !WEATHER_CURRENT_FIELDS.some(field => Object.hasOwn(data.current, field)) ||
        !Number.isFinite(data.latitude) || Math.abs(data.latitude) > 90 ||
        !Number.isFinite(data.longitude) || Math.abs(data.longitude) > 180) {
        throw new Error("Invalid weather response.");
    }
    const current = data.current;
    const daily = object(data.daily) ? data.daily : {};
    const number = value => Number.isFinite(value) ? value : null;
    const cover = value => Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
    const first = field => Array.isArray(daily[field]) ? daily[field][0] : null;
    const civil = value => weatherTime.parseConditionTime(value, 0) !== null ? value : null;
    const code = Number.isInteger(current.weather_code) ? current.weather_code : null;
    const isDay = current.is_day === 1 ? true : current.is_day === 0 ? false : null;
    const offset = Number.isInteger(data.utc_offset_seconds) && Math.abs(data.utc_offset_seconds) <= 14 * 3600
        ? data.utc_offset_seconds : null;

    let hourly = null;
    if (object(data.hourly) && Array.isArray(data.hourly.time) && data.hourly.time.every(time => civil(time) !== null) &&
        WEATHER_HOURLY_FIELDS.every(field => Array.isArray(data.hourly[field]) && data.hourly[field].length === data.hourly.time.length)) {
        hourly = {...data.hourly, time: [...data.hourly.time]};
        for (const field of WEATHER_HOURLY_FIELDS) {
            hourly[field] = data.hourly[field].map(field === "cloud_cover_low" ? cover : number);
        }
    }

    return {
        // Keep model-grid coordinates and all existing civil-time fields intact.
        latitude: data.latitude, longitude: data.longitude,
        timezone: typeof data.timezone === "string" ? data.timezone : null,
        utcOffsetSeconds: offset, currentTime: civil(current.time),
        requestedBeachId: requested.id, requestedLatitude: requested.latitude, requestedLongitude: requested.longitude,
        conditionTimeMs: weatherTime.parseConditionTime(current.time, offset), fetchedAtMs,
        airTemperature: number(current.temperature_2m), apparentTemperature: number(current.apparent_temperature),
        relativeHumidity: number(current.relative_humidity_2m), dewPoint: number(current.dew_point_2m),
        visibility: number(current.visibility),
        highTemperature: number(first("temperature_2m_max")), lowTemperature: number(first("temperature_2m_min")),
        windSpeed: number(current.wind_speed_10m), windDirection: number(current.wind_direction_10m), windGusts: number(current.wind_gusts_10m),
        cloudCover: cover(current.cloud_cover), cloudCoverLow: cover(current.cloud_cover_low),
        cloudCoverMid: cover(current.cloud_cover_mid), cloudCoverHigh: cover(current.cloud_cover_high),
        precipitationProbability: number(current.precipitation_probability),
        precipitationProbabilityMax: number(first("precipitation_probability_max")),
        precipitation: number(current.precipitation), rain: number(current.rain),
        showers: number(current.showers), snowfall: number(current.snowfall),
        weatherCode: code, description: getWeatherDescription(code),
        icon: isDay === null && [0,1,2].includes(code) ? "unknown" : getWeatherIcon(code, isDay),
        hourly,
        uvIndex: number(current.uv_index), uvIndexMax: number(first("uv_index_max")),
        sunrise: civil(first("sunrise")), sunset: civil(first("sunset")),
        moonPhase: number(first("moon_phase")), moonrise: civil(first("moonrise")), moonset: civil(first("moonset")),
        isDay
    };
}

// Existing description/icon behavior is retained; translation remains in formatters.
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
