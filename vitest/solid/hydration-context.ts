// What hydration-setup.ts hands the browser tests through provide(); kept free of solid-js so the Node config and the
// browser tests can both read it
export interface ServerCase {
    html: string;
    // Stringified: provide() only carries serializable values
    errors: string[];
}

export interface SolidSsr {
    // generateHydrationScript() output, which bootstraps _$HY before the case module runs
    script: string;
    cases: Record<string, ServerCase>;
}

declare module 'vitest' {
    interface ProvidedContext {
        solidSsr: SolidSsr;
    }
}
