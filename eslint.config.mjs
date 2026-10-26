import tseslint from "typescript-eslint";
export default tseslint.config(
  { ignores: ["**/.next/**", "**/next-env.d.ts", "**/node_modules/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
