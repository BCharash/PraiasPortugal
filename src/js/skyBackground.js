/* Shared opt-in renderer adapted from ipma-radar's accepted interim sky.
 * CSS owns motion; no weather requests, JavaScript timers or application state.
 */
(() => {
    "use strict";
    let nextInstance = 0;

function getSkyPalette(elevation, weather, revised) {
  const totalClouds = weather?.total ?? 0;
  const overcastFactor = Math.max(0, Math.min(1, (totalClouds - 50) / 45)); // 0 (clear) to 1 (full overcast)
  const isRaining = !!weatherState.condition(weather?.weatherCode).precipitation;

  let gradient = "";
  let label = "";
  let cloudHighFill = "#ffffff";
  let isDark = false;

  if (elevation > 12) {
    // Broad Daylight
    if (isRaining) {
      gradient = "linear-gradient(180deg, #374151 0%, #4b5563 50%, #6b7280 100%)";
      label = "Daylight · precipitation";
      cloudHighFill = "#cbd5e1";
      isDark = true;
    } else if (overcastFactor > 0.4) {
      // Overcast silver/slate sky
      gradient = "linear-gradient(180deg, #5c6b7a 0%, #8292a1 50%, #a4b3c2 100%)";
      label = "Daylight · overcast";
      cloudHighFill = "#e2e8f0";
      isDark = false;
    } else {
      // Clear azure / sky blue
      gradient = "linear-gradient(180deg, #1d6fe9 0%, #4facfe 50%, #8ec5fc 100%)";
      label = "Daylight · clear";
      cloudHighFill = "#ffffff";
      isDark = false;
    }
  } else if (elevation > 3) {
    // Golden Hour
    if (revised && overcastFactor > 0.5 && isRaining) {
      gradient = "linear-gradient(180deg, #495360 0%, #707b87 55%, #9da6ad 100%)";
      label = "Golden hour · overcast precipitation";
      cloudHighFill = "#b6bec6";
      isDark = true;
    } else if (overcastFactor > 0.5) {
      gradient = "linear-gradient(180deg, #334155 0%, #64748b 50%, #94a3b8 100%)";
      label = "Golden hour · overcast";
      cloudHighFill = "#cbd5e1";
      isDark = false;
    } else {
      gradient = "linear-gradient(180deg, #25559c 0%, #d97706 65%, #fbbf24 100%)";
      label = "Golden hour · warm";
      cloudHighFill = "#fed7aa";
      isDark = false;
    }
  } else if (elevation > -4) {
    // Sunset / Sunrise / Civil Twilight
    if (overcastFactor > 0.6) {
      gradient = "linear-gradient(180deg, #1e293b 0%, #475569 50%, #64748b 100%)";
      label = "Twilight · overcast";
      cloudHighFill = "#94a3b8";
      isDark = true;
    } else {
      gradient = "linear-gradient(180deg, #1e293b 0%, #9a3412 40%, #ea580c 70%, #f97316 100%)";
      label = "Twilight · warm";
      cloudHighFill = "#fed7aa";
      isDark = true;
    }
  } else if (elevation > -12) {
    // Nautical Twilight / Dusk
    gradient = "linear-gradient(180deg, #090d1a 0%, #1e1b4b 50%, #312e81 100%)";
      label = "Dusk";
    cloudHighFill = "#4338ca";
    isDark = true;
  } else {
    // Full Night
    if (overcastFactor > 0.6) {
      gradient = "linear-gradient(180deg, #020617 0%, #0b1120 55%, #151f38 100%)";
      label = "Night · overcast";
    } else {
      gradient = "linear-gradient(180deg, #030712 0%, #0b1329 55%, #111d3d 100%)";
      label = "Night";
    }
    cloudHighFill = "#1e293b";
    isDark = true;
  }

  // Shared illumination: altitude does not determine cloud darkness.
  const cloudMidFill=cloudHighFill;
  const cloudLowFill=cloudHighFill;

  // Coverage controls patch count/size; tier opacity remains independently tuned.
  const opacity=(cover,maximum)=>Number.isFinite(cover) && cover>0 ? maximum : 0;
  const highOpacity=opacity(weather?.high,0.75);
  const midOpacity=opacity(weather?.mid,0.85);
  const lowOpacity=opacity(weather?.low,0.95);

  return {
    gradient,
    label,
    cloudHighFill,
    cloudMidFill,
    cloudLowFill,
    highOpacity,
    midOpacity,
    lowOpacity,
    isDark
  };
}

// Give every cloud its own stable speed/phase without touching coverage scaling.
function setCloudDrift(node,index,seed,tier) {
    node.classList.add("sky-cloud-motion");
    const direction=tier === "low" ? -1 : 1;
    const distance=(80+(index*31+seed)%170)*direction;
    node.style.setProperty("--cloud-from-x",`${-distance/2}px`);
    node.style.setProperty("--cloud-to-x",`${distance/2}px`);
    node.style.setProperty("--cloud-from-y",`${-4-(index*7+seed)%12}px`);
    node.style.setProperty("--cloud-to-y",`${3+(index*11+seed)%16}px`);
    node.style.setProperty("--cloud-duration",`${(tier === "high" ? 60 : tier === "mid" ? 40 : 24)+(index*17+seed)%90}s`);
    node.style.setProperty("--cloud-phase",`${-(index*19+seed)%100}s`);
}

function renderSkyClouds(group,tier,cover,opacity,id){
  if(!group) return;
  const count=24;
  const widths={high:1400,mid:1200,low:1300};
  const layouts={high:{seed:5,step:7,offset:3},mid:{seed:13,step:11,offset:13},low:{seed:23,step:5,offset:7}};
  const layout=layouts[tier];
  if(!group.children.length){
    const ns="http://www.w3.org/2000/svg";
    for(let i=0;i<count;i++){
      const outer=document.createElementNS(ns,"g");
      const x=(i%8+0.5)*widths[tier]/8+((i*17+layout.seed*11)%23-11)*2;
      // Spread patches through the full scene instead of repeating three rows.
      // A fixed low-discrepancy sequence keeps each tier stable and distinct.
      const y=50+((i*0.61803398875+layout.seed*0.137)%1)*800;
      outer.setAttribute("transform",`translate(${x} ${y})`);
      const patch=document.createElementNS(ns,"g");
      patch.classList.add("sky-cloud-patch");
      patch.style.opacity="0";
      patch.style.transform="scale(0)";
      const width=0.9+((i*11+layout.seed)%19)/50;
      if(tier==="high"){
        const tilt=-3+(i*5%7);
        patch.innerHTML=`<g fill="var(--cloud-high-fill)" transform="scale(${width} 1) rotate(${tilt})">
          <path d="M -120 12 Q -50 -17 30 -14 Q 80 -13 118 -23 Q 68 -1 4 4 Q -66 6 -120 12 Z" opacity=".5"/>
          <path d="M -92 25 Q -26 2 48 4 Q 91 6 125 -2 Q 71 20 5 17 Q -53 18 -92 25 Z" opacity=".24"/>
        </g>`;
      }else if(tier==="mid"){
        const thickness=.8+(i*5%7)/10;
        patch.innerHTML=`<g fill="var(--cloud-mid-fill)" transform="scale(${width} ${thickness})">
          <path d="M -116 2 Q -89 -22 -48 -16 Q -12 -28 26 -15 Q 70 -22 116 -1 Q 84 13 42 10 Q 0 22 -38 12 Q -84 20 -116 2 Z"/>
          <path d="M -82 17 Q -35 7 9 16 Q 43 11 83 21 Q 41 31 2 26 Q -45 31 -82 17 Z" opacity=".35"/>
        </g>`;
      }else{
        const height=.75+(i*3%7)/15;
        const tops=[
          "M -104 15 Q -110 -13 -79 -16 Q -74 -45 -41 -36 Q -23 -69 10 -43 Q 42 -52 55 -23 Q 89 -29 96 -1 Q 115 2 110 24",
          "M -104 15 Q -112 -7 -88 -13 Q -89 -37 -59 -33 Q -44 -63 -15 -43 Q 16 -58 35 -28 Q 66 -38 77 -13 Q 106 -17 110 24",
          "M -104 15 Q -106 -19 -73 -17 Q -57 -51 -29 -31 Q -6 -65 22 -39 Q 52 -41 60 -16 Q 91 -24 97 3 Q 113 7 110 24"
        ];
        const outline=`${tops[i%3]} Q 53 32 0 28 Q -63 33 -104 24 Z`;
        patch.innerHTML=`<g transform="scale(${width} ${height})">
          <path d="${outline}" fill="var(--cloud-low-fill)"/>
          <path d="${outline}" fill="url(#${id}-low-volume)"/>
        </g>`;
      }
      const motion=document.createElementNS(ns,"g");
      setCloudDrift(motion,i,layout.seed,tier);
      const baseline=document.createElementNS(ns,"g");
      baseline.classList.add("sky-shape-baseline");
      while(patch.firstChild) baseline.append(patch.firstChild);
      const revised=baseline.cloneNode(true);
      revised.setAttribute("class","sky-shape-revised");
      let seed=layout.seed*997+i*131;
      const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const outlines=new Map();
      for(const path of revised.querySelectorAll("path")) {
        const original=path.getAttribute("d");
        if(!outlines.has(original)) outlines.set(original,original.replace(/-?\d+(?:\.\d+)?/g,value=>(Number(value)*(.65+random()*.7)).toFixed(2)));
        path.setAttribute("d",outlines.get(original));
      }
      const breadth=tier === "high" ? .55+random()*1.5 : .6+random()*1.15;
      const depth=tier === "high" ? .3+random()*1.1 : .55+random()*1.05;
      revised.setAttribute("transform",`rotate(${-6+random()*12}) scale(${breadth} ${depth})`);
      revised.setAttribute("opacity",String(.72+random()*.28));
      motion.append(baseline,revised);patch.append(motion);
      outer.appendChild(patch);group.appendChild(outer);
    }
  }
  const amount=Number.isFinite(cover) ? Math.max(0,Math.min(100,cover))/100 : 0;
  group.setAttribute("opacity",opacity.toFixed(2));
  Array.from(group.children).forEach((outer,i)=>{
    const rank=(i*layout.step+layout.offset)%count;
    const growth=Math.max(0,Math.min(1,amount*count-rank));
    const patch=outer.firstElementChild;
    patch.style.opacity=String(growth);
    patch.style.transform=`scale(${growth ? 0.3+0.85*growth : 0})`;
  });
}


// Dense low/mid cloud becomes a continuous, softly textured sheet with
// independent irregular openings. It is a composition heuristic, not a claim
// that model coverage equals a measured percentage of this particular view.
function createCloudDeck(svg,tier,id,width) {
    if (tier === "high") return null; // High cloud keeps the accepted thin veils.
    const ns = "http://www.w3.org/2000/svg";
    const defs = svg.querySelector("defs");
    defs.insertAdjacentHTML("beforeend", `
        <filter id="${id}-${tier}-edge"><feGaussianBlur stdDeviation="12"/></filter>
        <filter id="${id}-${tier}-texture" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".004 .007" numOctaves="2" seed="${tier === "low" ? 37 : 71}"/>
            <feColorMatrix type="saturate" values="0"/>
        </filter>
        <mask id="${id}-${tier}-deck-mask" maskUnits="userSpaceOnUse" x="-300" y="-300" width="${width+600}" height="1500" style="mask-type:luminance">
            <rect x="-300" y="-300" width="${width+600}" height="1500" fill="white"/>
            <g class="sky-deck-openings" fill="black" filter="url(#${id}-${tier}-edge)"></g>
        </mask>`);
    const openings = defs.querySelector(".sky-deck-openings");
    const seed = tier === "low" ? 17 : 43;
    for (let i=0;i<24;i++) {
        const outer = document.createElementNS(ns,"g"), hole = document.createElementNS(ns,"path");
        const points = Array.from({length:12},(_,j)=>{
            const angle=j*Math.PI/6, radius=.72+((i*17+j*23+seed)%31)/70;
            return [Math.cos(angle)*150*radius,Math.sin(angle)*100*radius];
        });
        const midpoint=(a,b)=>`${(a[0]+b[0])/2} ${(a[1]+b[1])/2}`;
        hole.setAttribute("d",`M ${midpoint(points[11],points[0])} `+points.map((p,j)=>`Q ${p.join(" ")} ${midpoint(p,points[(j+1)%12])}`).join(" ")+" Z");
        hole.classList.add("sky-deck-hole");
        outer.setAttribute("transform",`translate(${-100+((i*.754877666+seed*.137)%1)*(width+200)} ${-80+((i*.569840296+seed*.193)%1)*1060})`);
        const motion=document.createElementNS(ns,"g");
        setCloudDrift(motion,i,seed,tier);
        motion.append(hole);outer.append(motion);openings.append(outer);
    }
    const deck = document.createElementNS(ns,"g");
    deck.classList.add("sky-cloud-deck");deck.style.opacity="0";
    deck.setAttribute("mask",`url(#${id}-${tier}-deck-mask)`);
    deck.innerHTML=`<rect x="-300" y="-300" width="${width+600}" height="1500" fill="var(--cloud-${tier}-fill)"/>
        <rect x="-300" y="-300" width="${width+600}" height="1500" filter="url(#${id}-${tier}-texture)" opacity=".22" style="mix-blend-mode:multiply"/>`;
    svg.querySelector(".preview-sky-drift").prepend(deck);
    return {deck,openings};
}

    window.createSkyBackground = function ({creditLabel = "Illustrative sky · Weather data:"} = {}) {
        const id = `preview-sky-${++nextInstance}`;
        const root = document.createElement("div");
        root.className = "preview-sky";
        root.dataset.motion = "on";
        root.dataset.rendering = "revised";
        root.setAttribute("aria-hidden", "true");
        root.innerHTML = `
            <svg class="preview-sky-stars" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" hidden>
                ${Array.from({length: 48}, (_, i) => `<circle cx="${(i * 317 + 73) % 1400}" cy="${(i * 173 + 29) % 900}" r="${i % 3 === 0 ? 1.5 : 1}" fill="white" opacity=".6"/>`).join("")}
            </svg>
            ${["high", "mid", "low"].map((tier, index) => `
                <svg class="preview-sky-clouds" data-tier="${tier}" viewBox="0 0 ${[1400,1200,1300][index]} 900" preserveAspectRatio="xMidYMid slice" fill="none">
                    <defs>
                        <filter id="${id}-${tier}-blur" x="-20%" y="-100%" width="140%" height="300%">
                            <feGaussianBlur stdDeviation="${[8,7,5][index]}"/>
                        </filter>
                        ${tier === "low" ? `<linearGradient id="${id}-low-volume" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#172b4d" stop-opacity="0"/>
                            <stop offset="45%" stop-color="#172b4d" stop-opacity="0"/>
                            <stop offset="100%" stop-color="#172b4d" stop-opacity=".12"/>
                        </linearGradient>` : ""}
                    </defs>
                    <g class="preview-sky-drift">
                        <g class="preview-sky-tier" filter="url(#${id}-${tier}-blur)"></g>
                    </g>
                </svg>`).join("")}
            <div class="preview-sky-rain" hidden></div>
            <div class="preview-sky-snow" hidden></div>`;
        const groups = Object.fromEntries(["high", "mid", "low"].map(tier =>
            [tier, root.querySelector(`[data-tier="${tier}"] .preview-sky-tier`)]));
        const decks = Object.fromEntries(["mid","low"].map((tier,index)=>[tier,
            createCloudDeck(root.querySelector(`[data-tier="${tier}"]`),tier,id,[1200,1300][index])]));
        const stars = root.querySelector(".preview-sky-stars");
        const rain = root.querySelector(".preview-sky-rain");
        const snow = root.querySelector(".preview-sky-snow");
        // Large, independently seeded fields avoid the former small repeating
        // dot grid. Build once; intensity selects a denser prefix of each field.
        for (const [depth, width, height] of [[0,521,587],[1,613,541],[2,487,647]]) {
            const field = document.createElement("span");
            field.className = "preview-snow-field";
            let seed = 731 + depth * 193;
            const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
            const flakes = Array.from({length:85}, () => {
                const x = 3 + random() * (width - 6), y = 3 + random() * (height - 6);
                const radius = .5 + random() * (depth === 2 ? 1.6 : 1.1);
                return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius.toFixed(2)}" opacity="${(.3 + random() * .65).toFixed(2)}"/>`;
            });
            for (const [level, count] of [["light",18],["moderate",40],["heavy",85]]) {
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" fill="white">${flakes.slice(0,count).join("")}</svg>`;
                field.style.setProperty(`--snow-${level}`, `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
            }
            field.style.backgroundSize = `${width}px ${height}px`;
            field.style.setProperty("--snow-fall-distance", `${height}px`);
            field.style.setProperty("--snow-fall-duration", `${[19,14,10][depth]}s`);
            field.style.setProperty("--snow-phase", `${[-7,-5,-2][depth]}s`);
            field.style.setProperty("--snow-sway-duration", `${[11,8,13][depth]}s`);
            snow.append(field);
        }
        const credits = document.createElement("footer");
        credits.className = "preview-sky-credits";
        credits.textContent = creditLabel + " ";
        credits.insertAdjacentHTML("beforeend", `<a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>
            (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>)`);
        document.body.prepend(root);
        document.body.append(credits);
        let destroyed = false, inputs = null, lastUpdate = null, animationSpeed = 1;
        function applyAnimationSpeed() {
            for (const animation of root.getAnimations({subtree:true})) {
                // Keep weather transitions at five seconds regardless of drift speed.
                if (animation instanceof CSSAnimation) animation.updatePlaybackRate(animationSpeed);
            }
        }

        return {
            root,
            credits,
            getInputs: () => inputs && Object.freeze({...inputs,motionEnabled:root.dataset.motion === "on",
                reducedMotion:window.matchMedia("(prefers-reduced-motion: reduce)").matches}),
            update(beach, weather, options = {}) {
                if (destroyed) return;
                lastUpdate = {beach,weather,options};
                // First appearance and a newly selected beach commit immediately.
                // A separate wrapper moves each tier without replacing patch nodes.
                const locationKey = JSON.stringify([beach.id, beach.latitude, beach.longitude]);
                const immediate = !weather || !root.hasAttribute("data-clouds-ready") || root.dataset.locationKey !== locationKey;
                if (immediate) {
                    root.removeAttribute("data-clouds-ready");
                    void root.offsetWidth;
                }
                const time = parseCelestialTime(options.time || weather?.currentTime);
                const position = calculateSolarPosition(time, beach.latitude, beach.longitude, options.utcOffsetSeconds ?? getPortugalUtcOffsetSeconds(time));
                const cover = value => Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
                const normalized = {
                    total: cover(weather?.cloudCover), low: cover(weather?.cloudCoverLow),
                    mid: cover(weather?.cloudCoverMid), high: cover(weather?.cloudCoverHigh), weatherCode: weather?.weatherCode
                };
                const elevation = position?.altitude ?? -12;
                const palette = getSkyPalette(elevation, normalized,root.dataset.rendering === "revised");
                root.style.setProperty("--sky-gradient", palette.gradient);
                for (const tier of ["high", "mid", "low"]) {
                    root.style.setProperty(`--cloud-${tier}-fill`, palette.cloudHighFill);
                    const cover = normalized[tier] ?? 0;
                    const progress = Math.max(0,Math.min(1,(cover-60)/30));
                    const blend = root.dataset.rendering === "revised" && decks[tier] ? progress*progress*(3-2*progress) : 0;
                    renderSkyClouds(groups[tier], tier, normalized[tier], palette[`${tier}Opacity`]*(1-.95*blend), id);
                    if (decks[tier]) {
                        decks[tier].deck.style.opacity=String(blend*.96);
                        for (const hole of decks[tier].openings.querySelectorAll(".sky-deck-hole")) {
                            hole.style.transform=`scale(${1.25*Math.sqrt(1-cover/100)})`;
                        }
                    }
                }
                stars.toggleAttribute("hidden", !(elevation < -4 && normalized.total !== null && normalized.total < 85));
                const condition = weatherState.condition(normalized.weatherCode);
                inputs = Object.freeze({...normalized,hasWeather:!!weather,solarElevation:elevation,
                    palette:palette.label,rendering:root.dataset.rendering,condition:condition.label,precipitation:condition.precipitation,
                    intensity:condition.intensity ?? null});
                rain.hidden = condition.precipitation !== "rain";
                snow.hidden = condition.precipitation !== "snow";
                rain.dataset.intensity = snow.dataset.intensity = condition.intensity || "light";
                rain.dataset.drizzle = String(!!condition.drizzle);
                root.dataset.beachId = beach.id;
                root.dataset.locationKey = locationKey;
                root.dataset.solarElevation = String(elevation);
                if (immediate && weather) {
                    void root.offsetWidth;
                    root.setAttribute("data-clouds-ready", "");
                }
                applyAnimationSpeed();
            },
            setAnimationSpeed(value) {
                if (destroyed || !Number.isFinite(value)) return;
                animationSpeed = Math.max(.25,Math.min(3,value));
                applyAnimationSpeed();
            },
            setRendering(value) {
                if (destroyed || !["revised","baseline"].includes(value) || value === root.dataset.rendering) return;
                root.dataset.rendering=value;
                root.removeAttribute("data-clouds-ready");
                if (lastUpdate) this.update(lastUpdate.beach,lastUpdate.weather,lastUpdate.options);
            },
            setMotionEnabled(enabled) {
                if (destroyed) return;
                root.dataset.motion = enabled ? "on" : "off";
            },
            setEnabled(enabled) {
                if (destroyed) return;
                root.hidden = !enabled;
                document.body.dataset.skyPreview = enabled ? "enabled" : "disabled";
                applyAnimationSpeed();
            },
            destroy() {
                destroyed = true;
                root.remove();
                credits.remove();
                delete document.body.dataset.skyPreview;
            }
        };
    };
})();
