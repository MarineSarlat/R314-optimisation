(function(){
  const state = {
    fcp: null,
    lcp: null,
    cls: 0,
    totalBlockingTime: 0,
    totalRequests: 0,
    totalBytes: 0
  };

  const fmtMs = v => v==null ? '-' : v.toFixed(0)+' ms';
  const fmtKB = v => v==null ? '-' : (v/1024).toFixed(1)+' KB';

  /* --- Observers --- */

  // FCP
  new PerformanceObserver(list=>{
    for(const e of list.getEntries()){
      if(e.name==='first-contentful-paint' && !state.fcp){
        state.fcp = e.startTime;
        update();
      }
    }
  }).observe({ type:'paint', buffered:true });

  // LCP
  const poLcp = new PerformanceObserver(list=>{
    for(const e of list.getEntries()){
      state.lcp = e.renderTime || e.loadTime || e.startTime;
    }
    update();
  });
  poLcp.observe({ type:'largest-contentful-paint', buffered:true });

  addEventListener('visibilitychange', ()=>{
    if(document.visibilityState==='hidden') poLcp.takeRecords();
  });

  // CLS
  new PerformanceObserver(list=>{
    for(const e of list.getEntries()){
      if(!e.hadRecentInput) state.cls += e.value;
    }
    update();
  }).observe({ type:'layout-shift', buffered:true });

  // Long Tasks → TBT approx
  new PerformanceObserver(list=>{
    for(const e of list.getEntries()){
      state.totalBlockingTime += Math.max(0, e.duration - 50);
    }
    update();
  }).observe({ entryTypes:['longtask'] });

  /* --- Collect data --- */

  function collectResources(){
    const entries = performance.getEntriesByType('resource');
    state.totalRequests = entries.length + 1;

    let total = 0;
    for(const r of entries){
      total += r.transferSize > 0 ? r.transferSize : (r.encodedBodySize || 0);
    }
    state.totalBytes = total;
  }

  /* --- UI --- */

  const panel = document.createElement('div');
  panel.id = 'perf-panel';
  panel.style.cssText = `
    position:fixed;right:16px;bottom:16px;z-index:9999;width:300px;
    font-family:system-ui;background:rgba(10,12,28,.9);color:#E8ECF1;
    border:1px solid rgba(255,255,255,.12);border-radius:12px;
    padding:12px 14px;box-shadow:0 10px 40px rgba(0,0,0,.4)
  `;
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
      <strong>Évaluation perfs</strong>
      <div>
        <button id="perf-refresh" style="background:#7C5CFF;color:white;border:0;border-radius:8px;padding:6px 10px;cursor:pointer">Mesurer</button>
        <button id="perf-close" style="background:transparent;color:#c9d1d9;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:6px 8px;margin-left:6px;cursor:pointer">×</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
      <div><div>FCP</div><div id="m-fcp"></div></div>
      <div><div>LCP</div><div id="m-lcp"></div></div>
      <div><div>CLS</div><div id="m-cls"></div></div>
      <div><div>TBT</div><div id="m-tbt"></div></div>
      <div><div>Requêtes</div><div id="m-req"></div></div>
      <div><div>Poids</div><div id="m-bytes"></div></div>
    </div>
    <div style="margin-top:8px;font-size:12px;opacity:.8">
      Cliquez sur <em>Mesurer</em> après vos modifications.
    </div>
  `;
  document.addEventListener('DOMContentLoaded', ()=>document.body.appendChild(panel));

  /* --- Update UI --- */

  function update(){
    collectResources();

    const $ = sel => panel.querySelector(sel);
    $('#m-fcp').textContent = fmtMs(state.fcp);
    $('#m-lcp').textContent = fmtMs(state.lcp);
    $('#m-cls').textContent = state.cls.toFixed(3);
    $('#m-tbt').textContent = fmtMs(state.totalBlockingTime);
    $('#m-req').textContent = state.totalRequests;
    $('#m-bytes').textContent = fmtKB(state.totalBytes);

    window.__metrics = { ...state };
  }

  /* --- Actions --- */

  document.addEventListener('click', e=>{
    if(e.target.id==='perf-refresh') update();
    if(e.target.id==='perf-close') panel.remove();
  });

  addEventListener('load', ()=>setTimeout(update, 0));
})();