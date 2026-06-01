document.addEventListener('DOMContentLoaded', () => {
  // Navbar burger toggle
  const burgers = document.querySelectorAll('.navbar-burger');
  burgers.forEach(burger => {
    burger.addEventListener('click', () => {
      const target = document.getElementById(burger.dataset.target);
      burger.classList.toggle('is-active');
      target.classList.toggle('is-active');
    });
  });

  // Simple carousel
  document.querySelectorAll('.simple-carousel').forEach(carousel => {
    const slides = carousel.querySelectorAll('.slide');
    const counter = carousel.querySelector('.carousel-counter');
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    let idx = 0;

    function show(i) {
      slides.forEach(s => s.classList.remove('active'));
      idx = (i + slides.length) % slides.length;
      slides[idx].classList.add('active');
      if (counter) counter.textContent = `${idx + 1} / ${slides.length}`;
    }

    if (prevBtn) prevBtn.addEventListener('click', () => show(idx - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => show(idx + 1));
    show(0);
  });
});
