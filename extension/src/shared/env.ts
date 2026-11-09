// Build-time flags. Production builds compile every development branch away.
export const IS_DEV: boolean = typeof __GLOBTREK_DEV__ !== "undefined" && __GLOBTREK_DEV__ === true;
export const VERSION: string = typeof __GLOBTREK_VERSION__ !== "undefined" ? __GLOBTREK_VERSION__ : "0.0.0-test";

// Sanitized fixture pages served by `npm run fixtures` for development and e2e tests.
export const DEV_FIXTURE_ORIGIN = "http://localhost:4599";
