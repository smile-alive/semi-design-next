import { addVitePlugin, defineNuxtModule } from '@nuxt/kit';
import type { NuxtConfig, NuxtModule } from 'nuxt/schema';
import semi, { type SemiVitePluginOptions } from '@fibrae/semi-vite-plugin';

export type ModuleOptions = SemiVitePluginOptions;

// Annotated because the inferred type names a nested @nuxt/schema that declaration emit cannot reference
const semiNuxt: NuxtModule<ModuleOptions, ModuleOptions, false> = defineNuxtModule<ModuleOptions>({
    meta: { name: '@fibrae/semi-nuxt', configKey: 'semi' },
    setup(options, nuxt) {
        // Nuxt attributes all CSS in a page's client chunk to the page and filters inlineStyles per component, not per stylesheet,
        // so the Semi CSS bundled into a page's chunk would be inlined while Nuxt also links it. A resolved boolean is the user's
        // choice (.nuxtrc included) or Nuxt's own off switch; a function may be Nuxt's default, so the raw layers and the loadNuxt overrides (used by
        // @nuxt/test-utils, left out of `_layers`) tell whether the user wrote it, under the current or the legacy key
        // shortcut: a function set by an earlier module's code is overridden, check module-set values if Nuxt starts exposing them
        const { overrides } = nuxt.options._loadOptions as { overrides?: NuxtConfig };
        const configs = [overrides, ...nuxt.options._layers.map((layer) => layer.config)];
        const userFunction = configs.some((config) => config?.features?.inlineStyles != null || (config?.experimental != null && 'inlineSSRStyles' in config.experimental));
        if (typeof nuxt.options.features.inlineStyles === 'function' && !userFunction) {
            nuxt.options.features.inlineStyles = false;
        }
        addVitePlugin(semi(options));
    },
});

export default semiNuxt;
