export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'todo_txt_app_theme';

export const getTheme = (): Theme => {
  return (localStorage.getItem(THEME_KEY) as Theme) || 'dark'; // dark standard
};

export const setTheme = (theme: Theme) => {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme();
};

export const applyTheme = () => {
  const theme = getTheme();
  const root = document.documentElement;
  
  root.classList.remove('light', 'dark');
  
  let activeTheme: 'light' | 'dark';
  if (theme === 'system') {
    activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    activeTheme = theme as 'light' | 'dark';
  }
  
  root.classList.add(activeTheme);

  // Update theme-color meta tags
  const themeColor = activeTheme === 'dark' ? '#020617' : '#ffffff';
  let metaTags = document.querySelectorAll('meta[name="theme-color"]');
  if (metaTags.length > 0) {
    metaTags.forEach(meta => meta.setAttribute('content', themeColor));
  } else {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', themeColor);
    document.head.appendChild(meta);
  }
};

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'system') {
      applyTheme();
    }
  });
}
