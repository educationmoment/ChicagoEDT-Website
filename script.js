
// mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links){
  toggle.addEventListener('click', () => links.classList.toggle('show'));
}

// back-to-top button
const topBtn = document.getElementById('backToTop');
if (topBtn){
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) topBtn.style.display = 'block';
    else topBtn.style.display = 'none';
  });
  topBtn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
}
