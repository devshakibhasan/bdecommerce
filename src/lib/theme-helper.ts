function updateThemeDOM(theme: string) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('dark');
  root.classList.add('light');
  root.setAttribute('data-theme', 'light');
}
