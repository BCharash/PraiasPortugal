/* Deterministic request ownership checks: fake clock/transports, no provider calls. */
(async () => {
    "use strict";
    const results = {};
    const assert = (value, label) => { if (!value) throw new Error(label); };
    const A={id:"A",latitude:39,longitude:-9}, B={id:"B",latitude:40,longitude:-8}, C={id:"C",latitude:41,longitude:-7};
    function harness(options = {}) {
        let clock = Date.parse("2026-11-08T12:00:00Z"), next = 0;
        const timers = new Map(), calls = [], events = [];
        const setTimer=(fn,delay)=>{const id=++next;timers.set(id,{at:clock+delay,fn});return id;};
        const clearTimer=id=>timers.delete(id);
        const manager = createWeatherRequestManager({
            now:()=>clock,
            setTimer, clearTimer,
            service:(beach,{signal})=>new Promise((resolve,reject)=>calls.push({beach,signal,resolve,reject})),
            ...options
        });
        const scheduler=createWeatherScheduler({manager,now:()=>clock,setTimer,clearTimer,
            onChange:event=>events.push(event)});
        return {manager,scheduler,calls,timers,events,get now(){return clock;},
            advance(ms){clock+=ms;for(const [id,t] of [...timers]) if(t.at<=clock){timers.delete(id);t.fn();}},
            weather(beach,age=0){return {requestedBeachId:beach.id,requestedLatitude:beach.latitude,
                requestedLongitude:beach.longitude,fetchedAtMs:clock,conditionTimeMs:clock-age,
                airTemperature:18,weatherCode:2,cloudCoverLow:20,cloudCoverMid:60,cloudCoverHigh:95};}
        };
    }
    const tick = async()=>{await Promise.resolve();await Promise.resolve();};
    try {
        const h=harness();
        const first=h.manager.request(A), joined=h.manager.request(A,{force:true});
        assert(first===joined && h.calls.length===1 && h.timers.size===1,"Join one exact in-flight promise");
        h.calls[0].resolve(h.weather(A));const accepted=await first;
        assert(accepted===await joined && accepted.outcome==='success' && h.timers.size===0,"Joined result settles and clears deadline");
        assert(h.manager.isCurrent(accepted) && h.manager.getData(A)===accepted.data,"Identity-bound accepted data");
        assert((await h.manager.request(A)).outcome==='cached' && h.calls.length===1,"Fresh same-location reuse");
        const waitingB=h.manager.request(B);
        assert(h.manager.getData()===null && h.manager.getData(A)===accepted.data,"No global-slot cross-beach fallback");
        const backA=await h.manager.request(A);
        assert(backA.outcome==='cached' && !h.manager.isCurrent(accepted),"A/B/A invalidates old result even with cached A");
        assert(h.manager.owns(backA) && !h.manager.owns(accepted),"Ownership also guards unavailable display outcomes");
        assert((await waitingB).outcome==='superseded' && h.calls[1].signal.aborted,"Superseded waiter settles immediately");
        const stable=JSON.stringify(h.manager.getStatus());
        h.calls[1].resolve(h.weather(B));await tick();
        assert(JSON.stringify(h.manager.getStatus())===stable && h.manager.getStatus(B).failureCount===0,"Ignored abort cannot write or count as failure");
        h.manager.destroy();results.deduplicationCacheAndABA=true;

        const r=harness();
        const pa=r.manager.request(A), pb=r.manager.request(B);
        assert((await pa).outcome==='superseded' && r.calls[0].signal.aborted,"Cold A superseded by B");
        r.calls[1].resolve(r.weather(B));await pb;
        r.calls[0].resolve(r.weather(A));await tick();
        assert(r.manager.getData().requestedBeachId==='B' && r.manager.getData(A)===null,"Late cold response ignored");
        const moved={...A,latitude:42};const pc=r.manager.request(moved);
        r.calls[2].resolve(r.weather(A));
        const empty=await pc;
        assert(empty.outcome==='error' && r.manager.getData()===null,"Same ID with changed coordinates is a new identity");
        assert(r.manager.owns(empty) && !r.manager.isCurrent(empty),"Current failed result is owned without publishable weather");
        const source={...C}, pd=r.manager.request(source);source.latitude=0;
        assert(r.calls[3].beach.latitude===C.latitude && Object.isFrozen(r.calls[3].beach),"Captured location is immutable");
        r.calls[3].resolve(r.weather(C));assert((await pd).outcome==='success',"Captured identity accepted");
        assert((await r.manager.request({...A,longitude:Infinity})).outcome==='invalid' && r.calls.length===4,"Invalid selection does not fetch");
        r.manager.destroy();results.locationAndGenerationGuards=true;

        const f=harness();let p=f.manager.request(A);f.calls[0].resolve(f.weather(A));const original=(await p).data;
        const stamp=f.manager.getStatus(A).lastUpdated;
        p=f.manager.request(A,{force:true});f.calls[1].reject(new Error("offline"));const failed=await p;
        assert(failed.outcome==='error' && failed.data===original && f.manager.getStatus(A).lastUpdated===stamp,"Failure retains original age/data");
        assert(f.manager.getStatus(A).failureCount===1 && f.manager.getStatus(A).retryAt===f.now+60000,"First retry is sixty seconds");
        assert((await f.manager.request(A,{force:true})).outcome==='backoff' && f.calls.length===2,"Force does not bypass backoff");
        p=f.manager.request(B);f.calls[2].resolve(f.weather(B));await p;
        assert(f.manager.getStatus(B).failureCount===0 && (await f.manager.request(A,{force:true})).outcome==='backoff',"Retries isolated by location");
        f.advance(60000);p=f.manager.request(A,{force:true});
        f.calls[3].resolve({...f.weather(A),conditionTimeMs:original.conditionTimeMs-1});
        assert((await p).outcome==='error' && f.manager.getData(A)===original && f.manager.getStatus(A).failureCount===2,"Older model cannot replace newer accepted data");
        assert(f.manager.getStatus(A).retryAt===f.now+120000,"Exponential retry survives location switch");
        f.manager.destroy();
        const cap=harness();
        for(const delay of [60000,120000,240000,480000,960000,1800000,1800000]){
            const pending=cap.manager.request(A,{force:true});cap.calls.at(-1).reject(new Error("offline"));await pending;
            assert(cap.manager.getStatus().retryAt-cap.now===delay,"Retry cap");cap.advance(delay);
        }
        cap.manager.destroy();results.retryIsolationAndRetention=true;

        const e=harness();p=e.manager.request(A);e.calls[0].resolve(e.weather(A,14*60000));await p;
        e.advance(60000);assert(e.manager.getStatus().freshness==='stale' && e.manager.getData(),"Age uses condition time");
        e.advance(45*60000);assert(e.manager.getStatus().freshness==='expired' && e.manager.getData()===null,"Expired data hidden on read");
        p=e.manager.request(A);e.calls[1].resolve(e.weather(A,20*60000));await p;
        const retained=e.manager.getData();p=e.manager.request(A,{force:true});
        let settled=false;p.then(()=>settled=true);
        e.advance(9999);await tick();assert(!settled && e.timers.size===1,"No early deadline");
        e.advance(1);const timeout=await p;
        assert(timeout.outcome==='timeout' && timeout.data===retained && e.calls[2].signal.aborted && e.timers.size===0,"Ten-second timeout retains matching stale data");
        const afterTimeout=JSON.stringify(e.manager.getStatus());e.calls[2].resolve(e.weather(A));await tick();
        assert(JSON.stringify(e.manager.getStatus())===afterTimeout,"Late timeout response ignored");
        e.manager.destroy();results.expiryAndTimeout=true;

        const d=harness();p=d.manager.request(A);d.calls[0].reject(new DOMException("cancelled","AbortError"));
        assert((await p).outcome==='aborted' && d.manager.getStatus(A).failureCount===0 && d.manager.getStatus(A).retryAt===null,"Abort is not a provider failure");
        p=d.manager.request(A);d.manager.clear();
        assert((await p).outcome==='superseded' && d.timers.size===0 && d.manager.getData()===null,"Clear cancels and forgets identity");
        p=d.manager.request(B);d.manager.destroy();
        assert((await p).outcome==='destroyed' && d.calls[2].signal.aborted && d.timers.size===0,"Destroy releases waiters and timer");
        d.calls[1].resolve(d.weather(A));d.calls[2].resolve(d.weather(B));await tick();
        assert(d.manager.getData()===null && (await d.manager.request(A)).outcome==='destroyed' && d.calls.length===3,"No writes or work after destroy");
        results.cancellationClearAndDestroy=true;

        const bounded=harness({maximumEntries:2});
        for(const beach of [A,B,C]){p=bounded.manager.request(beach);bounded.calls.at(-1).resolve(bounded.weather(beach));await p;}
        assert(bounded.manager.getData(A)===null && bounded.manager.getData(B) && bounded.manager.getData(C),"Bounded memory cache");
        bounded.manager.setPaused(true);
        assert((await bounded.manager.request(A)).outcome==='paused' && bounded.calls.length===3 && bounded.manager.getData()===null,"Paused selection does not leak old active data");
        bounded.manager.setPaused(false);p=bounded.manager.request(A);bounded.calls.at(-1).resolve(bounded.weather(A));await p;
        bounded.manager.destroy();results.pauseAndBoundedMemory=true;

        const cadence=harness();
        p=cadence.scheduler.request(A);cadence.calls[0].resolve(cadence.weather(A,20*60000));await p;await tick();
        assert(cadence.manager.getStatus().freshness==='stale' && cadence.manager.getStatus().nextUpdate===cadence.now+15*60000,
            "Old model time does not change successful refresh cadence");
        assert(cadence.timers.size===1,"One weather wake after completion");
        cadence.advance(14*60000);await tick();assert(cadence.calls.length===1,"No immediate old-model refresh loop");
        cadence.advance(60000);await tick();assert(cadence.calls.length===2 && cadence.timers.size===2,
            "One due request plus freshness wake while request pending");
        cadence.calls[1].reject(new Error('offline'));await tick();
        assert(cadence.manager.getStatus().retryAt===cadence.now+60000 && cadence.timers.size===1,"Retry replaces cadence wake");
        cadence.advance(60000);await tick();assert(cadence.calls.length===3,"First automatic retry");
        cadence.calls[2].reject(new Error('offline'));await tick();
        assert(cadence.manager.getStatus().retryAt===cadence.now+2*60000,"Exponential automatic retry");
        // Stay hidden across all missed retries and the hard expiry boundary.
        cadence.scheduler.setPaused(true);assert(cadence.timers.size===0,"Hidden clears wake");
        cadence.advance(2*60*60000);await tick();assert(cadence.calls.length===3,"No hidden requests");
        cadence.scheduler.setPaused(false);await tick();
        assert(cadence.calls.length===4 && cadence.events.some(e=>e.status.freshness==='expired' && e.weather===null),
            "Resume emits expired state then makes one due request");
        for(let i=0;i<5;i++){cadence.scheduler.setPaused(true);cadence.scheduler.setPaused(false);}
        assert(cadence.calls.length===4 && cadence.timers.size===1,"Repeated resume joins in-flight request, no wake accumulation");
        cadence.calls[3].resolve(cadence.weather(A));await tick();
        assert(cadence.manager.getStatus().failureCount===0 && cadence.timers.size===1,"Success resets retry policy");
        cadence.scheduler.destroy();assert(cadence.timers.size===0,"Shutdown clears scheduler and request timers");
        results.automaticCadenceRetryAndResume=true;

        const deadline=harness();
        p=deadline.scheduler.request(A);deadline.advance(10000);assert((await p).outcome==='timeout',"Scheduled request uses existing ten-second deadline");await tick();
        assert(deadline.manager.getStatus().retryAt===deadline.now+60000 && deadline.timers.size===1,"Timeout schedules one retry wake");
        deadline.advance(60000);await tick();assert(deadline.calls.length===2 && deadline.timers.size===1,"Timeout automatically retries once after backoff");
        deadline.scheduler.destroy();assert(deadline.timers.size===0 && deadline.calls[1].signal.aborted,"Shutdown cancels request deadline and transport");
        await tick();assert(deadline.timers.size===0,"Late shutdown completion cannot resurrect scheduler");
        results.scheduledTimeoutAndShutdown=true;

        const abortedRetry=harness();
        p=abortedRetry.scheduler.request(A);abortedRetry.calls[0].reject(new Error('offline'));await p;await tick();
        abortedRetry.advance(60000);await tick();
        abortedRetry.calls[1].reject(new DOMException('cancelled','AbortError'));await tick();
        assert(abortedRetry.manager.getStatus().failureCount===1 && abortedRetry.manager.getStatus().retryAt===null &&
            abortedRetry.manager.getStatus().nextUpdate===abortedRetry.now+60000,"Abort after backoff waits rather than looping on an old retry deadline");
        await abortedRetry.scheduler.request(undefined);await tick();
        assert(abortedRetry.events.at(-1).beach.id==='A' && abortedRetry.timers.size===1,"Invalid request preserves scheduled selection");
        abortedRetry.scheduler.destroy();
        results.abortAfterRetryAndInvalidSelection=true;

        const boundaries=harness();
        p=boundaries.scheduler.request(A);boundaries.calls[0].resolve(boundaries.weather(A));await p;await tick();
        boundaries.advance(15*60000);await tick();
        assert(boundaries.events.some(e=>e.status.freshness==='stale') && boundaries.calls.length===2,
            "Stale notification occurs without waiting for network success");
        boundaries.calls[1].reject(new Error('offline'));await tick();
        boundaries.advance(45*60000);await tick();
        assert(boundaries.events.some(e=>e.status.freshness==='expired' && e.weather===null),
            "Expiry notification independent of successful fetch");
        boundaries.scheduler.clear();assert(boundaries.timers.size===0 && boundaries.manager.getData()===null,"Clear removes all scheduled work");
        boundaries.scheduler.setPaused(false);assert(boundaries.timers.size===0,"Clear does not resurrect selection");
        p=boundaries.scheduler.request(B);boundaries.scheduler.setPaused(true);
        boundaries.calls.at(-1).resolve(boundaries.weather(B));await p;await tick();
        assert(boundaries.manager.getData().requestedBeachId==='B' && boundaries.timers.size===0,
            "Valid request may settle while hidden without scheduling work");
        boundaries.scheduler.setPaused(false);assert(boundaries.timers.size===1,"Resume fresh data schedules once without fetch");
        const oldCount=boundaries.calls.length;
        p=boundaries.scheduler.request(A);const q=boundaries.scheduler.request(C);
        boundaries.calls.at(-2).resolve(boundaries.weather(A));boundaries.calls.at(-1).resolve(boundaries.weather(C));
        await Promise.all([p,q]);await tick();
        assert(boundaries.events.at(-1).beach.id==='C' && boundaries.events.at(-1).weather.requestedBeachId==='C',
            "Superseded completion cannot publish wrong identity");
        assert(boundaries.calls.length===oldCount+2 && boundaries.timers.size===1,"Beach switches retain one scheduler wake");
        boundaries.scheduler.destroy();assert(boundaries.timers.size===0,"Destroy clears all timers");
        results.freshnessBoundariesAndScheduledSelection=true;

        let count=0;
        DATASETS.weather.service=async(beach,{signal})=>{
            assert(signal instanceof AbortSignal,"Production wrapper forwards signal");count++;
            return {requestedBeachId:beach.id,requestedLatitude:beach.latitude,requestedLongitude:beach.longitude,
                fetchedAtMs:Date.now(),conditionTimeMs:Date.now(),airTemperature:18};
        };
        pauseDataUpdates();assert(await refreshDataset('weather',A)===false && count===0,"Pause before initialization");
        resumeDataUpdates();
        let notifications=0;const unsubscribe=subscribeWeatherUpdates(()=>notifications++);
        const owner=weatherScheduler;initializeDataManager();assert(weatherScheduler===owner,"Repeated initialization retains one owner");
        const [one,two]=await Promise.all([refreshDataset('weather',A),refreshDataset('weather',A)]);
        assert(one===true && two===true && count===1 && getDatasetData('weather',A)?.requestedBeachId==='A',"Boolean wrapper joins requests");
        assert(getDatasetData('weather',B)===null && getAllDataStatus().weather.data===getDatasetData('weather'),"Bound getters and status compatibility");
        assert(notifications>0,"Production subscriber receives updates");unsubscribe();
        const beforeUnsubscribe=notifications;
        const detailed=await refreshWeatherDataset(A);
        assert(notifications===beforeUnsubscribe,"Subscriber cleanup stops notifications");assert(detailed.outcome==='cached' && isWeatherResultCurrent(detailed),"Detailed result compatibility");
        assert(getDataStatus('weather').pendingRefresh===false && !hasPendingRefresh('weather'),"No stranded pending flag");
        DATASETS.marine.service=async()=>({sea:{temperature:17}});
        assert(await refreshDataset('marine',A)===true && getDatasetData('marine').sea.temperature===17,"Other dataset behavior retained");
        clearWeatherDataset();assert(!isWeatherResultCurrent(detailed) && getDatasetData('weather')===null,"Production clear invalidates old result");
        results.productionWrapperCompatibility=true;
        window.requestContractResult={ok:true,results};
    } catch(error) { window.requestContractResult={ok:false,results,error:error.stack || String(error)}; }
})();
