<script setup lang="ts">
    import { mergeProps } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-foundation/button/constants';
    import { buttonClassList, colorfulFill, isAILoading, paddingSides } from '@fibrae/semi-foundation/button/utils';
    import '@fibrae/semi-foundation/button/button.scss';
    import '@fibrae/semi-foundation/button/icon-button.scss';
    import { IconAILoading } from '@fibrae/semi-icons-vue';
    import type { ElementProps } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes, { hasSlotContent } from '../_base/slot-nodes';
    import SpinIcon from '../spin/icon.vue';
    import type { ButtonProps, ButtonSlots } from './interface';
    import useButtonLooks from './use-button';

    // attrs are bound manually so the loading click guard can be merged ahead of the consumer's own capture listener.
    defineOptions({ inheritAttrs: false, elementType: 'Button' });

    const props = withDefaults(defineProps<ButtonProps & /* @vue-ignore */ ElementProps<'button', keyof ButtonProps>>(), {
        block: () => semiDefault('Button', 'block', false),
        // size, type, theme, disabled and colorful resolve own value -> ButtonGroup -> global default in useButtonLooks;
        // a factory default would make every button look like it was given a value and hide the group's.
        colorful: undefined,
        contentClassName: semiGlobalDefault('Button', 'contentClassName'),
        disabled: undefined,
        htmlType: () => semiDefault('Button', 'htmlType', 'button'),
        iconPosition: () => semiDefault('Button', 'iconPosition', strings.DEFAULT_ICON_POSITION),
        loading: () => semiDefault('Button', 'loading', false),
        noHorizontalPadding: () => semiDefault('Button', 'noHorizontalPadding', false),
        size: undefined,
        theme: undefined,
        type: undefined,
    });

    const slots = defineSlots<ButtonSlots>();

    const looks = useButtonLooks(props, 'Button');

    const prefix = cssClasses.PREFIX;

    const hasText = () => hasSlotContent(slots.default);

    const iconLayout = () => hasSlotContent(slots.icon) || (props.loading && !looks.value.disabled);

    const parts = (): ('icon' | 'text')[] => {
        const order: ('icon' | 'text')[] = props.iconPosition === 'left' ? ['icon', 'text'] : ['text', 'icon'];
        return hasText() ? order : ['icon'];
    };

    const colorfulIcon = () => {
        if (!looks.value.colorful) return undefined;
        const nodes = slotNodes(slots.icon?.() ?? []);
        const fill = colorfulFill(looks.value.theme, looks.value.type, looks.value.disabled);
        return nodes.length === 1 && fill ? { node: nodes[0][0], fill } : undefined;
    };

    const paddingStyle = () => {
        if (!iconLayout()) return undefined;
        return Object.fromEntries(paddingSides(props.noHorizontalPadding).map((side) => [side === 'left' ? 'paddingLeft' : 'paddingRight', 0]));
    };

    // A loading button stays focusable, so its click is stopped in the capture phase (covers .once/.capture/.passive
    // listeners); preventDefault blocks form submit, which pointer-events cannot do for Enter or Space.
    const guardLoadingClick = (event: MouseEvent) => {
        if (!props.loading) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    };
</script>

<template>
    <button
        v-bind="mergeProps({ onClickCapture: guardLoadingClick }, $attrs)"
        :aria-disabled="looks.disabled || props.loading"
        :class="buttonClassList(prefix, looks, { block: props.block, withIcon: iconLayout(), iconOnly: iconLayout() && !hasText(), loading: props.loading && !looks.disabled })"
        :disabled="looks.disabled"
        :style="paddingStyle()"
        :type="props.htmlType"
    >
        <span :class="[`${prefix}-content`, props.contentClassName]" :x-semi-prop="iconLayout() ? undefined : 'children'">
            <template v-if="iconLayout()">
                <template v-for="part in parts()" :key="part">
                    <span
                        v-if="part === 'text'"
                        :class="{
                            [`${prefix}-content-left`]: props.iconPosition === 'right',
                            [`${prefix}-content-right`]: props.iconPosition === 'left',
                        }"
                        x-semi-prop="children"
                    >
                        <slot />
                    </span>
                    <template v-else-if="props.loading && !looks.disabled">
                        <IconAILoading v-if="isAILoading(looks.theme, looks.type, looks.colorful)" :class="`${prefix}-content-loading-icon`" />
                        <SpinIcon v-else />
                    </template>
                    <template v-else>
                        <template v-for="(view, index) in [colorfulIcon()]" :key="index">
                            <component :is="view.node" v-if="view" :fill="view.fill" />
                            <slot v-else name="icon" />
                        </template>
                    </template>
                </template>
            </template>
            <slot v-else />
        </span>
    </button>
</template>
