
// Get index hero images
document.addEventListener("DOMContentLoaded", () => {
  const imagePaths = [
    "assets/headers/index/winners.jpg",
    "assets/headers/index/airdronecrowdheader.jpg",
    "assets/headers/index/peace-scaled.jpg",
    "assets/headers/index/AiR-group2-scaled.jpg",
    "assets/headers/index/20251015_164235.jpg",
    "assets/headers/index/IMG_7522.jpg",
  ];

  const imageContainer = document.getElementById("carousel-images");
  const dotsContainer = document.getElementById("carousel-dots");

  imagePaths.forEach((path) => {
    const img = document.createElement("img");
    img.src = path;
    imageContainer.appendChild(img);
  });

  imagePaths.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.classList.add("dot");
    dot.addEventListener("click", () => {
      currentIndex = i;
      updateCarousel(true);
    });
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll(".dot");
  let currentIndex = 0;
  let timer = null;
  const interval = 7000; // 7 seconds

  function updateCarousel(resetTimer = false) {
    imageContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach(dot => dot.classList.remove("active"));
    dots[currentIndex].classList.add("active");
    dots[currentIndex].style.setProperty("--timer", `${interval / 1000}s`);

    if (resetTimer) {
      clearInterval(timer);
      timer = setInterval(nextSlide, interval);
    }
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % imagePaths.length;
    updateCarousel();
  }

  updateCarousel();
  timer = setInterval(nextSlide, interval);
});
