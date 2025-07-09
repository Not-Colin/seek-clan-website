// eslint.config.mjs
const next_plugin = require("@next/eslint-plugin-next");

module.exports = [
  {
    plugins: {
      next: next_plugin,
    },
    rules: {
      ...next_plugin.configs.recommended.rules,
      ...next_plugin.configs["core-web-vitals"].rules,
    },
  },
];