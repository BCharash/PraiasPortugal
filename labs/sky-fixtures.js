/* Synthetic normalized service results. No provider requests or live observations. */
(() => {
    "use strict";

    const cases = {
        clear: { label: "Clear day", time: "12:00", temperature: 20, code: 0, total: 0, low: 0, mid: 0, high: 0 },
        mixed: { label: "Mixed clouds", time: "12:00", temperature: 17, code: 2, total: 60, low: 20, mid: 60, high: 95 },
        rain: { label: "Rain", time: "12:00", temperature: 13, code: 63, total: 95, low: 95, mid: 60, high: 20 },
        snow: { label: "Snow", time: "12:00", temperature: 0, code: 73, total: 95, low: 95, mid: 60, high: 20 },
        night: { label: "Clear night", time: "22:00", temperature: 10, code: 0, total: 0, low: 0, mid: 0, high: 0 },
        overcast: { label: "Near-overcast", time: "12:00", temperature: 15, code: 3, total: 95, low: 95, mid: 95, high: 95 },
        dusk: { label: "Dusk", time: "17:45", temperature: 14, code: 2, total: 20, low: 20, mid: 0, high: 20 },
        missing: { label: "Cloud data missing", time: "22:00", temperature: 10, code: null, total: null, low: null, mid: null, high: null }
    };
    for (const tier of ["low", "mid", "high"]) {
        for (const amount of [20, 60, 95]) {
            cases[`${tier}${amount}`] = {
                label: `${tier[0].toUpperCase() + tier.slice(1)} clouds ${amount}%`,
                time: "12:00", temperature: 17, code: amount === 95 ? 3 : 2,
                total: amount, low: 0, mid: 0, high: 0, [tier]: amount
            };
        }
    }

    function civilTime(key) {
        return `2026-11-07T${cases[key].time}`;
    }

    const times = Array.from({ length: 48 }, (_, hour) =>
        `2026-11-${String(7 + Math.floor(hour / 24)).padStart(2, "0")}T${String(hour % 24).padStart(2, "0")}:00`
    );
    const repeat = value => times.map(() => value);

    function weather(key, beach) {
        const fixture = cases[key];
        const isDay = fixture.time >= "07:12" && fixture.time <= "17:29";
        return {
            latitude: beach.latitude, longitude: beach.longitude,
            timezone: "Europe/Lisbon", utcOffsetSeconds: 0,
            currentTime: civilTime(key),
            airTemperature: fixture.temperature, apparentTemperature: fixture.temperature - 1,
            relativeHumidity: 70, dewPoint: fixture.temperature - 5, visibility: 20000,
            highTemperature: fixture.temperature + 3, lowTemperature: fixture.temperature - 4,
            windSpeed: 15, windDirection: 315, windGusts: 24,
            cloudCover: fixture.total, cloudCoverLow: fixture.low,
            cloudCoverMid: fixture.mid, cloudCoverHigh: fixture.high,
            precipitationProbability: key === "rain" || key === "snow" ? 70 : 0,
            precipitationProbabilityMax: key === "rain" || key === "snow" ? 80 : 0,
            precipitation: key === "rain" ? 2 : 0,
            rain: key === "rain" ? 2 : 0, showers: 0, snowfall: key === "snow" ? 0.5 : 0,
            weatherCode: fixture.code,
            description: fixture.label,
            icon: ({ clear: "clear-day", mixed: "partly-cloudy-day", rain: "rain", snow: "snow", night: "clear-night", missing: "unknown" })[key] || (isDay ? "cloudy" : "partly-cloudy-night"),
            uvIndex: isDay ? 3 : 0, uvIndexMax: 4,
            sunrise: "2026-11-07T07:12", sunset: "2026-11-07T17:29",
            moonPhase: 0.94, moonrise: "2026-11-07T05:00", moonset: "2026-11-07T15:50",
            isDay,
            hourly: {
                time: [...times], temperature_2m: repeat(fixture.temperature),
                relative_humidity_2m: repeat(70), dew_point_2m: repeat(fixture.temperature - 5),
                visibility: repeat(20000), cloud_cover_low: repeat(fixture.low),
                wind_speed_10m: repeat(15), weather_code: repeat(fixture.code)
            }
        };
    }

    function marine() {
        return {
            source: "Synthetic preview fixture",
            fetchedAt: "2026-11-07T12:00:00Z",
            sea: { temperature: 17 },
            waves: { height: 1.2, direction: 300, period: 10, peakPeriod: 12 },
            windWaves: { height: 0.4, direction: 315, period: 4, peakPeriod: 5 },
            swell: { height: 1, direction: 290, period: 10, peakPeriod: 12 },
            current: { velocity: 0.2, direction: 180 },
            tide: { seaLevel: 0 },
            hourly: {
                time: [...times],
                tide: { seaLevel: times.map((_, hour) => Math.sin(hour * Math.PI / 6) * 1.1) }
            }
        };
    }

    window.skyPreviewFixtures = { cases, civilTime, weather, marine };
})();
