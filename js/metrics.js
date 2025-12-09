/* metrics.js — version optimisée */
(function(){

  const state = {
    fcp: null,
    lcp: null,
    cls: 0,
    clsEntries: [],
    longTasks: 0,
    totalBlockingTime: 0,
    resources: [],
    totalRequests: 0,
    totalBytes: 0,
    nav: null
  };

  const fmtMs = v => (v == null ? '-' : (v|0) + ' ms');
  const fmtKB = v => (v == null ? '-' : (v/1024).toFixed(1) + ' KB');

  /* -----------------------------
     OBSERVERS
  ----------------------------- */

  try {
    const poPaint = new PerformanceObserver(list => {
      for(const e of list.getEntries()){
        if(e.name === 'first-contentful-paint'){
          state.fcp = e.startTime;
          update();
          poPaint.disconnect();
          return;
        }
      }
    });
    poPaint.observe({ type:'paint', buffered:true });
  } catch(_) {}

  try {
    const poLcp = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if(last){
        state.lcp = last.renderTime || last.loadTime || last.startTime;
        update();
      }
    });
    poLcp.observe({ type:'largest-contentful-paint', buffered:true });
    addEventListener('visibilitychange', () => {
      if(document.visibilityState === 'hidden') poLcp.takeRecords();
    });
  } catch(_) {}

  try {
    const poCls = new PerformanceObserver(list => {
      for(const e of list.getEntries()){
        if(!e.hadRecentInput){
          state.cls += e.value;
          state.clsEntries.push(e);
        }
      }
      update();
    });
    poCls.observe({ type:'layout-shift', buffered:true });
  } catch(_) {}

  try {
    const poLT = new PerformanceObserver(list => {
      for(const e of list.getEntries()){
        const over = e.duration - 50;
        state.longTasks++;
        if(over > 0) state.totalBlockingTime += over;
      }
      update();
    });
    poLT.observe({ entryTypes:['longtask'] });
  } catch(_) {}

  /* -----------------------------
     METRICS EXTRACTION
  ----------------------------- */

  function collectResources(){
    const entries = performance.getEntriesByType('resource');
    let total = 0;
    const n = entries.length;

    for(let i=0; i<n; i++){
      const r = entries[i];
      total += r.transferSize > 0 ? r.transferSize : (r.encodedBodySize || 0);
    }

    state.resources = entries;
    state.totalRequests = n + 1; // +1 HTML
    state.totalBytes = total;
  }

  function collectNavigation(){
    const nav = performance.getEntriesByType('navigation')[0];
    if(nav) state.nav = nav;
  }

  /* -----------------------------
     UI PANEL
  ----------------------------- */

  const panel = document.createElement('div');
  panel.id = 'perf-panel';

  Object.assign(panel.style, {
    position:'fixed', right:'16px', bottom:'16px', zIndex:9999,
    width:'320px', maxWidth:'90vw',
    fontFamily:'ui-sans-serif, system-ui, -apple-system',
    background:'rgba(10,12,28,.9)', color:'#E8ECF1',
    border:'1px solid rgba(255,255,255,.12)',
    borderRadius:'12px', boxShadow:'0 10px 40px rgba(0,0,0,.5)',
    backdropFilter:'blur(6px) saturate(120%)',
    padding:'12px 14px'
  });

  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <strong>Évaluation perfs</strong>
      <div>
        <button id="perf-refresh" style="background:#7C5CFF;color:white;border:0;border-radius:8px;padding:6px 10px;cursor:pointer">Mesurer</button>
        <button id="perf-close" style="background:transparent;color:#c9d1d9;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:6px 8px;margin-left:6px;cursor:pointer">×</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
      <div><div style="opacity:.8">FCP</div><div id="m-fcp">-</div></div>
      <div><div style="opacity:.8">LCP</div><div id="m-lcp">-</div></div>
      <div><div style="opacity:.8">CLS</div><div id="m-cls">-</div></div>
      <div><div style="opacity:.8">TBT</div><div id="m-tbt">-</div></div>
      <div><div style="opacity:.8">Requêtes</div><div id="m-req">-</div></div>
      <div><div style="opacity:.8">Poids total</div><div id="m-bytes">-</div></div>
    </div>

    <div style="margin-top:8px;font-size:12px;opacity:.8">
      <div id="m-note">Cliquez sur <em>Mesurer</em> après vos modifications.</div>
    </div>
  `;

  document.addEventListener('DOMContentLoaded', () => {  
    document.body.appendChild(panel);

    /* Cache complet des éléments */
    cache.mFCP   = panel.querySelector('#m-fcp');
    cache.mLCP   = panel.querySelector('#m-lcp');
    cache.mCLS   = panel.querySelector('#m-cls');
    cache.mTBT   = panel.querySelector('#m-tbt');
    cache.mREQ   = panel.querySelector('#m-req');
    cache.mBYTES = panel.querySelector('#m-bytes');
  });

  const cache = {};

  /* -----------------------------
     UPDATE UI
  ----------------------------- */
  function update(){
    collectResources();
    collectNavigation();

    cache.mFCP.textContent   = fmtMs(state.fcp);
    cache.mLCP.textContent   = fmtMs(state.lcp);
    cache.mCLS.textContent   = state.cls ? state.cls.toFixed(3) : '-';
    cache.mTBT.textContent   = fmtMs(state.totalBlockingTime);
    cache.mREQ.textContent   = state.totalRequests;
    cache.mBYTES.textContent = fmtKB(state.totalBytes);

    window.__metrics = { ...state };
  }

  /* -----------------------------
     EVENTS
  ----------------------------- */

  document.addEventListener('click', e => {
    const id = e.target.id;
    if(id === 'perf-refresh') update();
    else if(id === 'perf-close') panel.remove();
  });

  addEventListener('load', () => {
    setTimeout(update, 0);
  });

})();