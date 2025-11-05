// Footer functionality
function initFooter() {
  const topBtn = document.getElementById('backToTop');
  
  if (topBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        topBtn.style.display = 'block';
      } else {
        topBtn.style.display = 'none';
      }
    });
    
    topBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}