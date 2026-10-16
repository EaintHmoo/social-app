/**
 * Every `import.meta.env` read in the app happens here, and nowhere else.
 *
 * Laravel: this is config/app.php next to env() — the rule is the same. Code reads the config,
 * only the config reads the environment, so there is one place to look when a value is wrong
 * and one place to change when a variable is renamed.
 *
 * Remember that Vite inlines these at BUILD time and only exposes keys prefixed VITE_. The
 * values end up in the shipped JavaScript, so nothing secret can live here.
 */

export const config = {
  /**
   * Where apiClient sends its requests.
   *
   * "/api" is a same-origin prefix the Vite dev proxy strips before forwarding to :3000 (see
   * vite.config.ts) — the backend itself has no /api prefix. The prefix exists so API URLs can
   * never collide with the app's own page routes, /posts being the obvious clash.
   *
   * Set VITE_API_URL for a deployed build where the API lives on another host.
   */
  apiBaseUrl: import.meta.env.VITE_API_URL ?? "/api",

  /** True under `npm run dev`, false in a `npm run build` bundle. */
  isDev: import.meta.env.DEV,
} as const;
