// Components loader
const COMPONENT_BASE = new URL('.', document.currentScript.src);

function resolveComponentPath(path) {
  return new URL(path, COMPONENT_BASE).toString();
}

const COMPONENTS = [
  {
    name: 'navbar',
    target: '#site-navbar',
    html: resolveComponentPath('navbar/navbar.html'),
    css: resolveComponentPath('navbar/navbar.css'),
    js: resolveComponentPath('navbar/navbar.js'),
    init: 'initNavbar'
  },
  {
    name: 'footer',
    target: '#site-footer',
    html: resolveComponentPath('footer/footer.html'),
    css: resolveComponentPath('footer/footer.css'),
    js: resolveComponentPath('footer/footer.js'),
    init: 'initFooter'
  },
  {
    name: 'hero-index',
    target: '#site-hero',
    html: resolveComponentPath('hero-index/hero-index.html'),
    css: resolveComponentPath('hero-index/hero-index.css'),
    js: resolveComponentPath('hero-index/hero-index.js'),
    init: 'initIndexHero',
    pages: ['index.html']
  },
  {
    name: 'hero-lunabotics',
    target: '#site-hero',
    html: resolveComponentPath('hero-lunabotics/hero-lunabotics.html'),
    css: resolveComponentPath('hero-lunabotics/hero-lunabotics.css'),
    js: resolveComponentPath('hero-lunabotics/hero-lunabotics.js'),
    init: 'initLunaHero',
    pages: ['lunabotics.html']
  },
  {
    name: 'hero-air',
    target: '#site-hero',
    html: resolveComponentPath('hero-air/hero-air.html'),
    css: resolveComponentPath('hero-air/hero-air.css'),
    pages: ['air/index.html']
  },
  {
    name: 'hero-air-avionics',
    target: '#site-hero',
    html: resolveComponentPath('hero-air/hero-air-avionics.html'),
    css: resolveComponentPath('hero-air/hero-air-avionics.css'),
    pages: ['air/avionics.html']
  },
  {
    name: 'hero-robobrawl',
    target: '#site-hero',
    html: resolveComponentPath('hero-robobrawl/hero-robobrawl.html'),
    css: resolveComponentPath('hero-robobrawl/hero-robobrawl.css'),
    pages: ['robobrawl.html']
  },
  {
    name: 'drone-3d-viewer',
    target: '#drone-3d-viewer',
    html: '/air/3D/drone-3d-viewer.html',
    css: '/air/3D/drone-3d-viewer.css',
    js: '/air/3D/drone-3d-viewer.js',
    pages: ['air/index.html']
  }
];

// Helper to get current page name
function getCurrentPage() {
  const path = window.location.pathname;
  if (!path || path === '/') return 'index.html';

  const normalized = path.startsWith('/') ? path.slice(1) : path;
  if (!normalized) return 'index.html';
  if (normalized.endsWith('/')) return `${normalized}index.html`;
  return normalized;
}

// Helper to check if component should load for current page
function shouldLoadComponent(component) {
  if (!component.pages) return true; // Load if no page restriction
  const currentPage = getCurrentPage();
  return component.pages.includes(currentPage);
}

async function loadComponent(component) {
  try {
    // Check if component should load for current page
    if (!shouldLoadComponent(component)) {
      console.log(`Skipping ${component.name} - not for current page`);
      return;
    }

    console.log(`Loading component: ${component.name}`);

    // Find target element
    const target = document.querySelector(component.target);
    if (!target) {
      console.error(`Target element not found: ${component.target}`);
      return;
    }

    // Load HTML
    console.log(`Fetching HTML: ${component.html}`);
    const htmlResponse = await fetch(component.html);
    if (!htmlResponse.ok) {
      throw new Error(`Failed to load ${component.name} HTML: ${htmlResponse.status}`);
    }
    const html = await htmlResponse.text();
    
    // Load CSS
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = component.css;
    document.head.appendChild(style);
    console.log(`Added CSS: ${component.css}`);
    
    // Insert HTML
    target.innerHTML = html;
    console.log(`Inserted HTML for ${component.name}`);
    
    // Load JS if component has it
    if (component.js) {
      const script = document.createElement('script');
      script.src = component.js;
      script.async = true;

      // Use type="module" for drone-3d-viewer to support ES6 imports
      if (component.name === 'drone-3d-viewer') {
        script.type = 'module';
      }

      // Initialize component after script loads
      if (component.init) {
        script.onload = () => {
          console.log(`Initializing ${component.name}`);
          if (window[component.init]) {
            window[component.init]();
          } else {
            console.warn(`Init function not found: ${component.init}`);
          }
        };
      }

      document.body.appendChild(script);
      console.log(`Added JS: ${component.js}`);
    }
  } catch (err) {
    console.error(`Error loading component ${component.name}:`, err);
    // Show error in the target element for development
    const target = document.querySelector(component.target);
    if (target) {
      target.innerHTML = `
        <div style="padding: 20px; color: red; border: 1px solid red;">
          Error loading ${component.name}: ${err.message}
        </div>
      `;
    }
  }
}

// Load all components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Loading components...');
  COMPONENTS.forEach(loadComponent);
});
