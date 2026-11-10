<script setup lang="ts">
    import { computed, onMounted, onUpdated, useAttrs, useTemplateRef } from 'vue';
    import { cssClasses, numbers } from '@fibrae/semi-foundation/components/backtop/constants';
    import BackTopFoundation, { type BackTopAdapter } from '@fibrae/semi-foundation/components/backtop/foundation';
    import '@fibrae/semi-foundation/components/backtop/backtop.scss';
    import { IconBackTop } from '@fibrae/semi-icons-vue';
    import { type ElementProps, type EmitHandlers, semiDefault, readSemiDefault, semiGlobalDefault, useSemiGlobal, useFoundation, useKeepAliveFoundation } from '../../base/index';
    import { hasSlotContent } from '../../utils/index';
    import FloatButton from '../float-button';
    import useLocale from '../locale/use-locale';
    import type { BackTopEmits, BackTopProps, BackTopSlots, BackTopState } from './interface';

    type Foundation = BackTopFoundation<BackTopProps, MouseEvent>;
    type Adapter = BackTopAdapter<BackTopProps, MouseEvent>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<BackTopProps & /* @vue-ignore */ ElementProps<'button', keyof BackTopProps | EmitHandlers<BackTopEmits> | 'type' | 'form' | 'formAction' | 'formEncType' | 'formMethod' | 'formNoValidate' | 'formTarget'>>(), {
        badge: semiGlobalDefault('BackTop', 'badge'),
        // FloatButton owns the defaults of these; a fallback here would hide its own global defaults.
        colorful: semiGlobalDefault('BackTop', 'colorful'),
        duration: () => semiDefault('BackTop', 'duration', numbers.DEFAULT_DURATION),
        shape: semiGlobalDefault('BackTop', 'shape'),
        size: semiGlobalDefault('BackTop', 'size'),
        // Function-typed props cannot take a factory default; the global default is read in `target`.
        target: undefined,
        visibilityHeight: () => semiDefault('BackTop', 'visibilityHeight', numbers.DEFAULT_VISIBILITY_HEIGHT),
    });

    // Declared so the foundation throttles the click and emits it with the start of the scroll, which attrs on the button would not.
    const emit = defineEmits<BackTopEmits>();
    const slots = defineSlots<BackTopSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const i18n = useLocale('BackTop');

    const button = useTemplateRef('button');

    const prefix = cssClasses.PREFIX;
    const target = computed(() => props.target ?? readSemiDefault(semi, 'BackTop', 'target'));

    const { foundation, state } = useFoundation<Foundation, Adapter, BackTopProps, BackTopState>(
        BackTopFoundation,
        props,
        () => BackTopFoundation.getInitialState(),
        () => ({
            notifyClick: (event) => emit('click', event),
        }),
        { props: { target: () => target.value } }
    );

    // Slots and attrs are not reactive, so the name is decided while rendering. Static children are the visible name,
    // and a different default would contradict them.
    const ariaLabel = () => (attrs['aria-label'] as string | undefined) ?? (hasSlotContent(slots.default) ? undefined : i18n.value.locale.backToTop);

    // Checks the rendered button instead of the slot: calling a slot in a hook makes Vue warn, and the built-in icon
    // and badge contain nothing interactive
    const warnInteractive = () => BackTopFoundation.warnInteractiveChildren(button.value?.$el);

    useKeepAliveFoundation(foundation);

    onMounted(warnInteractive);
    onUpdated(warnInteractive);
</script>

<template>
    <FloatButton v-if="state.visible" ref="button" v-bind="$attrs" :aria-label="ariaLabel()" :badge="props.badge" :class="prefix" :colorful="props.colorful" :shape="props.shape" :size="props.size" x-semi-prop="children" @click="foundation.onClick">
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
