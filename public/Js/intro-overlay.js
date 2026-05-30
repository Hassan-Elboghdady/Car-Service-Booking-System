/* ============================================================
   CINEMATIC V12 SUPERCAR INTRO  intro-overlay.js
   Insert: <script src="intro-overlay.js"></script> before </body>
   ============================================================ */
(function () {
  'use strict';

  /* -- Skip if animation already played this session -- */
  if (sessionStorage.getItem('as_intro_done')) {
    return; // don't show again until browser is closed & reopened
  }

  /* -- Constants -- */
  const RPM_MAX = 9000;
  const REDLINE = 7500;
  const RISE_RATE = 34;   // RPM/frame @ 60fps ? ~4.4s to 9000
  const FALL_RATE = 18;   // RPM/frame on release

  /* SVG arc geometry  270 sweep, r=110, center=(150,150) */
  const CX = 150, CY = 150, R = 110;
  const CIRC = 2 * Math.PI * R;   // 691.15
  const ARC_LEN = 0.75 * CIRC;       // 518.36

  /* playbackRate range  0 RPM ? low rumble, 9000 ? full scream */
  const PR_MIN = 0.5;   // at 0 RPM  (half speed = one octave down)
  const PR_MAX = 2.5;   // at 9000 RPM (2.5 speed = ~2.3 octaves up)

  /* State */
  let rpm = 0, holding = false, done = false, rafId = null;
  let audioCtx = null;   // shared AudioContext
  let revBuffer = null;   // decoded PCM from car rev sound.mp3
  let hornBuffer = null;  // decoded PCM from horn mp3
  let revSource = null;   // AudioBufferSourceNode (recreated each hold)
  let revGain = null;   // GainNode for fade in/out

  /* ---------------------------------------------
     BUILD SVG TICKS
  --------------------------------------------- */
  function makeTicks() {
    let s = '';
    const majors = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000];
    majors.forEach(v => {
      const a = (135 + (v / RPM_MAX) * 270) * Math.PI / 180;
      const ca = Math.cos(a), sa = Math.sin(a);
      const isRed = v >= REDLINE;
      const col = isRed ? '#ff2200' : 'rgba(255,255,255,0.4)';
      const o1 = R + 8, o2 = R + 20;
      s += `<line x1="${(CX + o1 * ca).toFixed(1)}" y1="${(CY + o1 * sa).toFixed(1)}" x2="${(CX + o2 * ca).toFixed(1)}" y2="${(CY + o2 * sa).toFixed(1)}" stroke="${col}" stroke-width="2.2" stroke-linecap="round"/>`;
      if (v % 3000 === 0) {
        const lr = R + 34, lbl = v === 0 ? '0' : v / 1000;
        s += `<text x="${(CX + lr * ca).toFixed(1)}" y="${(CY + lr * sa).toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="${isRed ? '#ff4400' : 'rgba(255,255,255,0.38)'}" font-size="11" font-family="Courier New,monospace" font-weight="700">${lbl}</text>`;
      }
    });
    for (let i = 1; i <= 44; i++) {
      const v = i * 200;
      if (v % 1000 === 0) continue;
      const a = (135 + (v / RPM_MAX) * 270) * Math.PI / 180;
      const ca = Math.cos(a), sa = Math.sin(a);
      const o1 = R + 11, o2 = R + 17;
      s += `<line x1="${(CX + o1 * ca).toFixed(1)}" y1="${(CY + o1 * sa).toFixed(1)}" x2="${(CX + o2 * ca).toFixed(1)}" y2="${(CY + o2 * sa).toFixed(1)}" stroke="${v >= REDLINE ? 'rgba(255,34,0,0.55)' : 'rgba(255,255,255,0.15)'}" stroke-width="1" stroke-linecap="round"/>`;
    }
    return s;
  }

  /* ---------------------------------------------
     INJECT HTML
  --------------------------------------------- */
  const overlay = document.createElement('div');
  overlay.id = 'ci-overlay';
  const AL = ARC_LEN.toFixed(2), CI = CIRC.toFixed(2);

  overlay.innerHTML = `
    <div class="ci-fog" style="--fo:0.05;width:700px;height:420px;top:5%;left:-12%;background:rgba(80,0,0,0.6);animation-duration:20s;"></div>
    <div class="ci-fog" style="--fo:0.04;width:500px;height:550px;top:25%;right:-8%;background:rgba(60,0,0,0.6);animation-duration:26s;animation-delay:-9s;"></div>
    <div class="ci-fog" style="--fo:0.06;width:800px;height:320px;bottom:2%;left:3%;background:rgba(40,0,0,0.6);animation-duration:17s;animation-delay:-5s;"></div>
    <div id="ci-ambient" class="ci-ambient"></div>

    <div class="ci-content">
      <div class="ci-brand">AUTO<span>SERVE</span></div>

      <div class="ci-tach-wrap">
        <svg class="ci-tach" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ci-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stop-color="#ff6600"/>
              <stop offset="55%"  stop-color="#ff2000"/>
              <stop offset="100%" stop-color="#990000"/>
            </linearGradient>
            <filter id="ci-glow-f" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <g transform="rotate(-135,150,150)">
            <circle class="ci-track" cx="150" cy="150" r="110" stroke-dasharray="${AL} ${CI}"/>
            <circle class="ci-fill-arc" id="ci-fill" cx="150" cy="150" r="110"
              stroke-dasharray="${AL} ${CI}" stroke-dashoffset="${AL}"/>
          </g>
          <g id="ci-ticks">${makeTicks()}</g>
          <circle id="ci-needle" cx="150" cy="40" r="5.5" fill="#ff5500" opacity="0" filter="url(#ci-glow-f)"/>
        </svg>

        <div class="ci-btn-ring">
          <button id="ci-btn" aria-label="Hold to start engine">
            <div class="ci-btn-icon" style="display: flex; align-items: center; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ff3300" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
            </div>
            <div class="ci-btn-label">Start Engine</div>
          </button>
        </div>
      </div>

      <div class="ci-rpm-wrap">
        <div id="ci-rpm-num">0</div>
        <div class="ci-rpm-unit">RPM</div>
      </div>
      <div id="ci-zone"> IDLE </div>
      <div id="ci-hint">HOLD TO START ENGINE</div>
    </div>

    <div id="ci-flash"></div>
    <div id="ci-rl-bar"></div>
    <button id="ci-skip">SKIP </button>`;

  document.body.insertBefore(overlay, document.body.firstChild);
  document.body.style.overflow = 'hidden';

  /* Element refs */
  const fillArc = document.getElementById('ci-fill');
  const needle = document.getElementById('ci-needle');
  const rpmNum = document.getElementById('ci-rpm-num');
  const zoneEl = document.getElementById('ci-zone');
  const hintEl = document.getElementById('ci-hint');
  const btnEl = document.getElementById('ci-btn');
  const flashEl = document.getElementById('ci-flash');
  const skipEl = document.getElementById('ci-skip');
  const ambient = document.getElementById('ci-ambient');

  /* ---------------------------------------------
     AUDIO  Web Audio API + AudioBufferSourceNode
     Uses car rev sound.mp3 decoded into a PCM buffer.
     playbackRate AudioParam gives glitch-free real-time pitch control.
  --------------------------------------------- */

  /**
   * Create AudioContext + fetch/decode the MP3 immediately.
   * The context starts suspended (browser policy)  resumed on first gesture.
   */
  function preloadAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }

    fetch('../../public/Sound%20Effect/car%20rev%20sound.mp3')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.arrayBuffer(); })
      .then(buf => audioCtx.decodeAudioData(buf))
      .then(decoded => { revBuffer = decoded; })
      .catch(e => console.warn('[Intro] car rev sound load failed:', e));

    fetch('../../public/Sound%20Effect/car%20horn%20real.mp3')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.arrayBuffer(); })
      .then(buf => audioCtx.decodeAudioData(buf))
      .then(decoded => { hornBuffer = decoded; })
      .catch(e => console.warn('[Intro] car horn load failed:', e));
  }

  /** Resume the suspended context on user gesture. */
  function resumeAudio() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  /**
   * Start the engine: create a new AudioBufferSourceNode (they are single-use),
   * connect it through a GainNode for fade-in, begin playback.
   */
  function startEngine() {
    if (!audioCtx || !revBuffer || revSource) return;

    revGain = audioCtx.createGain();
    revGain.gain.setValueAtTime(0, audioCtx.currentTime);
    revGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.4);
    revGain.connect(audioCtx.destination);

    revSource = audioCtx.createBufferSource();
    revSource.buffer = revBuffer;
    revSource.loop = true;
    revSource.playbackRate.setValueAtTime(PR_MIN, audioCtx.currentTime);
    revSource.connect(revGain);
    revSource.start(0);
  }

  /**
   * Map RPM ? playbackRate every animation frame.
   * AudioParam.setTargetAtTime() is sample-accurate and glitch-free.
   *   0 RPM   ? PR_MIN (0.5)  = half speed, ~1 octave lower pitch
   *   9000 RPM ? PR_MAX (2.5) = 2.5 speed, ~2.3 octaves higher pitch
   */
  function updateAudio(r) {
    if (!revSource || !audioCtx) return;
    const pct = r / RPM_MAX;
    const rate = PR_MIN + pct * (PR_MAX - PR_MIN);
    // timeConstant 0.05s = ~50ms lag, feels organic not mechanical
    revSource.playbackRate.setTargetAtTime(rate, audioCtx.currentTime, 0.05);
  }

  /**
   * Fade out and stop the current engine source.
   * Nulls revSource immediately so the next hold creates a fresh node.
   */
  function stopEngine() {
    if (!revSource || !revGain || !audioCtx) return;
    const src = revSource, g = revGain;
    revSource = null; revGain = null;
    g.gain.setTargetAtTime(0, audioCtx.currentTime, 0.15);
    setTimeout(() => { try { src.stop(); } catch (e) { } }, 700);
  }

  function playHorn() {
    if (!audioCtx || !hornBuffer) return;

    // 1. Source Node
    const hornSource = audioCtx.createBufferSource();
    hornSource.buffer = hornBuffer;

    // 2. Gain Node (Increasing intensity)
    const gainNode = audioCtx.createGain();
    const now = audioCtx.currentTime;
    // Start at a good volume, ramp up for intensity
    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.linearRampToValueAtTime(1.5, now + 1.5); 

    // 3. Filter Node (Strong presence)
    const biquadFilter = audioCtx.createBiquadFilter();
    biquadFilter.type = "peaking";
    biquadFilter.frequency.value = 2500; // boost presence frequencies
    biquadFilter.gain.value = 8; // 8dB boost

    // 4. Convolver Node (Realistic reverb)
    const convolver = audioCtx.createConvolver();
    
    // Generate simple impulse response for reverb
    const duration = 2.5; 
    const decay = 2.0;
    const sampleRate = audioCtx.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioCtx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const n = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      left[i] = n;
      right[i] = n;
    }
    convolver.buffer = impulse;

    // 5. Dry/Wet Mix for Reverb
    const dryGain = audioCtx.createGain();
    dryGain.gain.value = 0.8;
    const wetGain = audioCtx.createGain();
    wetGain.gain.value = 0.35; // Reverb level

    // Routing
    hornSource.connect(biquadFilter);
    biquadFilter.connect(gainNode);

    // Split to dry and wet
    gainNode.connect(dryGain);
    gainNode.connect(convolver);
    convolver.connect(wetGain);

    // Connect to destination
    dryGain.connect(audioCtx.destination);
    wetGain.connect(audioCtx.destination);

    hornSource.start(0);
  }

  /* No synthesised audio  only car rev sound.mp3 is used */

  /* ---------------------------------------------
     VISUALS UPDATE
  --------------------------------------------- */
  function updateVisuals(r) {
    const pct = r / RPM_MAX;

    /* Arc fill */
    fillArc.style.strokeDashoffset = ARC_LEN * (1 - pct);

    /* Needle head */
    const ang = (135 + pct * 270) * Math.PI / 180;
    needle.setAttribute('cx', (CX + R * Math.cos(ang)).toFixed(1));
    needle.setAttribute('cy', (CY + R * Math.sin(ang)).toFixed(1));
    needle.setAttribute('opacity', r > 50 ? '1' : '0');
    /* Arc + needle glow intensity */
    const gb = (3 + pct * 14).toFixed(1);
    fillArc.style.filter = `drop-shadow(0 0 ${gb}px rgba(255,50,0,0.95))`;
    needle.style.filter = `drop-shadow(0 0 ${(4 + pct * 12).toFixed(1)}px rgba(255,80,0,1))`;

    /* RPM number */
    rpmNum.textContent = Math.round(r).toString().padStart(4, ' ');
    if (r >= REDLINE) { rpmNum.classList.add('redline'); overlay.classList.add('in-rl'); }
    else { rpmNum.classList.remove('redline'); overlay.classList.remove('in-rl'); }

    /* Zone label */
    let zone = ' IDLE ';
    if (r > 500) zone = 'LOW RPM';
    if (r > 2500) zone = 'POWER BAND';
    if (r > 5000) zone = 'PERFORMANCE';
    if (r > 7000) zone = 'HIGH PERFORMANCE';
    if (r >= REDLINE) zone = '🚨 REDLINE 🚨';
    zoneEl.textContent = zone;
    zoneEl.style.color = r >= REDLINE ? '#ff2200' : r > 5000 ? 'rgba(255,120,0,0.7)' : 'rgba(255,255,255,0.22)';

    /* Ambient glow */
    const gi = (pct * 0.4).toFixed(3);
    ambient.style.background = `radial-gradient(ellipse at 50% 58%, rgba(220,${Math.round(20 * (1 - pct))},0,${gi}) 0%, transparent 62%)`;

    /* Screen shake */
    let shakeAnim = '';
    if (r > 7000) shakeAnim = `ci-shake-max 0.06s linear infinite`;
    else if (r > 5500) shakeAnim = `ci-shake-hi 0.09s linear infinite`;
    else if (r > 4000) shakeAnim = `ci-shake-lo 0.12s linear infinite`;
    overlay.style.animation = shakeAnim;

    /* Light streaks at high RPM */
    if (r > 5000 && holding && Math.random() < 0.08) spawnStreak();
  }

  /* ---------------------------------------------
     PARTICLES
  --------------------------------------------- */
  function spawnStreak() {
    const s = document.createElement('div');
    s.className = 'ci-streak';
    const top = 10 + Math.random() * 80;
    const w = 80 + Math.random() * 250;
    const side = Math.random() < 0.5 ? 'left' : 'right';
    s.style.cssText = `top:${top}%;${side}:0;width:${w}px;`;
    overlay.appendChild(s);
    setTimeout(() => s.remove(), 600);
  }

  function spawnCompletionSparks() {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    for (let i = 0; i < 40; i++) {
      const sp = document.createElement('div');
      sp.className = 'ci-spark';
      const angle = Math.random() * 360;
      const dist = 60 + Math.random() * 200;
      const tx = Math.cos(angle * Math.PI / 180) * dist;
      const ty = Math.sin(angle * Math.PI / 180) * dist;
      const dur = (0.4 + Math.random() * 0.7).toFixed(2) + 's';
      const h = Math.round(10 + Math.random() * 30);
      sp.style.cssText = `--tx:${tx.toFixed(0)}px;--ty:${ty.toFixed(0)}px;--d:${dur};
        top:${cy - 4}px;left:${cx - 1}px;height:${h}px;
        background:hsl(${Math.round(Math.random() * 30)},100%,60%);`;
      overlay.appendChild(sp);
      setTimeout(() => sp.remove(), 1200);
    }
  }

  /* ---------------------------------------------
     ANIMATION LOOP
  --------------------------------------------- */
  function tick() {
    if (done) return;
    rpm = holding ? Math.min(rpm + RISE_RATE, RPM_MAX) : Math.max(rpm - FALL_RATE, 0);
    updateVisuals(rpm);
    updateAudio(rpm);
    if (holding && rpm >= RPM_MAX) { complete(); return; }
    rafId = requestAnimationFrame(tick);
  }
  function startLoop() { if (!rafId) rafId = requestAnimationFrame(tick); }
  function stopLoop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  /* ---------------------------------------------
     COMPLETION
  --------------------------------------------- */
  function complete() {
    done = true; holding = false;
    sessionStorage.setItem('as_intro_done', '1'); // mark as seen for this session
    stopEngine();
    playHorn();
    hintEl.style.opacity = '0';

    /* Violent shake burst */
    overlay.style.animation = 'ci-shake-max 0.05s linear infinite';
    setTimeout(() => {
      overlay.style.animation = '';
      /* Flash */
      flashEl.style.opacity = '1';
      setTimeout(() => {
        flashEl.style.transition = 'opacity 0.35s ease';
        flashEl.style.opacity = '0';
        spawnCompletionSparks(); // engine sound already stopped by stopEngine()
        /* Fade out overlay */
        setTimeout(() => {
          overlay.classList.add('ci-out');
          setTimeout(() => { overlay.style.display = 'none'; document.body.style.overflow = ''; }, 1200);
        }, 350);
      }, 90);
    }, 220);
  }

  function skipIntro() {
    if (done) return;
    done = true; holding = false;
    sessionStorage.setItem('as_intro_done', '1'); // mark as seen for this session
    stopLoop(); stopEngine();
    overlay.classList.add('ci-out');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.style.display = 'none'; }, 1200);
  }

  /* ---------------------------------------------
     EVENT HANDLERS
  --------------------------------------------- */
  function onStart(e) {
    e.preventDefault();
    if (done) return;
    resumeAudio();   // unsuspend AudioContext on user gesture (browser policy)
    holding = true;
    btnEl.classList.add('pressed');
    hintEl.textContent = 'REVVING';
    hintEl.classList.add('active');
    startEngine();   // create BufferSourceNode and begin looped playback
    startLoop();
  }

  function onEnd(e) {
    e.preventDefault();
    if (done) return;
    holding = false;
    btnEl.classList.remove('pressed');
    hintEl.textContent = 'HOLD TO START ENGINE';
    hintEl.classList.remove('active');
    overlay.classList.remove('in-rl');
    /* Keep loop running so RPM decays */
    startLoop();
  }

  /* Pre-load audio buffer now  local file decodes in <200ms */
  preloadAudio();

  btnEl.addEventListener('mousedown', onStart);
  window.addEventListener('mouseup', onEnd);
  btnEl.addEventListener('touchstart', onStart, { passive: false });
  window.addEventListener('touchend', onEnd, { passive: false });
  skipEl.addEventListener('click', skipIntro);
})();

