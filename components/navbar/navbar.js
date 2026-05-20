// Navbar functionality
function initNavbar() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('show'));
  }

  // Update active link based on current page
  const path = window.location.pathname;
  const currentPage = path === '/' || path === ''
    ? 'index.html'
    : path.endsWith('/')
      ? `${path.slice(1)}index.html`
      : path.slice(1);
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    if (link.getAttribute('href').endsWith(currentPage)) {
      link.style.textDecoration = 'underline';
      link.style.opacity = '1';
    }
  });
}
