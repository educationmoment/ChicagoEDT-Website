// Navbar functionality
function initNavbar() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('show'));
  }

  // Update active link based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    if (link.getAttribute('href').includes(currentPage)) {
      link.style.textDecoration = 'underline';
      link.style.opacity = '1';
    }
  });
}