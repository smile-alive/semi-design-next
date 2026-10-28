<script setup lang="ts">
    import { computed, onBeforeUnmount, onMounted, onUpdated, useAttrs, useTemplateRef, watch } from 'vue';
    import { throttle } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/backtop/constants';
    import BackTopFoundation, { type BackTopAdapter } from '@fibrae/semi-foundation/backtop/foundation';
    import '@fibrae/semi-foundation/backtop/backtop.scss';
    import { IconBackTop } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import { hasSlotContent } from '../_base/slot-nodes';
    import { getWindow } from '../_base/use-event-listener';
    import useFoundation from '../_base/use-foundation';
    import useKeepAliveFoundation from '../_base/use-keep-alive-foundation';
    import FloatButton from '../float-button';
    import useLocale from '../locale/use-locale';
    import type { BackTopEmits, BackTopProps, BackTopSlots, BackTopState } from './interface';

    type Foundation = BackTopFoundation<BackTopProps, BackTopState, MouseEvent>;
    type Adapter = BackTopAdapter<BackTopProps, BackTopState, MouseEvent>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<BackTopProps & /* @vue-ignore */ ElementProps<'button', keyof BackTopProps | EmitHandlers<BackTopEmits> | 'type' | 'form' | 'formAction' | 'formEncType' | 'formMethod' | 'formNoValidate' | 'formTarget'>>(), {
        badge: semiGlobalDefault('BackTop', 'badge'),
        // FloatButton owns the defaults of these; a fallback here would hide its own global defaults.
        colorful: semiGlobalDefault('BackTop', 'colorful'),
        duration: () => semiDefault('BackTop', 'duration', 450),
        shape: semiGlobalDefault('BackTop', 'shape'),
        size: semiGlobalDefault('BackTop', 'size'),
        // Function-typed props cannot take a factory default; the global default is read in `target`.
        target: undefined,
        visibilityHeight: () => semiDefault('BackTop', 'visibilityHeight', 400),
    });

    // Declared so the click is throttled and follows the start of the scroll, which attrs on the button would not.
    const emit = defineEmits<BackTopEmits>();
    const slots = defineSlots<BackTopSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const i18n = useLocale('BackTop');

    const button = useTemplateRef('button');

    const prefix = cssClasses.PREFIX;
    const target = computed(() => props.target ?? readSemiDefault(semi, 'BackTop', 'target', getWindow));

    const { foundation, state } = useFoundation<Foundation, Adapter, BackTopProps, BackTopState>(
        BackTopFoundation,
        props,
        () => ({ visible: false }),
        (base) => ({
            updateVisible: (visible) => base.setState({ visible }),
            notifyClick: (event) => emit('click', event),
        }),
        { props: { target: () => target.value } }
    );

    // While cached, a target change must not bind the scroll listener.
    const { isDeactivated } = useKeepAliveFoundation(foundation);

    const throttledClick = computed(() => throttle((event: MouseEvent) => foundation.onClick(event), props.duration));

    // Slots and attrs are not reactive, so the name is decided while rendering. Static children are the visible name,
    // and a different default would contradict them.
    const ariaLabel = () => (attrs['aria-label'] as string | undefined) ?? (hasSlotContent(slots.default) ? undefined : i18n.value.locale.backToTop);

    const warnInteractive = () => {
        if (hasSlotContent(slots.default)) {
            BackTopFoundation.warnInteractiveChildren(button.value?.$el);
        }
    };

    // The function itself is the source: calling it here would read the window during setup, which SSR does not have.
    watch(
        () => target.value,
        () => {
            if (!isDeactivated()) {
                foundation.handleTargetChange();
            }
        },
        { flush: 'post' }
    );

    watch(throttledClick, (_next, previous) => previous.cancel());

    onBeforeUnmount(() => throttledClick.value.cancel());
    onMounted(warnInteractive);
    onUpdated(warnInteractive);
</script>

<template>
    <FloatButton v-if="state.visible" ref="button" v-bind="$attrs" :aria-label="ariaLabel()" :badge="props.badge" :class="prefix" :colorful="props.colorful" :shape="props.shape" :size="props.size" x-semi-prop="children" @click="throttledClick($event)">
        <template #icon>
            <slot v-if="hasSlotContent(slots.default)" />
            <slot v-else name="icon">
                <IconBackTop />
            </slot>
        </template>
        <template v-if="$slots.badgeCount" #badgeCount>
            <slot name="badgeCount" />
        </template>
    </FloatButton>
</template>
