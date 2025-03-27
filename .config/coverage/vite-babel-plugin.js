// ES module version of the Vite Babel plugin for code instrumentation
import { createFilter } from "@rollup/pluginutils";
import { transformAsync } from "@babel/core";

function viteBabelPlugin(options = {}) {
  const filter = createFilter(
    options.include || /\.(jsx?|tsx?)$/,
    options.exclude || /node_modules/,
  );

  return {
    name: "vite-babel-plugin",
    enforce: "pre",
    async transform(code, id) {
      if (!filter(id)) {
        return null;
      }
      try {
        const result = await transformAsync(code, {
          filename: id,
          babelrc: false,
          configFile: "./.config/coverage/babel.config.cjs",
          sourceMaps: "both",
        });
        if (!result) return null;
        return {
          code: result.code || code,
          map: result.map,
        };
      } catch (error) {
        console.error(`Failed to transform file "${id}" with Babel:`, error);
        return null;
      }
    },
  };
}

export default viteBabelPlugin;
