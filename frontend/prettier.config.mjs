import basePrettierConfig from "../prettier.config.mjs";

const frontendPrettierConfig = {
  ...basePrettierConfig,

  // Add support for Tailwind CSS
  plugins: [...basePrettierConfig.plugins, "prettier-plugin-tailwindcss"],

  // Config for prettier-plugin-tailwindcss
  // Enable formatting for the parameters of the <Transition> component
  tailwindAttributes: ["type", "before", "start", "end", "after"],
};

export default frontendPrettierConfig;
