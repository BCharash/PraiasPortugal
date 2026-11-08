/* Shared selected-location/Lisbon-clock boundary. No requests, timers or storage. */
(() => {
    "use strict";
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone:"Europe/Lisbon", year:"numeric", month:"2-digit", day:"2-digit",
        hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23"
    });
    function clock(instantMs = Date.now()) {
        if (!Number.isFinite(instantMs)) return null;
        const instant = new Date(instantMs);
        if (Number.isNaN(instant.getTime())) return null;
        const parts = {};
        for (const part of formatter.formatToParts(instant)) parts[part.type] = part.value;
        const civilTime = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
        return Object.freeze({instantMs, civilTime,
            utcOffsetSeconds:(weatherTime.parseConditionTime(civilTime,0)-Math.floor(instantMs/1000)*1000)/1000});
    }

    // These are civil arithmetic containers, NOT instants. UTC-backed local
    // accessors keep existing solar formulas independent of browser DST rules.
    class CivilDate extends Date {
        getFullYear(){return this.getUTCFullYear();}
        getMonth(){return this.getUTCMonth();}
        getDate(){return this.getUTCDate();}
        getDay(){return this.getUTCDay();}
        getHours(){return this.getUTCHours();}
        getMinutes(){return this.getUTCMinutes();}
        getSeconds(){return this.getUTCSeconds();}
        getMilliseconds(){return this.getUTCMilliseconds();}
        setFullYear(...args){return this.setUTCFullYear(...args);}
        setMonth(...args){return this.setUTCMonth(...args);}
        setDate(...args){return this.setUTCDate(...args);}
        setHours(...args){return this.setUTCHours(...args);}
        setMinutes(...args){return this.setUTCMinutes(...args);}
        setSeconds(...args){return this.setUTCSeconds(...args);}
        setMilliseconds(...args){return this.setUTCMilliseconds(...args);}
    }
    function civilDate(...args) {
        return new CivilDate(args.length > 1 ? Date.UTC(...args) : args[0]);
    }
    function parseCivil(value) {
        const pseudoMs = weatherTime.parseConditionTime(value,0);
        return pseudoMs === null ? null : civilDate(pseudoMs);
    }
    function create(beach, weather, instantMs = Date.now()) {
        const currentClock = clock(instantMs);
        if (!currentClock || !beach || !Number.isFinite(beach.latitude) || Math.abs(beach.latitude)>90 ||
            !Number.isFinite(beach.longitude) || Math.abs(beach.longitude)>180 || beach.id == null) return null;
        const matching = weather && weather.requestedBeachId === beach.id &&
            weather.requestedLatitude === beach.latitude && weather.requestedLongitude === beach.longitude;
        return Object.freeze({beach:Object.freeze({id:beach.id,latitude:beach.latitude,longitude:beach.longitude}),
            clock:currentClock,
            celestialWeather:{...(matching ? weather : {sunrise:null,sunset:null,moonPhase:null,moonrise:null,moonset:null}),
                latitude:beach.latitude,longitude:beach.longitude,
                currentTime:matching ? weather.currentTime : currentClock.civilTime}});
    }
    window.environmentContext = {clock,create,civilDate,parseCivil};
})();
