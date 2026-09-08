import { themesOptions, defaultTheme } from "./theme";

// Resolve a persisted "theme" object against the built-in theme list.
// Look up by label so changes to built-ins propagate on reload.
export const resolveTheme = (saved) => {
  if (!saved) return defaultTheme;
  const builtin = themesOptions.find((e) => e.value.label === saved.label);
  if (builtin) return builtin.value;
  return saved;
};

// react-select supports grouped options natively via {label, options: [...]}.
export const buildGroupedOptions = (t) => {
  const builtIn = {
    label: t ? t("theme_group_builtin") : "Built-in",
    options: themesOptions,
  };
  return [builtIn];
};

export const findOptionForTheme = (groupedOptions, theme) => {
  if (!theme) return null;
  for (const grp of groupedOptions) {
    for (const opt of grp.options) {
      if (opt.value.label === theme.label) return opt;
    }
  }
  return null;
};
