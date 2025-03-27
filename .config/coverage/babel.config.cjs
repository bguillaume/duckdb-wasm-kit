/* eslint-env commonjs */
// CommonJS module format for babel config
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
    "@babel/preset-react",
  ],
  plugins: [
    [
      "istanbul",
      {
        exclude: [
          "**/*.d.ts",
          "**/*.spec.ts",
          "**/*.test.ts",
          "**/tests/**",
          "**/node_modules/**",
          "**/coverage/**",
        ],
      },
    ],
    "@babel/plugin-syntax-typescript",
  ].filter(Boolean),
};
