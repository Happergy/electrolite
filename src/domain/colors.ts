const RGB_COLORS = {
  green: '171,201,119',
  grey: '203,203,203',
  yellow: '255,215,102',
  orange: '243,170,109',
  red: '230,124,114',
};
export const LINE_COLORS: Record<string, string> = {
  green: `rgba(${RGB_COLORS.green},1)`,
  yellow: `rgba(${RGB_COLORS.yellow},1)`,
  orange: `rgba(${RGB_COLORS.orange},1)`,
  red: `rgba(${RGB_COLORS.red},1)`,
};

const BG_OPACITY = '.3';
export const BG_COLORS: Record<string, string> = {
  green: `rgba(${RGB_COLORS.green},${BG_OPACITY})`,
  grey: `rgba(${RGB_COLORS.grey},${BG_OPACITY})`,
  yellow: `rgba(${RGB_COLORS.yellow},${BG_OPACITY})`,
  orange: `rgba(${RGB_COLORS.orange},${BG_OPACITY})`,
  red: `rgba(${RGB_COLORS.red},${BG_OPACITY})`,
};
