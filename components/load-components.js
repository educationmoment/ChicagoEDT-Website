// Components loader
const COMPONENTS = [
  {
    name: 'navbar',
    target: '#site-navbar',
    html: '/components/navbar/navbar.html',
    css: '/components/navbar/navbar.css',
    js: '/components/navbar/navbar.js',
    init: 'initNavbar'
  },
  {
    name: 'footer',
    target: '#site-footer',
    html: '/components/footer/footer.html',
    css: '/components/footer/footer.css',
    js: '/components/footer/footer.js',
    init: 'initFooter'
  }
];

async function loadComponent(component) {
  try {
    // Load HTML
    const htmlResponse = await fetch(component.html);
    if (!htmlResponse.ok) throw new Error(`Failed to load ${component.name} HTML`);
    const html = await htmlResponse.text();
    
    // Load CSS
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = component.css;
    document.head.appendChild(style);
    
    // Load JS
    const script = document.createElement('script');
    script.src = component.js;
    script.async = true;
    document.body.appendChild(script);
    
    // Insert HTML
    const target = document.querySelector(component.target);
    if (target) {
      target.innerHTML = html;
      // Initialize component after script loads
      script.onload = () => {
        if (window[component.init]) {
          window[component.init]();
        }
      };
    }
  } catch (err) {
    console.error(`Failed to load component ${component.name}:`, err);
  }
}

// Load all components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  COMPONENTS.forEach(loadComponent);
});