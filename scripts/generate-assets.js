const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '..', 'public', 'images');
const backendDir = path.join(__dirname, '..', '..', 'backend', 'public', 'images');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeAsset(subPath, content) {
  const fPath = path.join(frontendDir, subPath);
  const bPath = path.join(backendDir, subPath);
  ensureDir(path.dirname(fPath));
  ensureDir(path.dirname(bPath));
  fs.writeFileSync(fPath, content, 'utf8');
  fs.writeFileSync(bPath, content, 'utf8');
}

// 1. PRODUCTS
const products = [
  {
    name: 'samsung-galaxy-a55.svg',
    title: 'Samsung Galaxy A55 5G',
    tag: '50MP OIS | 120Hz AMOLED',
    color1: '#0f172a', color2: '#2563eb',
    icon: `<rect x="150" y="80" width="100" height="200" rx="16" fill="#1e293b" stroke="#60a5fa" stroke-width="4"/>
           <circle cx="200" cy="100" r="4" fill="#60a5fa"/>
           <rect x="160" y="115" width="80" height="135" rx="6" fill="#0f172a"/>
           <circle cx="180" cy="140" r="10" fill="#3b82f6" opacity="0.8"/>
           <circle cx="180" cy="170" r="10" fill="#3b82f6" opacity="0.8"/>
           <circle cx="180" cy="200" r="10" fill="#3b82f6" opacity="0.8"/>
           <text x="200" y="240" font-family="Arial" font-size="9" fill="#93c5fd" text-anchor="middle">5G SUPER AMOLED</text>`
  },
  {
    name: 'xiaomi-redmi-note-13-pro.svg',
    title: 'Xiaomi Redmi Note 13 Pro',
    tag: '200MP Camera | 67W Turbo',
    color1: '#18181b', color2: '#ea580c',
    icon: `<rect x="150" y="80" width="100" height="200" rx="16" fill="#27272a" stroke="#fb923c" stroke-width="4"/>
           <circle cx="200" cy="95" r="3" fill="#fb923c"/>
           <rect x="160" y="110" width="80" height="145" rx="6" fill="#18181b"/>
           <circle cx="185" cy="145" r="16" fill="#ea580c" opacity="0.7"/>
           <circle cx="185" cy="145" r="8" fill="#fff" opacity="0.3"/>
           <text x="200" y="235" font-family="Arial" font-size="10" fill="#fdba74" text-anchor="middle">200MP OIS</text>`
  },
  {
    name: 'iphone-15-pro.svg',
    title: 'iPhone 15 Pro Max',
    tag: 'Titanium | A17 Pro Chip',
    color1: '#1c1917', color2: '#78716c',
    icon: `<rect x="150" y="75" width="100" height="205" rx="20" fill="#292524" stroke="#d6d3d1" stroke-width="4"/>
           <rect x="180" y="85" width="40" height="10" rx="5" fill="#000"/>
           <rect x="160" y="105" width="80" height="155" rx="8" fill="#1c1917"/>
           <circle cx="180" cy="135" r="12" fill="#78716c"/>
           <circle cx="210" cy="150" r="12" fill="#78716c"/>
           <circle cx="180" cy="165" r="12" fill="#78716c"/>
           <text x="200" y="240" font-family="Arial" font-size="10" fill="#e7e5e4" text-anchor="middle">TITANIUM</text>`
  },
  {
    name: 'macbook-air-m3.svg',
    title: 'MacBook Air 15" M3',
    tag: 'Apple M3 | Liquid Retina',
    color1: '#0f172a', color2: '#475569',
    icon: `<rect x="110" y="90" width="180" height="115" rx="8" fill="#1e293b" stroke="#cbd5e1" stroke-width="3"/>
           <rect x="120" y="100" width="160" height="95" rx="4" fill="#0f172a"/>
           <path d="M90 205 L310 205 L300 215 L100 215 Z" fill="#94a3b8"/>
           <text x="200" y="155" font-family="Arial" font-size="16" font-weight="bold" fill="#f8fafc" text-anchor="middle">M3 AIR</text>`
  },
  {
    name: 'wireless-earbuds-pro.svg',
    title: 'Wireless Earbuds Pro',
    tag: 'Active ANC | 36H Playtime',
    color1: '#111827', color2: '#10b981',
    icon: `<rect x="140" y="110" width="120" height="90" rx="30" fill="#1f2937" stroke="#34d399" stroke-width="3"/>
           <circle cx="170" cy="140" r="14" fill="#10b981" opacity="0.6"/>
           <circle cx="230" cy="140" r="14" fill="#10b981" opacity="0.6"/>
           <path d="M170 154 L170 180" stroke="#34d399" stroke-width="5" stroke-linecap="round"/>
           <path d="M230 154 L230 180" stroke="#34d399" stroke-width="5" stroke-linecap="round"/>
           <text x="200" y="235" font-family="Arial" font-size="11" fill="#6ee7b7" text-anchor="middle">ANC PRO WIRELESS</text>`
  },
  {
    name: 'smart-watch-ultra.svg',
    title: 'Smart Watch Ultra 2',
    tag: 'AMOLED | Bluetooth Call | GPS',
    color1: '#18181b', color2: '#f59e0b',
    icon: `<rect x="175" y="60" width="50" height="50" fill="#71717a" rx="6"/>
           <rect x="175" y="240" width="50" height="50" fill="#71717a" rx="6"/>
           <rect x="145" y="100" width="110" height="140" rx="24" fill="#27272a" stroke="#fbbf24" stroke-width="4"/>
           <circle cx="200" cy="170" r="42" fill="#09090b" stroke="#f59e0b" stroke-width="2"/>
           <line x1="200" y1="170" x2="200" y2="145" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
           <line x1="200" y1="170" x2="225" y2="170" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
           <text x="200" y="200" font-family="Arial" font-size="10" fill="#fef08a" text-anchor="middle">10:45 AM</text>`
  },
  {
    name: 'smart-tv-4k.svg',
    title: '43" 4K Smart Google TV',
    tag: 'HDR10+ | Dolby Atmos Sound',
    color1: '#030712', color2: '#38bdf8',
    icon: `<rect x="80" y="90" width="240" height="140" rx="6" fill="#111827" stroke="#7dd3fc" stroke-width="3"/>
           <rect x="90" y="100" width="220" height="120" rx="3" fill="#030712"/>
           <polygon points="175,140 175,180 215,160" fill="#38bdf8"/>
           <path d="M160 230 L150 250 M240 230 L250 250" stroke="#9ca3af" stroke-width="4" stroke-linecap="round"/>
           <text x="200" y="205" font-family="Arial" font-size="11" font-weight="bold" fill="#e0f2fe" text-anchor="middle">4K ULTRA HD</text>`
  },
  {
    name: 'mechanical-keyboard-rgb.svg',
    title: 'RGB Mechanical Gaming Keyboard',
    tag: 'Hot-Swappable | Blue Switches',
    color1: '#0f172a', color2: '#a855f7',
    icon: `<rect x="70" y="110" width="260" height="100" rx="10" fill="#1e293b" stroke="#c084fc" stroke-width="3"/>
           <g fill="#334155">
             <rect x="85" y="125" width="20" height="20" rx="4" fill="#a855f7"/>
             <rect x="110" y="125" width="20" height="20" rx="4" fill="#3b82f6"/>
             <rect x="135" y="125" width="20" height="20" rx="4" fill="#10b981"/>
             <rect x="160" y="125" width="20" height="20" rx="4" fill="#f59e0b"/>
             <rect x="185" y="125" width="20" height="20" rx="4" fill="#ef4444"/>
             <rect x="210" y="125" width="20" height="20" rx="4" fill="#ec4899"/>
             <rect x="235" y="125" width="20" height="20" rx="4" fill="#8b5cf6"/>
             <rect x="260" y="125" width="20" height="20" rx="4" fill="#06b6d4"/>
             <rect x="285" y="125" width="30" height="20" rx="4" fill="#64748b"/>
             <rect x="85" y="155" width="30" height="20" rx="4" fill="#64748b"/>
             <rect x="120" y="155" width="140" height="20" rx="4" fill="#c084fc" opacity="0.8"/>
             <rect x="265" y="155" width="50" height="20" rx="4" fill="#64748b"/>
           </g>
           <text x="200" y="240" font-family="Arial" font-size="11" fill="#e9d5ff" text-anchor="middle">RGB MECHANICAL PRO</text>`
  },
  {
    name: 'premium-cotton-panjabi.svg',
    title: 'Premium Cotton Panjabi',
    tag: 'Handcrafted Embroidery | White & Blue',
    color1: '#1e3a8a', color2: '#3b82f6',
    icon: `<path d="M150 80 L180 110 L220 110 L250 80 L270 120 L240 135 L245 270 L155 270 L160 135 L130 120 Z" fill="#f8fafc" stroke="#3b82f6" stroke-width="3"/>
           <path d="M190 110 L210 110 L205 180 L195 180 Z" fill="#1e3a8a"/>
           <circle cx="200" cy="125" r="3" fill="#fbbf24"/>
           <circle cx="200" cy="145" r="3" fill="#fbbf24"/>
           <circle cx="200" cy="165" r="3" fill="#fbbf24"/>
           <path d="M175 110 Q200 130 225 110" fill="none" stroke="#fbbf24" stroke-width="2"/>
           <text x="200" y="250" font-family="Arial" font-size="11" font-weight="bold" fill="#1e3a8a" text-anchor="middle">EXCLUSIVE PANJABI</text>`
  },
  {
    name: 'royal-silk-panjabi.svg',
    title: 'Royal Silk Festive Panjabi',
    tag: 'Pure Silk | Golden Embroidery',
    color1: '#451a03', color2: '#d97706',
    icon: `<path d="M150 80 L180 110 L220 110 L250 80 L270 120 L240 135 L245 270 L155 270 L160 135 L130 120 Z" fill="#78350f" stroke="#f59e0b" stroke-width="3"/>
           <path d="M190 110 L210 110 L205 185 L195 185 Z" fill="#d97706"/>
           <circle cx="200" cy="125" r="3" fill="#fef08a"/>
           <circle cx="200" cy="145" r="3" fill="#fef08a"/>
           <circle cx="200" cy="165" r="3" fill="#fef08a"/>
           <text x="200" y="240" font-family="Arial" font-size="10" font-weight="bold" fill="#fef08a" text-anchor="middle">ROYAL SILK</text>`
  },
  {
    name: 'jamdani-saree.svg',
    title: 'Dhaka Handloom Jamdani Saree',
    tag: 'Traditional 84 Count | Pure Cotton-Silk',
    color1: '#831843', color2: '#db2777',
    icon: `<path d="M130 90 Q200 70 270 90 L280 260 Q200 280 120 260 Z" fill="#be185d" stroke="#fbcfe8" stroke-width="3"/>
           <path d="M130 90 L220 260 M170 80 L260 250 M210 80 L280 200" stroke="#fde047" stroke-width="2" stroke-dasharray="4,4"/>
           <circle cx="200" cy="160" r="25" fill="#9d174d" stroke="#fde047" stroke-width="2"/>
           <text x="200" y="165" font-family="Arial" font-size="9" font-weight="bold" fill="#fef08a" text-anchor="middle">JAMDANI</text>
           <text x="200" y="240" font-family="Arial" font-size="11" font-weight="bold" fill="#fdf2f8" text-anchor="middle">ORIGINAL DHAKA</text>`
  },
  {
    name: 'katan-bridal-saree.svg',
    title: 'Mirpur Katan Bridal Saree',
    tag: 'Heavy Zari Work | Crimson Red',
    color1: '#7f1d1d', color2: '#dc2626',
    icon: `<path d="M130 90 Q200 70 270 90 L280 260 Q200 280 120 260 Z" fill="#991b1b" stroke="#fca5a5" stroke-width="3"/>
           <path d="M130 130 L270 130 M130 180 L270 180 M130 230 L270 230" stroke="#f59e0b" stroke-width="3"/>
           <circle cx="200" cy="155" r="18" fill="#b91c1c" stroke="#f59e0b" stroke-width="2"/>
           <text x="200" y="210" font-family="Arial" font-size="11" font-weight="bold" fill="#fef3c7" text-anchor="middle">BRIDAL KATAN</text>`
  },
  {
    name: 'casual-slim-tshirt.svg',
    title: 'Casual Slim Fit T-Shirt',
    tag: '100% Combed Cotton | 180 GSM',
    color1: '#1e1b4b', color2: '#4338ca',
    icon: `<path d="M140 90 L180 110 L220 110 L260 90 L285 135 L255 150 L250 260 L150 260 L145 150 L115 135 Z" fill="#312e81" stroke="#818cf8" stroke-width="3"/>
           <path d="M180 110 Q200 125 220 110" fill="none" stroke="#818cf8" stroke-width="2"/>
           <text x="200" y="190" font-family="Arial" font-size="14" font-weight="bold" fill="#e0e7ff" text-anchor="middle">COTTON</text>
           <text x="200" y="210" font-family="Arial" font-size="10" fill="#a5b4fc" text-anchor="middle">SLIM FIT 180 GSM</text>`
  },
  {
    name: 'denim-slim-jeans.svg',
    title: 'Men\'s Stretch Denim Jeans',
    tag: 'Premium Indigo Washed Denim',
    color1: '#0c4a6e', color2: '#0284c7',
    icon: `<path d="M140 80 L260 80 L265 105 L250 270 L205 270 L200 130 L195 270 L150 270 L135 105 Z" fill="#0369a1" stroke="#38bdf8" stroke-width="3"/>
           <line x1="140" y1="95" x2="260" y2="95" stroke="#f59e0b" stroke-width="2"/>
           <path d="M155 105 Q175 125 195 105 M205 105 Q225 125 245 105" fill="none" stroke="#f59e0b" stroke-width="2"/>
           <text x="200" y="210" font-family="Arial" font-size="11" font-weight="bold" fill="#e0f2fe" text-anchor="middle">STRETCH DENIM</text>`
  },
  {
    name: 'leather-wallet.svg',
    title: 'Genuine Leather Wallet',
    tag: 'Full Grain Leather | RFID Protected',
    color1: '#3f2c20', color2: '#854d0e',
    icon: `<rect x="130" y="110" width="140" height="110" rx="10" fill="#713f12" stroke="#ca8a04" stroke-width="3"/>
           <rect x="140" y="125" width="120" height="80" rx="6" fill="#451a03"/>
           <circle cx="240" cy="165" r="8" fill="#eab308"/>
           <text x="180" y="170" font-family="Arial" font-size="11" font-weight="bold" fill="#fef08a">LEATHER</text>
           <text x="200" y="240" font-family="Arial" font-size="10" fill="#fef08a" text-anchor="middle">RFID PROTECTED</text>`
  },
  {
    name: 'running-shoes.svg',
    title: 'Pro Running Sports Shoes',
    tag: 'Air Cushion Sole | Breathable Mesh',
    color1: '#111827', color2: '#ef4444',
    icon: `<path d="M110 200 Q150 180 200 185 L280 160 Q290 190 280 220 L110 220 Z" fill="#dc2626" stroke="#f87171" stroke-width="3"/>
           <path d="M105 220 L285 220 L280 240 L115 240 Z" fill="#f3f4f6"/>
           <path d="M150 190 L180 150 L210 185" stroke="#fff" stroke-width="3" fill="none"/>
           <text x="200" y="205" font-family="Arial" font-size="11" font-weight="bold" fill="#fff" text-anchor="middle">AIR PRO</text>`
  },
  {
    name: 'mustard-oil.svg',
    title: 'Organic Pure Mustard Oil',
    tag: 'Cold Pressed Ghani | 100% Pure (1L)',
    color1: '#422006', color2: '#eab308',
    icon: `<rect x="160" y="90" width="80" height="150" rx="14" fill="#a16207" stroke="#facc15" stroke-width="3"/>
           <rect x="185" y="65" width="30" height="25" rx="4" fill="#eab308"/>
           <rect x="168" y="130" width="64" height="60" rx="6" fill="#fef08a"/>
           <text x="200" y="155" font-family="Arial" font-size="9" font-weight="bold" fill="#713f12" text-anchor="middle">100% PURE</text>
           <text x="200" y="175" font-family="Arial" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="middle">MUSTARD</text>`
  },
  {
    name: 'sundarban-honey.svg',
    title: 'Raw Sundarban Honey',
    tag: 'Pure Forest Wild Honey (500g)',
    color1: '#451a03', color2: '#f59e0b',
    icon: `<path d="M150 110 Q140 180 150 230 Q200 245 250 230 Q260 180 250 110 Z" fill="#d97706" stroke="#fbbf24" stroke-width="3"/>
           <ellipse cx="200" cy="110" rx="50" ry="15" fill="#f59e0b"/>
           <rect x="175" y="85" width="50" height="25" rx="4" fill="#78350f"/>
           <rect x="165" y="140" width="70" height="50" rx="6" fill="#fef3c7"/>
           <text x="200" y="165" font-family="Arial" font-size="9" font-weight="bold" fill="#78350f" text-anchor="middle">SUNDARBAN</text>
           <text x="200" y="180" font-family="Arial" font-size="11" font-weight="bold" fill="#b45309" text-anchor="middle">HONEY</text>`
  },
  {
    name: 'face-serum.svg',
    title: 'Vitamin C Glow Face Serum',
    tag: 'Hyaluronic Acid + Niacinamide (30ml)',
    color1: '#431407', color2: '#ea580c',
    icon: `<rect x="165" y="110" width="70" height="130" rx="10" fill="#c2410c" stroke="#fdba74" stroke-width="3"/>
           <rect x="185" y="70" width="30" height="40" rx="4" fill="#ea580c"/>
           <circle cx="200" cy="65" r="10" fill="#fff"/>
           <rect x="172" y="140" width="56" height="60" rx="4" fill="#fff7ed"/>
           <text x="200" y="165" font-family="Arial" font-size="10" font-weight="bold" fill="#9a3412" text-anchor="middle">VITAMIN C</text>
           <text x="200" y="185" font-family="Arial" font-size="8" fill="#c2410c" text-anchor="middle">GLOW SERUM</text>`
  }
];

products.forEach(p => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 350" width="400" height="350">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.color1}"/>
      <stop offset="100%" stop-color="${p.color2}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="400" height="350" rx="16" fill="url(#bg)"/>
  <circle cx="200" cy="160" r="120" fill="#ffffff" opacity="0.05"/>
  <g filter="url(#shadow)">
    ${p.icon}
  </g>
  <rect x="20" y="295" width="360" height="40" rx="8" fill="#000000" opacity="0.4"/>
  <text x="200" y="315" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">${p.title}</text>
  <text x="200" y="328" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">${p.tag}</text>
</svg>`;
  writeAsset(`products/${p.name}`, svg);
});

// 2. CATEGORIES
const categories = [
  { name: 'electronics.svg', title: 'Electronics', icon: '?', c1: '#1e3a8a', c2: '#3b82f6' },
  { name: 'mobile-phones.svg', title: 'Mobile Phones', icon: '??', c1: '#0f172a', c2: '#2563eb' },
  { name: 'laptops.svg', title: 'Laptops', icon: '??', c1: '#1e293b', c2: '#475569' },
  { name: 'accessories.svg', title: 'Accessories', icon: '??', c1: '#111827', c2: '#10b981' },
  { name: 'fashion.svg', title: 'Fashion', icon: '?', c1: '#831843', c2: '#db2777' },
  { name: 'mens-clothing.svg', title: "Men's Clothing", icon: '??', c1: '#1e1b4b', c2: '#4f46e5' },
  { name: 'womens-clothing.svg', title: "Women's Clothing", icon: '??', c1: '#701a75', c2: '#c026d3' },
  { name: 'shoes.svg', title: 'Shoes & Footwear', icon: '??', c1: '#18181b', c2: '#dc2626' },
  { name: 'home-living.svg', title: 'Home & Living', icon: '??', c1: '#14532d', c2: '#16a34a' },
  { name: 'beauty-health.svg', title: 'Beauty & Health', icon: '??', c1: '#881337', c2: '#f43f5e' },
  { name: 'groceries.svg', title: 'Groceries', icon: '??', c1: '#713f12', c2: '#eab308' }
];

categories.forEach(c => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="cbg-${c.name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c.c1}"/>
      <stop offset="100%" stop-color="${c.c2}"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="20" fill="url(#cbg-${c.name})"/>
  <circle cx="100" cy="85" r="45" fill="#ffffff" opacity="0.15"/>
  <text x="100" y="98" font-size="40" text-anchor="middle">${c.icon}</text>
  <text x="100" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">${c.title}</text>
</svg>`;
  writeAsset(`categories/${c.name}`, svg);
});

// 3. BANNERS
const banners = [
  {
    name: 'hero-eid-sale.svg',
    title: 'EID MEGA FESTIVAL 2026',
    subtitle: 'Up to 50% OFF on Panjabi, Sarees, Smartphones & Gadgets',
    badge: 'CASH ON DELIVERY ALL OVER BANGLADESH',
    c1: '#0f172a', c2: '#1e3a8a', accent: '#f59e0b'
  },
  {
    name: 'hero-gadget-fest.svg',
    title: 'TECH & GADGET EXPO',
    subtitle: 'Latest 5G Phones, Smartwatches, Earbuds & Gaming Gear',
    badge: '100% AUTHENTIC WITH OFFICIAL WARRANTY',
    c1: '#111827', c2: '#047857', accent: '#34d399'
  },
  {
    name: 'flash-sale-banner.svg',
    title: 'FLASH SALE ? LIMITED TIME',
    subtitle: 'Extra 15% Instant Cashback on bKash & Nagad Payments',
    badge: 'HURRY! STOCKS RUNNING OUT FAST',
    c1: '#7f1d1d', c2: '#dc2626', accent: '#fef08a'
  }
];

banners.forEach(b => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 450" width="1200" height="450">
  <defs>
    <linearGradient id="bg-${b.name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${b.c1}"/>
      <stop offset="100%" stop-color="${b.c2}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="450" rx="16" fill="url(#bg-${b.name})"/>
  <circle cx="1050" cy="225" r="280" fill="#ffffff" opacity="0.04"/>
  <circle cx="150" cy="80" r="180" fill="#ffffff" opacity="0.03"/>
  <rect x="80" y="70" width="360" height="34" rx="17" fill="${b.accent}" opacity="0.9"/>
  <text x="260" y="93" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">? ${b.badge} ?</text>
  <text x="80" y="180" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" fill="#ffffff">${b.title}</text>
  <text x="80" y="235" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#e2e8f0">${b.subtitle}</text>
  
  <rect x="80" y="290" width="180" height="54" rx="10" fill="${b.accent}"/>
  <text x="170" y="324" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">SHOP NOW ?</text>
  
  <rect x="280" y="290" width="200" height="54" rx="10" fill="transparent" stroke="#ffffff" stroke-width="2"/>
  <text x="380" y="324" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">VIEW DEALS</text>
  
  <g transform="translate(820, 80)">
    <rect width="280" height="280" rx="20" fill="#ffffff" opacity="0.08" stroke="#ffffff" stroke-width="1"/>
    <circle cx="140" cy="140" r="90" fill="${b.accent}" opacity="0.2"/>
    <text x="140" y="125" font-size="60" text-anchor="middle">???</text>
    <text x="140" y="180" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">SPECIAL OFFER</text>
    <text x="140" y="205" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="${b.accent}" text-anchor="middle">UP TO 50% DISCOUNT</text>
  </g>
</svg>`;
  writeAsset(`banners/${b.name}`, svg);
});

// 4. BRANDS & LOGOS
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="240" height="60">
  <rect width="240" height="60" rx="8" fill="#1e40af"/>
  <circle cx="35" cy="30" r="18" fill="#f59e0b"/>
  <text x="35" y="37" font-size="20" text-anchor="middle">??</text>
  <text x="65" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="#ffffff">BD<tspan fill="#fbbf24">SHOP</tspan></text>
</svg>`;
writeAsset('logo.svg', logoSvg);

console.log('All image assets created successfully!');
