<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import { isEqual } from 'es-toolkit';
    import BreakpointObserver, { noScreens } from '@fibrae/semi-foundation/config-provider/breakpoint-observer';
    import { inheritConfig, switchesDirection } from '@fibrae/semi-foundation/config-provider/inherit-config';
    import type { ResponsiveMap } from '@fibrae/semi-foundation/config-provider/responsive-types';
    import { defaultResponsiveMap } from '@fibrae/semi-foundation/grid/constants';
    import { getConfigContext, setConfigContext } from './context.js';
    import type { ConfigProviderProps } from './interface.js';

    let { children, ...own }: ConfigProviderProps = $props();

    const outer = getConfigContext();

    let screens = $state.raw(noScreens);
    let lastMap: ResponsiveMap | undefined;
    let mounted = false;

    const inherited = $derived(inheritConfig(own, outer));
    const switches = $derived(switchesDirection(own, outer));

    // Compared by content: a new map literal on every parent update must not re-register the media queries
    const stableMap = $derived.by(() => {
        const map = inherited.responsiveMap;
        if (!isEqual(lastMap, map)) lastMap = map;
        return lastMap;
    });

    const observation = $derived({ responsiveObserve: inherited.responsiveObserve, responsiveMap: stableMap });

    const observer = new BreakpointObserver(
        untrack(() => observation),
        (value) => {
            screens = value;
        }
    );

    setConfigContext({
        get direction() {
            return inherited.direction;
        },
        get locale() {
            return inherited.locale;
        },
        get timeZone() {
            return inherited.timeZone;
        },
        get getPopupContainer() {
            return inherited.getPopupContainer;
        },
        get responsiveObserve() {
            return inherited.responsiveObserve;
        },
        get responsiveMap() {
            return stableMap ?? defaultResponsiveMap;
        },
        get screens() {
            return screens;
        },
        onBreakpoint: observer.subscribe,
    });

    // Children subscribe from their effects, so they must already see the configuration of this update
    $effect.pre(() => {
        observer.sync(observation);
        if (mounted) untrack(() => observer.commit());
    });

    onMount(() => {
        mounted = true;
        observer.commit();
        return () => observer.destroy();
    });
</script>

{#if switches}
    <div dir={inherited.direction}>{@render children?.()}</div>
{:else}
    {@render children?.()}
{/if}
