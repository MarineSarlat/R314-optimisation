(function () {

  // Simule une "charge légère" SANS bloquer l’UI
  function lightAsyncWork(iterations = 200000) {
    return new Promise(resolve => {
      let i = 0;
      const batch = 2000;
      const waste = [];

      function step() {
        const end = Math.min(i + batch, iterations);
        for (; i < end; i++) {
          waste.push(Math.random() * i);
        }
        if (i < iterations) {
          requestIdleCallback(step);
        } else {
          window.__waste = waste;
          resolve();
        }
      }

      requestIdleCallback(step);
    });
  }

  // Gère l’ajout de la classe .loaded quand les images finissent de charger
  function setupImages() {
    const imgs = document.querySelectorAll('.card img');
    imgs.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('loaded'));
      }
    });
  }

  // "Charge" exécutée après le load, mais non bloquante
  function postLoadTask(duration = 1000) {
    return new Promise(resolve => {
      const start = performance.now();

      function loop(deadline) {
        if (performance.now() - start >= duration) return resolve();
        // Petit travail léger tant qu'on a du temps idle
        while (deadline.timeRemaining() > 0) Math.random();
        requestIdleCallback(loop);
      }

      requestIdleCallback(loop);
    });
  }

  // Initialisation
  (async function init() {
    // Avant load : petit travail non bloquant
    await lightAsyncWork();

    window.addEventListener('load', async () => {
      setupImages();
      await postLoadTask();
    });
  })();

})();
