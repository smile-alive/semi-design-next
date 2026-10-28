<script setup lang="ts">
    import { watch, type StyleValue } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
    import { IconCopy, IconTick } from '@fibrae/semi-icons-vue';
    import slotNodes from '../_base/slot-nodes';
    import useCopied from '../_base/use-copied';
    import useLocale from '../locale/use-locale';
    import Tooltip from '../tooltip/tooltip.vue';
    import type { TypographyCopySlots, TypographyNumeralEmits } from './interface';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<{ content: string; duration: number }>();

    // copiedChange: the copy action swapped to or from the copied tip, whose width differs, so the text beside it is measured again
    const emit = defineEmits<TypographyNumeralEmits & { copiedChange: [] }>();
    const slots = defineSlots<TypographyCopySlots>();

    const locale = useLocale('Typography');

    const [copied, copyText] = useCopied(() => props.duration * 1000);

    const prefix = cssClasses.PREFIX;

    const copy = (e: MouseEvent) => {
        void copyText(props.content).then((res) => emit('copy', e, props.content, res));
    };

    // One button for both states keeps keyboard focus on it across the swap; while copied it does nothing.
    const handleClick = (e: MouseEvent) => {
        if (!copied.value) copy(e);
    };

    const copyName = () => {
        const nodes = slotNodes(slots.copyIcon?.() ?? []);
        const label = nodes.length === 1 ? nodes[0][0].props?.['aria-label'] : undefined;
        return typeof label === 'string' ? label : locale.value.locale.copy;
    };

    // an element tip may have no text (an icon), so it is named; a text tip names the button by itself
    const copiedName = () => {
        const nodes = slotNodes(slots.copySuccessTip?.() ?? []);
        if (nodes.length !== 1 || typeof nodes[0][0].type === 'symbol') return undefined;
        const label = nodes[0][0].props?.['aria-label'];
        return typeof label === 'string' ? label : locale.value.locale.copied;
    };

    watch(copied, () => emit('copiedChange'));
</script>

<template>
    <span v-if="$slots.copyAction">
        <slot
            :config="{
                content: props.content,
                duration: props.duration,
                class: $attrs.class,
                style: $attrs.style as StyleValue,
            }"
            :copied="copied"
            :copy="copy"
            name="copyAction"
        />
    </span>
    <span v-else :class="[$attrs.class, copied ? `${prefix}-action-copied` : `${prefix}-action-copy`]" :style="$attrs.style as StyleValue">
        <Tooltip :condition="!copied">
            <button :aria-label="copied ? copiedName() : copyName()" :class="[`${prefix}-action-btn`, { [`${prefix}-action-copy-icon`]: !copied && !$slots.copyIcon }]" type="button" @click="handleClick">
                <slot v-if="copied" name="copySuccessTip">
                    <span><IconTick />{{ locale.locale.copied }}</span>
                </slot>
                <slot v-else name="copyIcon">
                    <IconCopy />
                </slot>
            </button>
            <template #content>
                <slot name="copyTip">{{ locale.locale.copy }}</slot>
            </template>
        </Tooltip>
    </span>
</template>
