// Adapter module to load CommonJS-style index.js in browser environment
(function () {
  // Create module global variables that CommonJS modules expect
  window.module = { exports: {} };
  window.exports = window.module.exports;
  window.global = window;

  // Simple mock implementation of require for the browser
  window.require = function (moduleName) {
    console.log("Mock require called for:", moduleName);

    // Map module names to global variables
    if (moduleName === "@duckdb/duckdb-wasm") {
      return window.duckdbWasm;
    } else if (moduleName.includes("apache-arrow")) {
      return window.apacheArrow;
    } else {
      console.warn("Unmapped require:", moduleName);
      // Return an empty object to avoid crashing
      return {};
    }
  };

  // Add a simplified process.env for Node.js environment checks
  window.process = {
    env: {
      NODE_ENV: "development",
    },
    browser: true,
  };

  // Add additional debug output
  console.log("Adapter script started, waiting for dependencies to load...");
  console.log("DuckDB WASM available:", !!window.duckdbWasm);
  console.log("Apache Arrow available:", !!window.apacheArrow);

  // Function to load and initialize the kit
  function loadAndInitializeKit() {
    // Load the index.js script that contains CommonJS syntax
    const script = document.createElement("script");
    script.src = "/dist/index.js";
    script.onload = function () {
      console.log("DuckDB kit script loaded successfully");

      // After script loads, grab the exports and expose them
      const duckDbKit = window.module.exports;
      console.log("Exported module contents:", Object.keys(duckDbKit));

      // First try to find a direct exported function
      let initFunc = null;
      if (typeof duckDbKit.initializeDuckDb === "function") {
        initFunc = duckDbKit.initializeDuckDb;
        console.log("Found initializeDuckDb function");
      } else if (typeof duckDbKit.initialize === "function") {
        initFunc = duckDbKit.initialize;
        console.log("Found initialize function");
      } else if (duckDbKit.default) {
        console.log("Checking default export:", Object.keys(duckDbKit.default));
        // Try default export
        if (typeof duckDbKit.default.initializeDuckDb === "function") {
          initFunc = duckDbKit.default.initializeDuckDb;
          console.log("Found initializeDuckDb function in default export");
        } else if (typeof duckDbKit.default.initialize === "function") {
          initFunc = duckDbKit.default.initialize;
          console.log("Found initialize function in default export");
        }
      }

      // Get utility functions - check both default export and direct exports
      const kit = duckDbKit.default || duckDbKit;
      window.runQuery = kit.runQuery || duckDbKit.runQuery;
      window.tableNames = kit.tableNames || duckDbKit.tableNames;
      window.insertFile = kit.insertFile || duckDbKit.insertFile;

      // Attempt to manually initialize DuckDB using the duck-db library
      if (!initFunc && window.duckdbWasm) {
        console.log("No initialization function found, attempting manual initialization");

        initFunc = async function () {
          // Manual implementation based on common DuckDB initialization patterns
          const logger = new window.duckdbWasm.ConsoleLogger();
          const bundle = await window.duckdbWasm.selectBundle();
          const worker = new Worker(bundle.mainWorker);
          const db = new window.duckdbWasm.AsyncDuckDB(logger, worker);
          await db.instantiate(bundle.mainModule);
          await db.open();
          return db;
        };
      }

      // Expose the functions directly and handle initialization
      if (initFunc) {
        console.log("Attempting to initialize DuckDB...");
        initFunc()
          .then((instance) => {
            window.duckdbInstance = instance;
            window.__duckdbReady = true;
            console.log("DuckDB initialized successfully");
          })
          .catch((err) => {
            console.error("Failed to initialize DuckDB:", err);
          });
      } else {
        console.error("No viable initialization function found for DuckDB");
      }

      console.log("DuckDB functions exposed:", {
        initFunc: !!initFunc,
        runQuery: !!window.runQuery,
        tableNames: !!window.tableNames,
        insertFile: !!window.insertFile,
      });
    };

    script.onerror = function (error) {
      console.error("Failed to load DuckDB kit script:", error);
    };

    document.head.appendChild(script);
  }

  // Wait longer for the modules to load before initializing
  const timeout = 1000; // Increase to 1000ms (1 second)
  console.log(`Waiting ${timeout}ms for modules to load...`);
  setTimeout(() => {
    // Check if dependencies are available
    if (!window.duckdbWasm || !window.apacheArrow) {
      console.error("Dependencies failed to load:", {
        duckdbWasm: !!window.duckdbWasm,
        apacheArrow: !!window.apacheArrow,
      });
    } else {
      console.log("Dependencies loaded successfully, initializing DuckDB kit...");
      loadAndInitializeKit();
    }
  }, timeout);
})();
