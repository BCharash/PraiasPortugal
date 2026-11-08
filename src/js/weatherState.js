/* Shared pure weather semantics. No requests, timers, storage or DOM updates. */
(() => {
    "use strict";
function getSkyCondition(code){
  const definitions = [
    [[0], "Clear", "clear", null, "weatherClearSky"], [[1], "Mainly Clear", "mainly-clear", null, "weatherMainlyClear"],
    [[2], "Partly Cloudy", "partly-cloudy", null, "weatherPartlyCloudy"], [[3], "Overcast", "cloud", null, "weatherOvercast"],
    [[45,48], "Fog", "fog", null, "weatherFog"], [[51,53,55], "Drizzle", "rain", "rain", "weatherDrizzle"],
    [[56,57], "Freezing Drizzle", "rain", "rain", "weatherFreezingDrizzle"], [[61,63,65], "Rain", "rain", "rain", "weatherRain"],
    [[66,67], "Freezing Rain", "rain", "rain", "weatherFreezingRain"], [[71,73,75], "Snow", "snow", "snow", "weatherSnow"],
    [[77], "Snow Grains", "snow", "snow", "weatherSnowGrains"], [[80,81,82], "Rain Showers", "rain", "rain", "weatherRainShowers"],
    [[85,86], "Snow Showers", "snow", "snow", "weatherSnowShowers"], [[95,97], "Thunderstorm", "storm", "rain", "weatherThunderstorm"],
    [[96,99], "Thunderstorm with Hail", "storm", "rain", "weatherThunderstormHail"]
  ];
  const entry=definitions.find(([codes])=>codes.includes(code));
  const intensity=[51,56,61,66,71,77,80,85].includes(code) ? "light" :
    [55,57,65,67,75,82,86,96,97,99].includes(code) ? "heavy" : "moderate";
  return entry ? {label:entry[1],icon:entry[2],precipitation:entry[3],translationKey:entry[4],intensity,
    drizzle:[51,53,55,56,57].includes(code)} :
    {label:"Conditions unavailable",icon:"unknown",precipitation:null,translationKey:null};
}

const MINUTE = 60000;
function evaluate(snapshot, beach, now) {
    const unavailable = reason => ({status: "unavailable", reason, weather: null, ageMs: null});
    if (!snapshot || !snapshot.weather || typeof snapshot.weather !== "object" || Array.isArray(snapshot.weather)) return unavailable("No weather data");
    if (!beach || !Number.isFinite(beach.latitude) || Math.abs(beach.latitude) > 90 ||
        !Number.isFinite(beach.longitude) || Math.abs(beach.longitude) > 180) return unavailable("Invalid location");
    if (snapshot.beachId !== beach.id || !Number.isFinite(snapshot.latitude) || !Number.isFinite(snapshot.longitude) ||
        Math.abs(snapshot.latitude - beach.latitude) > .000001 || Math.abs(snapshot.longitude - beach.longitude) > .000001) {
        return unavailable("Location mismatch");
    }
    if (![now, snapshot.fetchedAtMs, snapshot.conditionTimeMs].every(Number.isFinite) ||
        snapshot.fetchedAtMs <= 0 || snapshot.conditionTimeMs <= 0 ||
        snapshot.fetchedAtMs > now + MINUTE || snapshot.conditionTimeMs > now + MINUTE) return unavailable("Invalid weather time");
    const ageMs = Math.max(0, now - snapshot.fetchedAtMs, now - snapshot.conditionTimeMs);
    return {status: ageMs >= 60 * MINUTE ? "expired" : ageMs >= 15 * MINUTE ? "stale" : "fresh",
        reason: ageMs >= 60 * MINUTE ? "Conditions expired" : "", ageMs,
        weather: ageMs < 60 * MINUTE ? snapshot.weather : null};
}

window.weatherState = {condition: getSkyCondition, evaluate};
})();
