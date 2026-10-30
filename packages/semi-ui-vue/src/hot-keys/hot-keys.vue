<script setup lang="ts">
    import { computed, watch } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/hot-keys/constants';
    import HotKeysFoundation, { type HotKeysAdapter } from '@fibrae/semi-foundation/hot-keys/foundation';
    import '@fibrae/semi-foundation/hot-keys/hot-keys.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import { hasSlotContent } from '../_base/slot-nodes';
    import useDidUpdate from '../_base/use-did-update';
    import useFoundation from '../_base/use-foundation';
    import useKeepAliveFoundation from '../_base/use-keep-alive-foundation';
    import type { HotKeysEmits, HotKeysProps, HotKeysSlots, HotKeysState } from './interface';

    type Foundation = HotKeysFoundation<HotKeysProps, HotKeysState>;
    type Adapter = HotKeysAdapter<HotKeysProps, HotKeysState>;

    const props = withDefaults(defineProps<HotKeysProps & /* @vue-ignore */ ElementProps<'div', keyof HotKeysProps | EmitHandlers<HotKeysEmits>>>(), {
        content: semiGlobalDefault('HotKeys', 'content'),
        preventDefault: () => semiDefault('HotKeys', 'preventDefault', false),
        getListenerTarget: undefined,
    });

    const emit = defineEmits<HotKeysEmits>();
    const slots = defineSlots<HotKeysSlots>();

    const semi = useSemiGlobal();

    const prefixCls = cssClasses.PREFIX;
    const listenerTarget = computed(() => props.getListenerTarget ?? readSemiDefault(semi, 'HotKeys', 'getListenerTarget'));

    const { foundation } = useFoundation<Foundation, Adapter, HotKeysProps, HotKeysState>(
        HotKeysFoundation,
        props,
        () => ({}),
        () => ({ notifyHotKey: (event) => emit('hotKey', event) }),
        { props: { getListenerTarget: () => listenerTarget.value } }
    );

    // While cached, a target change must not bind the listener.
    const { isDeactivated } = useKeepAliveFoundation(foundation);

    // Known limit: custom content runs the default slot twice (root check and outlet). Upgrade: always render the root
    // and hide it with CSS when empty.
    const hasRoot = () => !slots.default || hasSlotContent(slots.default);

    watch(
        () => listenerTarget.value,
        () => {
            if (!isDeactivated()) {
                foundation.handleTargetChange();
            }
        },
        { flush: 'post' }
    );

    // compared item by item: an inline array is new on every parent render, and an in-place change keeps identity
    useDidUpdate(
        () => [...props.hotKeys],
        foundation.handleHotKeysChange,
        (a, b) => a.length === b.length && a.every((key, index) => key === b[index])
    );
</script>

<template>
    <div v-if="hasRoot()" :class="prefixCls">
        <slot v-if="$slots.default" />
        <template v-else>
            <span v-for="(key, index) in props.content ?? props.hotKeys" :key="index">
                <span v-if="index > 0" :class="`${prefixCls}-split`">+</span>
                <span :class="`${prefixCls}-content`">{{ key }}</span>
            </span>
        </template>
    </div>
</template>
