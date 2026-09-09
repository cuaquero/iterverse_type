// Iterverse Type has one visual identity: a dark theme built on BTECH's
// own brand tokens (see src/assets/iterverse/tokens.css and the
// iterverse_labs design-system this project draws from) — no theme picker,
// shared as-is across the regular typing test and Kiosk mode.
const defaultTheme = {
  label: "BTECH Dark",
  background: "#232526", // --btech-gray-dark
  text: "#f7f7f8", // --neutral-50
  gradient: "linear-gradient(315deg, #36393b 0%, #161618 94%)",
  title: "#ffffff",
  textTypeBox: "#8a8a90", // --neutral-500
  stats: "#d22030", // --btech-red
  fontFamily: "Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
};

export { defaultTheme };
