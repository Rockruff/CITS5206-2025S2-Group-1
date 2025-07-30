import basePrettierConfig from "../prettier.config.mjs";

const frontendPrettierConfig = {
  ...basePrettierConfig,

  // Add support for Tailwind CSS
  plugins: [...basePrettierConfig.plugins, "prettier-plugin-tailwindcss"],
};

export default frontendPrettierConfig;
