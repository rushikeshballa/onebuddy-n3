import { colors as groceriesColors, lightColors as groceriesLightColors, darkColors as groceriesDarkColors } from '../categories/groceries/theme/colors';
import { COLORS as foodThemeColors, lightColors as foodThemeLightColors, darkColors as foodThemeDarkColors } from '../categories/food/theme/colors';
import { colors as foodCompColors, lightColors as foodCompLightColors, darkColors as foodCompDarkColors } from '../categories/food/components/theme/colors';
import { setCategoryScheme, getCategoryScheme, isCategoryDark, Scheme } from './installCategoryTheme';

export { getCategoryScheme, isCategoryDark };
export type { Scheme };

export function applyCategoryTheme(scheme: Scheme) {
  setCategoryScheme(scheme);

  // 1. Sync Groceries theme colors
  try {
    Object.assign(groceriesColors, scheme === 'dark' ? groceriesDarkColors : groceriesLightColors);
  } catch {
    // Ignore
  }

  // 2. Sync Food theme colors
  try {
    Object.assign(foodThemeColors, scheme === 'dark' ? foodThemeDarkColors : foodThemeLightColors);
  } catch {
    // Ignore
  }

  // 3. Sync Food component colors
  try {
    Object.assign(foodCompColors, scheme === 'dark' ? foodCompDarkColors : foodCompLightColors);
  } catch {
    // Ignore
  }
}
