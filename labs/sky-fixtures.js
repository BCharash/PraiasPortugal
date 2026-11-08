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
    for (const [code, label] of [[51,"Light drizzle"],[55,"Heavy drizzle"],[56,"Freezing drizzle"],
        [61,"Light rain"],[65,"Heavy rain"],[66,"Freezing rain"],[71,"Light snow"],[75,"Heavy snow"],
        [77,"Snow grains"],[80,"Light rain showers"],[82,"Heavy rain showers"],[85,"Light snow showers"],
        [86,"Heavy snow showers"],[95,"Thunderstorm"],[96,"Thunderstorm with hail"],[45,"Fog"],[999,"Unknown condition"]]) {
        cases[`code${code}`] = { label, time: "12:00", temperature: 5, code, total: 95, low: 95, mid: 60, high: 20 };
    }
    for (const tier of ["low", "mid", "high"]) {
        for (const amount of [20, 60, 95]) {
            cases[`${tier}${amount}`] = {
                label: `${tier[0].toUpperCase() + tier.slice(1)} clouds ${amount}%`,
                time: "12:00", temperature: 17, code: amount === 95 ? 3 : 2,
                total: amount, low: 0, mid: 0, high: 0, [tier]: amount
            };
        }
    }
    cases.noTemperature = {...cases.rain, label: "Rain, temperature missing", temperature: null};
    cases.invalidClouds = {...cases.mixed, label: "Invalid cloud values", low: -20, mid: "60", high: 150};
    const scenarios = {
        fresh: "Fresh", stale: "Stale (20 min)", expired: "Expired (60 min)", offline: "Offline startup",
        invalidTime: "Missing condition time", futureTime: "Future condition time", oldModel: "New fetch, old model time",
        wrongLocation: "Wrong location", staleSuccess: "Stale → refresh succeeds", staleFailure: "Stale → refresh fails",
        delayed: "Delayed first weather", timeout: "Refresh times out (10 sec)", lateBeach: "Late response from another beach"
    };

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
        const condition = skyWeatherState.condition(fixture.code);
        const result = {
            latitude: beach.latitude, longitude: beach.longitude,
            timezone: "Europe/Lisbon", utcOffsetSeconds: 0,
            currentTime: civilTime(key),
            airTemperature: fixture.temperature, apparentTemperature: fixture.temperature - 1,
            relativeHumidity: 70, dewPoint: fixture.temperature - 5, visibility: 20000,
            highTemperature: fixture.temperature + 3, lowTemperature: fixture.temperature - 4,
            windSpeed: 15, windDirection: 315, windGusts: 24,
            cloudCover: fixture.total, cloudCoverLow: fixture.low,
            cloudCoverMid: fixture.mid, cloudCoverHigh: fixture.high,
            precipitationProbability: condition.precipitation ? 70 : 0,
            precipitationProbabilityMax: condition.precipitation ? 80 : 0,
            precipitation: condition.precipitation ? 2 : 0,
            rain: condition.precipitation === "rain" ? 2 : 0, showers: 0, snowfall: condition.precipitation === "snow" ? 0.5 : 0,
            weatherCode: fixture.code,
            description: fixture.label,
            icon: condition.precipitation || ({ clear: "clear-day", mixed: "partly-cloudy-day", night: "clear-night", missing: "unknown" })[key] || condition.icon,
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
        if (!Number.isFinite(fixture.temperature)) {
            for (const field of ["airTemperature", "apparentTemperature", "dewPoint", "highTemperature", "lowTemperature"]) result[field] = null;
        }
        return result;
    }

    function snapshot(key, beach, now, scenario = "fresh") {
        if (scenario === "offline" || scenario === "delayed") return null;
        const stale = ["stale", "staleSuccess", "staleFailure", "timeout"].includes(scenario);
        return {
            beachId: beach.id, latitude: beach.latitude + (scenario === "wrongLocation" ? 1 : 0), longitude: beach.longitude,
            fetchedAtMs: now - (stale ? 20 * 60000 : scenario === "expired" ? 60 * 60000 : 0),
            conditionTimeMs: scenario === "invalidTime" ? null : now + (scenario === "futureTime" ? 3600000 :
                scenario === "oldModel" ? -65 * 60000 : stale ? -20 * 60000 : scenario === "expired" ? -60 * 60000 : 0),
            weather: weather(key, beach)
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

    window.skyPreviewFixtures = { cases, scenarios, civilTime, weather, marine, snapshot };
})();
