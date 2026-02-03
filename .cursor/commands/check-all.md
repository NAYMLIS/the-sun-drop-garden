# /check-all

Run a comprehensive check and fix across the entire project including linting, formatting, types, tests, and build.

## Instructions

When the user triggers this command:

1.  **Execute the command**: Run `bun run check-all` in the root terminal.
2.  **Handle failures**:
    *   If `ultracite fix` fails, analyze the output and attempt to fix remaining linting or formatting issues manually.
    *   If `convex dev --once` fails, ensure the backend environment is correctly set up.
    *   If `check-types` fails, navigate to the reported files and resolve the TypeScript errors.
    *   If `test:unit` fails, fix the failing tests.
    *   If `build` fails, investigate the build log and resolve any integration issues.
    *   If there is any merge conflicts, resolve them appropriately.
3.  **Final Summary**: Once all checks pass (or after you've attempted fixes), provide a concise summary of:
    *   Issues found and fixed.
    *   Steps successfully completed.
    *   Any remaining manual actions required.
