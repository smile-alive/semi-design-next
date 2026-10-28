<script setup lang="ts">
    import { onActivated, onBeforeUnmount, onDeactivated, onMounted, shallowRef, useTemplateRef } from 'vue';
    import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
    import { resolvePopupContainer } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/_portal/portal.scss';
    import useConfig from '../config-provider/use-config';
    import { useTooltipPopupsContext } from '../tooltip/context';
    import PopupLayerProvider from './popup-layer-provider.vue';
    import useMounted from './use-mounted';

    const props = defineProps<{
        getPopupContainer?: () => HTMLElement | null;
        zIndex?: number;
    }>();

    defineSlots<{ default(props: { inBody: boolean }): unknown }>();

    const config = useConfig();

    // Outside the fullscreen element nothing is shown or clickable, so a popup mounted during fullscreen goes into it.
    // Known limits: chosen once at mount, so a popup mounted before fullscreen stays in the body and one mounted during it
    // stays in the former fullscreen element afterwards, inheriting that ancestor chain's styles; moving it later would
    // drop the focus inside. Upgrade: re-target on show once keepDOM overlays are used across fullscreen.
    let defaultContainer: HTMLElement;

    // KeepAlive leaves teleported nodes at their target; disabling the Teleport moves them back into the cached subtree.
    const active = shallowRef(true);

    // Teleported DOM events do not reach the Vue ancestors, so the enclosing Tooltip must count this layer as inside
    // its popup, or a press in a Modal opened from a Popover reads as a click outside.
    const roots = useTemplateRef('root');

    // getPopupContainer may query a node absent until the parent mounts; Teleport's defer still evaluates `to` in render.
    const mounted = useMounted();

    const prefix = `${BASE_CLASS_PREFIX}-portal`;
    const unregister = useTooltipPopupsContext()?.register(() => roots.value?.[0] ?? null);

    const target = () => {
        const container = resolvePopupContainer(props.getPopupContainer ?? config.value.getPopupContainer, defaultContainer);
        // a fullscreen element is the whole visible page, so an overlay in it covers the page like one in the body
        return { container, inBody: container === defaultContainer || container === container.ownerDocument.body };
    };

    onBeforeUnmount(() => unregister?.());

    onMounted(() => {
        defaultContainer = (document.fullscreenElement as HTMLElement | null) ?? document.body;
    });

    onDeactivated(() => {
        active.value = false;
    });

    onActivated(() => {
        active.value = true;
    });
</script>

<template>
    <template v-if="mounted">
        <template v-for="({ container, inBody }, index) in [target()]" :key="index">
            <Teleport :disabled="!active" :to="container">
                <div ref="root" :class="prefix" :dir="config.direction" :style="inBody ? { zIndex: props.zIndex } : { zIndex: props.zIndex, position: 'static' }">
                    <PopupLayerProvider>
                        <slot :inBody="inBody" />
                    </PopupLayerProvider>
                </div>
            </Teleport>
        </template>
    </template>
</template>
