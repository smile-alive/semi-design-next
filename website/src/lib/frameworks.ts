export const frameworks = ['react', 'vue', 'solid'] as const;
export type Framework = (typeof frameworks)[number];

// clientOnly is the renderer name Astro's client:only expects, not always the framework name
export const frameworkDemo = {
    react: { extension: 'react.tsx', language: 'tsx', clientOnly: 'react' },
    vue: { extension: 'vue', language: 'vue', clientOnly: 'vue' },
    solid: { extension: 'solid.tsx', language: 'tsx', clientOnly: 'solid-js' },
} as const satisfies Record<Framework, { extension: string; language: string; clientOnly: string }>;

// except lists page directories relative to website/content (e.g. 'input/select'); those pages use the opposite of mode
export const demoHydration: Record<Framework, { mode: 'only' | 'visible'; except: string[] }> = {
    react: {
        mode: 'visible',
        except: [],
    },

    vue: {
        mode: 'visible',
        except: [],
    },

    solid: {
        mode: 'visible',
        except: [],
    },
};

const hasDemos = (demoNames: readonly string[], framework: Framework) => demoNames.some((name) => name.endsWith(`.${frameworkDemo[framework].extension}`));

export function availableFrameworks(demoNames: readonly string[], declared: unknown, location: string) {
    if (hasDemos(demoNames, 'react')) {
        return frameworks.filter((framework) => hasDemos(demoNames, framework));
    }
    if (!Array.isArray(declared) || declared.length === 0 || declared.some((value) => !frameworks.includes(value)) || new Set(declared).size !== declared.length) {
        throw new Error(`${location}: pages without demos need a nonempty, unique frameworks list`);
    }
    return frameworks.filter((framework) => declared.includes(framework));
}

export function validateFrameworkLocales(availability: ReadonlyMap<string, string>, locales: readonly string[]) {
    for (const [key, enabled] of availability) {
        const directory = key.slice(0, key.lastIndexOf('/'));
        if (locales.some((locale) => availability.get(`${directory}/index.${locale}`) !== enabled)) {
            throw new Error(`${directory}: framework availability must match every locale`);
        }
    }
}
