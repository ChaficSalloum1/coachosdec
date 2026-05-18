const expoConfig = require("eslint-config-expo/flat");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "rootStore.example.ts", "nativewind-env.d.ts"],
    rules: {
      "import/first": "off",
    },
  },
]);
