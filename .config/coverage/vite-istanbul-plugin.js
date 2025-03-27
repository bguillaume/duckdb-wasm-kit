// ES module version of Vite Istanbul Plugin
import path from "path";
import { createFilter } from "@rollup/pluginutils";
import { createInstrumenter } from "istanbul-lib-instrument";

const shouldInstrument = (id) => {
  if (
    id.includes("node_modules") ||
    id.includes(".spec.") ||
    id.includes(".test.") ||
    id.includes("/tests/")
  ) {
    return false;
  }
  if (id.includes("/src/") && /\.(js|jsx|ts|tsx)$/.test(id) && !id.includes(".d.ts")) {
    console.log(`[Istanbul] Instrumenting source file: ${id}`);
    return true;
  }
  return /\.(js|jsx|ts|tsx)$/.test(id) && !id.includes(".d.ts");
};

export function istanbulPlugin(options = {}) {
  // Exclude src/index.ts from instrumentation to avoid source map errors
  options.exclude = [...(options.exclude || []), /src\/index\.ts$/];
  const filter = createFilter(
    options.include || [/\/src\/.*\.(js|jsx|ts|tsx)$/],
    options.exclude || [/node_modules/, /\.spec\./, /\.test\./, /\.d\.ts$/, /\/tests\//],
  );
  const instrumenter = createInstrumenter({
    esModules: true,
    preserveComments: true,
    produceSourceMap: true,
    compact: false,
    autoWrap: true,
  });
  return {
    name: "vite-plugin-istanbul",
    enforce: "pre",
    configResolved(config) {
      const isBuild = config.command === "build";
      const isTest =
        process.env.NODE_ENV === "test" ||
        process.env.BABEL_ENV === "test" ||
        options.forceBuildInstrument === true;
      if (isBuild && !isTest && !options.forceBuildInstrument) {
        console.log("[Istanbul] Skipping instrumentation for production build");
        this.transform = () => null;
      }
    },
    transform(code, id) {
      if (!filter(id) || !shouldInstrument(id)) {
        return null;
      }
      try {
        const filename = path.relative(process.cwd(), id);
        // Instrument the code, passing inputSourceMap if available
        const instrumentedCode = instrumenter.instrumentSync(code, filename, {
          source: code,
          file: filename,
          inputSourceMap: instrumenter.lastSourceMap
            ? instrumenter.lastSourceMap()
            : undefined,
        });
        console.log(`[Istanbul] Instrumented: ${filename}`);
        return {
          code: instrumentedCode,
          map: instrumenter.lastSourceMap(),
        };
      } catch (e) {
        console.warn(`[vite-plugin-istanbul] Failed to instrument file: ${id}`, e);
        return null;
      }
    },
  };
}

export default istanbulPlugin;
