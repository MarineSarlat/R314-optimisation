(function () {
  const waste = [];
  for (let i = 0; i < 5000; i++) {   
    waste.push(Math.random() * i);
  }
  window.__waste = waste;
  window.addEventListener('load', function () {
    const imgs = document.querySelectorAll('.card img');
    imgs.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('loaded'));
      }
    });
    setTimeout(() => {
      console.log("Simulation finie sans bloquer le thread principal.");
    }, 500);

  });
})();