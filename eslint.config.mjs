import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // "@typescript-eslint/no-unused-vars": "off", // Ignore unused variables
      "@typescript-eslint/no-explicit-any": "off", // Allow use of 'any' type
      "react/no-unused-props": "off", // Ignore unused props
      "@typescript-eslint/ban-ts-comment": "off", // Allow @ts-ignore comments
      "@typescript-eslint/no-empty-interface": "off", // Allow empty interfaces
      "@typescript-eslint/no-empty-function": "off", // Allow empty functions
      "react-hooks/exhaustive-deps": "off", // Ignore missing dependencies in hooks
    },
  },
];

export default eslintConfig;
