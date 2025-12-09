(function () {

  // Simulation non bloquante d'une tâche lourde
  function simulateHeavyWork(duration) {
    let start = performance.now();
    return new Promise(resolve => {
      function step() {
        let now = performance.now();
        if (now - start >= duration) return resolve();
        // laisse respirer le thread
        setTimeout(step, 0);
      }
      step();
    });
  }

  // charge initiale simulée
  simulateHeavyWork(200).then(() => {
    const waste = [];
    for (let i = 0; i < 200000; i++) waste.push(Math.random() * i);
    window.__waste = waste;
  });

  // images après load
  window.addEventListener('load', async function () {
    const imgs = document.querySelectorAll('.card img');
    imgs.forEach(img => {
      if (img.complete) img.classList.add('loaded');
      else img.addEventListener('load', () => img.classList.add('loaded'));
    });

    // simulate work post-load (non bloquant)
    await simulateHeavyWork(200);
  });

})();