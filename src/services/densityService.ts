export type Density = 'normal' | 'loose' | 'compact';

const DENSITY_KEY = 'todo_txt_app_density';

export const getDensity = (): Density => {
  return (localStorage.getItem(DENSITY_KEY) as Density) || 'normal';
};

export const setDensity = (density: Density) => {
  localStorage.setItem(DENSITY_KEY, density);
  applyDensity();
};

export const applyDensity = () => {
  const density = getDensity();
  const root = document.documentElement;
  root.setAttribute('data-density', density);
};
