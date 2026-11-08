/* No providers: verify identical civil/solar rendering across browser timezones. */
(() => {
    const assert=(value,label)=>{if(!value)throw new Error(label);};
    const beach={id:'A',latitude:39.17454,longitude:-9.35688};
    const results={}, fingerprints=[];
    const cases=[
        ['2026-03-08T02:30:00Z','2026-03-08T02:30:00',0], // US spring gap, valid in Lisbon
        ['2026-03-29T00:59:00Z','2026-03-29T00:59:00',0],
        ['2026-03-29T01:00:00Z','2026-03-29T02:00:00',3600],
        ['2026-07-08T23:30:00Z','2026-07-09T00:30:00',3600],
        ['2026-10-25T00:30:00Z','2026-10-25T01:30:00',3600],
        ['2026-10-25T01:30:00Z','2026-10-25T01:30:00',0],
        ['2026-12-31T23:59:00Z','2026-12-31T23:59:00',0],
        ['2027-01-01T00:00:00Z','2027-01-01T00:00:00',0]
    ];
    try {
        for(const [instant,civil,offset] of cases){
            const ms=Date.parse(instant), context=environmentContext.create(beach,null,ms);
            assert(context.clock.civilTime===civil && context.clock.utcOffsetSeconds===offset,'Lisbon instant conversion '+instant);
            const state=getCelestialState(context.celestialWeather,context.clock), sun=state.sun.position;
            assert(sun && Number.isFinite(sun.altitude) && sun.localTime.getHours()===Number(civil.slice(11,13)), 'Solar clock '+instant);
            assert(sun.utcOffsetSeconds===offset,'Exact repeated-hour offset '+instant);
            const svg=renderCelestialGraphic(state,context.celestialWeather,600,300);
            assert(svg.includes('<svg') && !svg.includes('NaN'),'Finite solar path '+instant);
            fingerprints.push({civil,offset,altitude:sun.altitude,azimuth:sun.azimuth,
                sunrise:sun.sunriseTime.getTime(),sunset:sun.sunsetTime.getTime(),svg});
        }
        results.lisbonClockDSTAndZoneIndependence=true;
        const weather={requestedBeachId:beach.id,requestedLatitude:beach.latitude,requestedLongitude:beach.longitude,
            latitude:0,longitude:0,currentTime:'2026-07-08T23:45',conditionTimeMs:123,fetchedAtMs:456,
            sunrise:'2026-07-08T06:13',sunset:'2026-07-08T21:01',moonPhase:.5};
        const original=JSON.stringify(weather);
        const loaded=environmentContext.create(beach,weather,Date.parse('2026-07-08T11:00:00Z'));
        const state=getCelestialState(loaded.celestialWeather,loaded.clock);
        assert(loaded.celestialWeather.latitude===beach.latitude && loaded.celestialWeather.longitude===beach.longitude,'Selected location rather than provider grid');
        assert(state.sun.position.sunriseTime.getHours()===6 && state.sun.position.sunriseTime.getMinutes()===13,'Same-day provider sunrise retained');
        const midnight=environmentContext.create(beach,weather,Date.parse('2026-07-08T23:30:00Z'));
        const next=getCelestialState(midnight.celestialWeather,midnight.clock).sun.position;
        assert(next.sunriseTime.getDate()===9 && next.sunsetTime.getDate()===9,'Midnight changes horizon calendar');
        assert(JSON.stringify(weather)===original && midnight.celestialWeather.currentTime===weather.currentTime,'Model timestamps remain immutable');
        const mismatch=environmentContext.create({...beach,id:'B'},weather,Date.parse('2026-07-08T11:00:00Z'));
        assert(mismatch.celestialWeather.moonPhase===null && mismatch.celestialWeather.sunrise===null,'Wrong beach weather omitted');
        assert(environmentContext.create(null,weather)===null && environmentContext.clock(NaN)===null,'Unavailable location/clock');
        assert(parseCelestialTime('2026-02-30T12:00')===null,'Invalid civil date rejected');
        assert(parseCelestialTime('2026-03-08T02:30').getHours()===2,'Browser DST gap cannot normalize Lisbon civil time');
        const repeat=cases.slice(4,6).map(([instant])=>{
            const c=environmentContext.create(beach,null,Date.parse(instant));return getCelestialState(c.celestialWeather,c.clock).sun.position.altitude;
        });
        assert(repeat[0]!==repeat[1],'Repeated civil hour retains different physical solar positions');
        results.selectedLocationMidnightAndImmutableModel=true;
        // Preserve the existing horizon path and disc-reveal sequence.
        for(const [time,reveal] of [['21:00',.34],['21:01',.1],['21:02',0],['06:13',.1],['06:14',.34]]){
            const c=environmentContext.create(beach,weather,Date.parse('2026-07-08T'+time+':00Z')-3600000);
            const s=getCelestialState(c.celestialWeather,c.clock).sun.position;
            assert(getSunVisualState(s).discReveal===reveal,'Horizon reveal '+time);
        }
        results.horizonPresentation=true;
        window.environmentContractResult={ok:true,results,fingerprints};
    }catch(error){window.environmentContractResult={ok:false,results,error:error.stack||String(error)};}
})();
