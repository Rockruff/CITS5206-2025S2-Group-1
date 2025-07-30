import basePrettierConfig from "../prettier.config.mjs";

const backendPrettierConfig = {
  ...basePrettierConfig,

  // Config for @trivago/prettier-plugin-sort-imports
  // Workaround to support decorator syntax required by certain ORMs
  importOrderParserPlugins: ["typescript", "decorators"],
};

export default backendPrettierConfig;
