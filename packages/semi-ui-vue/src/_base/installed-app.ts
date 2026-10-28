import { type App, type AppContext, createApp } from 'vue';

// Static APIs (Toast, Notification, Modal.confirm) render outside any tree and read app provides here.
// The last installed app wins.
let installedApp: App | null = null;
let roots = 0;

export function setInstalledApp(app: App | null) {
    installedApp = app;
}

export function getInstalledApp(): App | null {
    return installedApp;
}

/**
 * App context for one static render root. useId numbers per root under idPrefix, so roots need distinct prefixes.
 */
export function rootAppContext(): AppContext {
    const context = installedApp?._context ?? createApp({})._context;
    roots += 1;
    // Prototype, not spread: the dev build's compilerOptions getter warns on read
    return {
        ...context,
        config: Object.create(context.config, {
            idPrefix: { value: `${context.config.idPrefix ?? 'v'}-semi${roots}`, enumerable: true },
        }),
    };
}
