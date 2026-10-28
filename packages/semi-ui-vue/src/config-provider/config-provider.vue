<script setup lang="ts">
    import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
    import { isEqual } from 'es-toolkit';
    import BreakpointObserver, { noScreens } from '@fibrae/semi-foundation/config-provider/breakpoint-observer';
    import { inheritConfig, switchesDirection } from '@fibrae/semi-foundation/config-provider/inherit-config';
    import { defaultResponsiveMap } from '@fibrae/semi-foundation/grid/constants';
    import shallowEqualObjects from '@fibrae/semi-foundation/utils/shallow-equal-objects';
    import { provideConfigContext } from './context';
    import type { ConfigProviderProps, ConfigProviderSlots, ContextValue } from './interface';
    import useConfig from './use-config';

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<ConfigProviderProps>(), {
        responsiveObserve: undefined,
        getPopupContainer: undefined,
    });

    defineSlots<ConfigProviderSlots>();

    const outer = useConfig();

    const screens = shallowRef(noScreens);

    const switches = computed(() => switchesDirection(props, outer.value));
    const inherited = computed(() => inheritConfig(props, outer.value));
    const resolvedDirection = computed(() => inherited.value.direction);
    const observe = computed(() => inherited.value.responsiveObserve);
    const givenMap = computed(() => inherited.value.responsiveMap);

    const stableMap = shallowRef(givenMap.value);

    const observation = computed(() => ({ responsiveObserve: observe.value, responsiveMap: stableMap.value }));

    const observer = new BreakpointObserver(observation.value, (value) => {
        screens.value = value;
    });

    const value = computed<ContextValue>((previous) => {
        const next: ContextValue = {
            direction: resolvedDirection.value,
            locale: inherited.value.locale,
            timeZone: inherited.value.timeZone,
            getPopupContainer: inherited.value.getPopupContainer,
            responsiveObserve: observe.value,
            responsiveMap: stableMap.value || defaultResponsiveMap,
            screens: screens.value,
            onBreakpoint: observer.subscribe,
        };
        return previous && shallowEqualObjects(previous, next) ? previous : next;
    });

    provideConfigContext(value);

    watch(
        givenMap,
        (map) => {
            if (!isEqual(stableMap.value, map)) stableMap.value = map;
        },
        { flush: 'sync' }
    );

    // Child subscriptions must see the new configuration before their mounted/updated hooks run.
    watch(observation, (value) => observer.sync(value), { flush: 'sync' });
    watch(observation, () => observer.commit(), { flush: 'pre' });

    onMounted(() => observer.commit());
    onBeforeUnmount(() => observer.destroy());
</script>

<template>
    <div v-if="switches" :dir="resolvedDirection">
        <slot />
    </div>
    <slot v-else />
</template>
