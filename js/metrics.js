(function () {

  const state = {
    fcp: null,
    lcp: null,
    cls: 0,
    totalBlockingTime: 0,
    totalBytes: 0,
    totalRequests: 0
  };

  const fmtMs = v => v ? v.toFixed(0) + " ms" : "-";
  const fmtKB = v => v ? (v / 1024).toFixed(1) + " KB" : "-";

  function updatePanel() {
    const el = id => panel.querySelector(id);

    el("#m-fcp").textContent = fmtMs(state.fcp);
    el("#m-lcp").textContent = fmtMs(state.lcp);
    el("#m-cls").textContent = state.cls.toFixed(3);
    el("#m-tbt").textContent = fmtMs(state.totalBlockingTime);
    el("#m-req").textContent = state.totalRequests;
    el("#m-bytes").textContent = fmtKB(state.totalBytes);
  }

  const panel = document.createElement("div");
  panel.id = "perf-panel";
  panel.style.cssText = `
    position:fixed;right:16px;bottom:16px;width:320px;z-index:9999;
    background:rgba(10,12,28,.9);color:#E8ECF1;padding:14px;border-radius:12px;
    font-family:system-ui;font-size:14px;
  `;
  panel.innerHTML = `
    <strong style="display:block;margin-bottom:6px">Évaluation perfs</strong>
    <div>FCP: <span id="m-fcp">-</span></div>
    <div>LCP: <span id="m-lcp">-</span></div>
    <div>CLS: <span id="m-cls">-</span></div>
    <div>TBT: <span id="m-tbt">-</span></div>
    <div>Requêtes: <span id="m-req">-</span></div>
    <div>Poids total: <span id="m-bytes">-</span></div>
  `;
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(panel));

  // Observers optimisés
  try {
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (e.name === "first-contentful-paint" && !state.fcp) {
          state.fcp = e.startTime;
        }
      }
      updatePanel();
    }).observe({ type: "paint", buffered: true });
  } catch {}

  try {
    new PerformanceObserver(list => {
      const last = list.getEntries().pop();
      state.lcp = last.renderTime || last.startTime;
      updatePanel();
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}

  try {
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) state.cls += e.value;
      }
      updatePanel();
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}

  try {
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        state.totalBlockingTime += Math.max(0, e.duration - 50);
      }
      updatePanel();
    }).observe({ type: "longtask" });
  } catch {}

  window.addEventListener("load", () => {
    setTimeout(() => {
      const res = performance.getEntriesByType("resource");
      state.totalRequests = res.length + 1;
      state.totalBytes = res.reduce((t, r) =>
        t + (r.transferSize || r.encodedBodySize || 0), 0);
      updatePanel();
    }, 0);
  });

})();