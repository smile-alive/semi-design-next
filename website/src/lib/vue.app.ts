import type { App } from 'vue';

// Demos mount as client:only islands, which get no prefix from Astro, and useId counts per app: without a prefix
// unique on the page every demo starts at v-0 and its aria references resolve into another demo
let apps = 0;

export default function setup(app: App) {
    app.config.idPrefix ??= `v${apps++}`;
}
