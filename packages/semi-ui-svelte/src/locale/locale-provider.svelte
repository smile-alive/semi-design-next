<script lang="ts">
    import { getLocaleContext, setLocaleContext } from './context.js';
    import type { LocaleProviderProps } from './interface.js';

    let { locale, children }: LocaleProviderProps = $props();

    const inherited = getLocaleContext();

    setLocaleContext({
        get locale() {
            return locale ?? inherited?.locale ?? null;
        },
    });
</script>

{@render children?.()}
