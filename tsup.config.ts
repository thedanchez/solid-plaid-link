import { defineConfig } from "tsup";
import * as preset from "tsup-preset-solid";

const generateSolidPresetOptions = (): preset.PresetOptions => ({
  entries: [
    {
      // entries with '.tsx' extension will have `solid` export condition generated
      entry: "src/index.tsx",
      dev_entry: false,
      server_entry: false,
    },
  ],
  cjs: false,
});

export default defineConfig((config) => {
  const watching = !!config.watch;
  const solidPresetOptions = generateSolidPresetOptions();
  const parsedOptions = preset.parsePresetOptions(solidPresetOptions, watching);

  if (!watching) {
    const packageFields = preset.generatePackageExports(parsedOptions);
    preset.writePackageJson(packageFields);
  }

  const tsupOptions = preset
    .generateTsupOptions(parsedOptions)
    .map((tsupOption) => ({ name: "solid-plaid-link", minify: true, ...tsupOption }));

  return tsupOptions;
});
