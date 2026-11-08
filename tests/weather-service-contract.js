/* Every provider response is mocked. The page CSP also forbids network fetches. */
(async () => {
    "use strict";
    const results = {};
    const assert = (value, label) => { if (!value) throw new Error(label); };
    const clone = value => JSON.parse(JSON.stringify(value));
    const beach = {id:"contract-beach",latitude:39.17454,longitude:-9.35688};
    const now = Date.parse("2026-11-08T12:08:00Z");
    const originalNow = Date.now;
    const originalFetch = window.fetch;
    Date.now = () => now;
    const raw = {
        latitude:39.2,longitude:-9.4,timezone:"Europe/Lisbon",utc_offset_seconds:0,
        current:{time:"2026-11-08T12:00",temperature_2m:18,apparent_temperature:17,
            relative_humidity_2m:70,dew_point_2m:12,visibility:20000,wind_speed_10m:15,
            wind_direction_10m:315,wind_gusts_10m:24,weather_code:2,cloud_cover:60,
            cloud_cover_low:20,cloud_cover_mid:60,cloud_cover_high:95,precipitation_probability:30,
            precipitation:0,rain:0,showers:0,snowfall:0,uv_index:3,is_day:1},
        daily:{temperature_2m_max:[21],temperature_2m_min:[14],uv_index_max:[4],
            precipitation_probability_max:[40],sunrise:["2026-11-08T07:13"],sunset:["2026-11-08T17:28"],
            moon_phase:[.96],moonrise:["2026-11-08T06:00"],moonset:["2026-11-08T16:00"]},
        hourly:{time:["2026-11-08T12:00","2026-11-08T13:00"],temperature_2m:[18,19],
            relative_humidity_2m:[70,68],dew_point_2m:[12,12],visibility:[20000,20000],
            cloud_cover_low:[20,25],wind_speed_10m:[15,16],weather_code:[2,2]}
    };
    window.weatherContractFixture = clone(raw);
    let calls = [];
    const mock = value => {
        calls = [];
        window.fetch = async (url, options) => {
            calls.push({url:new URL(url),options});
            return {ok:true,json:async()=>clone(value)};
        };
    };
    const rejects = async (fn, label) => {
        try { await fn(); } catch (error) { assert(error instanceof Error || error instanceof DOMException,label); return error; }
        throw new Error("Expected rejection: " + label);
    };
    try {
        mock(raw);
        const full = await getCurrentWeather(beach);
        const expected = {
            latitude:39.2,longitude:-9.4,timezone:"Europe/Lisbon",utcOffsetSeconds:0,currentTime:raw.current.time,
            airTemperature:18,apparentTemperature:17,relativeHumidity:70,dewPoint:12,visibility:20000,
            highTemperature:21,lowTemperature:14,windSpeed:15,windDirection:315,windGusts:24,
            cloudCover:60,cloudCoverLow:20,cloudCoverMid:60,cloudCoverHigh:95,
            precipitationProbability:30,precipitationProbabilityMax:40,precipitation:0,rain:0,showers:0,snowfall:0,
            weatherCode:2,description:"Partly cloudy",icon:"partly-cloudy-day",hourly:raw.hourly,
            uvIndex:3,uvIndexMax:4,sunrise:raw.daily.sunrise[0],sunset:raw.daily.sunset[0],
            moonPhase:.96,moonrise:raw.daily.moonrise[0],moonset:raw.daily.moonset[0],isDay:true
        };
        for (const [key,value] of Object.entries(expected)) assert(JSON.stringify(full[key])===JSON.stringify(value),"Legacy field changed: "+key);
        assert(full.requestedBeachId===beach.id && full.requestedLatitude===beach.latitude && full.requestedLongitude===beach.longitude,"Requested identity");
        assert(full.conditionTimeMs===Date.parse("2026-11-08T12:00:00Z") && full.fetchedAtMs===now,"Time metadata");
        assert(calls.length===1,"Single weather request");
        const params = calls[0].url.searchParams;
        assert(params.get('current').split(',').includes('is_day') && !params.has('is_day') && !params.get('current').endsWith(','),"is_day query membership");
        assert(params.get('timezone')==='Europe/Lisbon' && !params.has('timeformat') && calls[0].url.origin==='https://api.open-meteo.com',"Legacy query/time contract");
        results.legacyShapeAndMetadata = true;

        window.appState = {settings:{temperatureUnit:"celsius",windSpeedUnit:"kmh"}};
        window.translate = key=>key;
        assert(formatAirTemperature(full)==='18°C' && formatHumidity(full).includes('70%') && formatWind(full).includes('15 km/h'),"Formatter compatibility");
        const celestial = getCelestialState(full);
        assert(celestial?.sun.position && Number.isFinite(celestial.sun.position.altitude),"Celestial input compatibility");
        results.consumers = true;

        const zero = clone(raw);
        for (const key of Object.keys(zero.current)) if (key!=='time') zero.current[key]=0;
        for (const key of ['temperature_2m_max','temperature_2m_min','uv_index_max','precipitation_probability_max','moon_phase']) zero.daily[key]=[0];
        mock(zero); const z=await getCurrentWeather(beach);
        assert(z.airTemperature===0 && z.relativeHumidity===0 && z.windSpeed===0 && z.uvIndex===0 && z.moonPhase===0 && z.cloudCoverLow===0 && z.isDay===false && z.icon==='clear-night',"Zero is valid data");
        const missing = clone(raw);
        delete missing.daily; delete missing.hourly;
        missing.current.temperature_2m=null; missing.current.wind_speed_10m="15"; missing.current.is_day=null;
        mock(missing); const m=await getCurrentWeather(beach);
        assert(m.airTemperature===null && m.windSpeed===null && m.highTemperature===null && m.sunrise===null && m.moonrise===null && m.hourly===null,"Explicit missing values");
        assert(m.cloudCoverLow===20 && m.cloudCoverMid===60 && m.cloudCoverHigh===95 && m.conditionTimeMs===full.conditionTimeMs,"Missing daily/temperature must preserve valid clouds/time");
        assert(getCelestialState(m)?.sun.position,"Missing daily fields remain safe for solar calculation");
        results.zerosAndOptionalFields = true;

        const badValues = clone(raw);
        badValues.current.cloud_cover_low=-20; badValues.current.cloud_cover_mid="60"; badValues.current.cloud_cover_high=150;
        badValues.current.uv_index="3"; badValues.current.weather_code="0";
        badValues.hourly.time[0]="not-a-time";
        mock(badValues); const bad=await getCurrentWeather(beach);
        assert(bad.cloudCoverLow===0 && bad.cloudCoverMid===null && bad.cloudCoverHigh===100 && bad.weatherCode===null && bad.uvIndex===null && bad.hourly===null,"Malformed numeric/hourly values");
        results.normalization = true;

        for (const patch of [{time:null},{time:"2026-02-30T12:00"}]) {
            const value=clone(raw); Object.assign(value.current,patch); mock(value);
            const w=await getCurrentWeather(beach); assert(w.conditionTimeMs===null && w.currentTime===null && w.airTemperature===18,"Missing/invalid current time");
        }
        const noOffset=clone(raw); delete noOffset.utc_offset_seconds; mock(noOffset);
        const no=await getCurrentWeather(beach);
        assert(no.conditionTimeMs===null && no.currentTime===raw.current.time,"Missing offset must not invent instant");
        const summer=clone(raw);summer.utc_offset_seconds=3600;summer.current.time="2026-07-01T12:00";mock(summer);
        assert((await getCurrentWeather(beach)).conditionTimeMs===Date.parse('2026-07-01T11:00:00Z'),"Summer response offset");
        const parse=weatherTime.parseConditionTime;
        assert(parse('2026-10-25T01:30',0)-parse('2026-10-25T01:30',3600)===3600000,"Repeated autumn hour");
        assert(parse('2026-03-29T02:15',3600)-parse('2026-03-29T00:45',0)===1800000,"Spring transition");
        assert(parse('2024-02-29T00:00',0)!==null && parse('2026-02-29T00:00',0)===null && parse('2026-11-08T24:00',0)===null && parse('2026-11-08T12:00',.5)===null,"Strict calendar/offset validation");
        results.civilTimeAndDST = true;

        for (const value of [null,[],{}, {current:[]}, {...raw,current:{}}, {...raw,current:{time:raw.current.time}}, {...raw,latitude:null}, {...raw,error:true}]) {
            mock(value); await rejects(()=>getCurrentWeather(beach),"Malformed response");
        }
        let jsonCalled=false;
        window.fetch=async()=>({ok:false,status:503,json:async()=>{jsonCalled=true;}});
        await rejects(()=>getCurrentWeather(beach),"HTTP failure");assert(!jsonCalled,"HTTP error must not be normalized");
        window.fetch=async()=>({ok:true,json:async()=>{throw new SyntaxError('Bad JSON');}});
        await rejects(()=>getCurrentWeather(beach),"Malformed JSON");
        window.fetch=async()=>{throw new TypeError('Network unavailable');};
        await rejects(()=>getCurrentWeather(beach),"Network failure");
        mock(raw);
        for (const location of [null,{...beach,id:''},{...beach,id:NaN},{...beach,latitude:91},{...beach,longitude:"-9"}]) await rejects(()=>getCurrentWeather(location),"Invalid requested beach");
        assert(calls.length===0,"Invalid identity must not fetch");
        results.failureHandling = true;

        const abort=new AbortController(); abort.abort(); mock(raw);
        await rejects(()=>getCurrentWeather(beach,{signal:abort.signal}),"Aborted before fetch"); assert(calls.length===0,"Pre-abort must not fetch");
        const active=new AbortController();mock(raw);
        await getCurrentWeather(beach,{signal:active.signal});assert(calls[0].options.signal===active.signal,"Signal forwarded");
        let deliver;
        window.fetch=async()=>({ok:true,json:()=>new Promise(resolve=>deliver=resolve)});
        const late=new AbortController();const pending=getCurrentWeather(beach,{signal:late.signal});
        while(!deliver) await Promise.resolve();
        late.abort();deliver(clone(raw));
        assert((await rejects(()=>pending,"Late response after ignored abort")).name==='AbortError',"Ignored abort must not publish response");
        const mutable={...beach};mock(raw);const request=getCurrentWeather(mutable);mutable.id='other';mutable.latitude=40;
        const captured=await request;
        assert(captured.requestedBeachId===beach.id && captured.requestedLatitude===beach.latitude,"In-flight identity capture");
        results.abortAndIdentityCapture = true;

        const envelope={beachId:beach.id,latitude:beach.latitude,longitude:beach.longitude,
            fetchedAtMs:full.fetchedAtMs,conditionTimeMs:full.conditionTimeMs,weather:full};
        assert(weatherState.evaluate(envelope,beach,now).status==='fresh' && weatherState.evaluate({...envelope,conditionTimeMs:now-3600000},beach,now).status==='expired',"Shared freshness uses valid time");
        assert(weatherState.condition(86).precipitation==='snow' && weatherState.condition(66).precipitation==='rain' && weatherState.evaluate(envelope,null,now).status==='unavailable',"Shared pure semantics");
        results.sharedState = true;
        window.serviceContractResult={ok:true,results};
    } catch (error) {
        window.serviceContractResult={ok:false,results,error:error.stack || String(error)};
    } finally {
        Date.now=originalNow;window.fetch=originalFetch;
    }
})();
