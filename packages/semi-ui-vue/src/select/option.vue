<script setup lang="ts">
    import { Text, useAttrs } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/select/constants';
    import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
    import { IconTick } from '@fibrae/semi-icons-vue';
    import slotNodes from '../_base/slot-nodes';
    import Highlight from '../highlight';
    import type { SelectOptionBaseProps, SelectOptionProps, SelectOptionSlots } from './interface';

    /**
     * Inside a Select's default slot a `SelectOption` is only read, never rendered: its props and attributes become the
     * option record. The Select and AutoComplete render their rows with it, passing the props below.
     */
    interface OptionRowProps {
        /** The row stands for the empty state; the default slot holds its content */
        empty?: boolean;
        selected?: boolean;
        /** Highlighted by the keyboard or the pointer */
        focused?: boolean;
        /** The row aria-activedescendant points at; AutoComplete marks it aria-selected */
        current?: boolean;
        /** Highlighted in a plain-text label */
        inputValue?: string;
        semiOptionId?: string;
        prefixCls?: string;
    }

    defineOptions({ inheritAttrs: false, elementType: 'Select.Option' });

    const props = withDefaults(defineProps<SelectOptionBaseProps & OptionRowProps>(), {
        value: undefined,
        label: undefined,
        disabled: undefined,
        showTick: undefined,
        empty: undefined,
        selected: undefined,
        focused: undefined,
        current: undefined,
        inputValue: undefined,
        semiOptionId: undefined,
        prefixCls: cssClasses.PREFIX_OPTION,
    });

    const emit = defineEmits<{ select: [option: SelectOptionProps, event: MouseEvent]; mouseenter: [event: MouseEvent] }>();
    const slots = defineSlots<SelectOptionSlots>();
    const attrs = useAttrs();

    const plainText = () => {
        if (!slots.default) return props.label === undefined ? undefined : String(props.label);
        const nodes = slotNodes(slots.default());
        return nodes.length === 1 && nodes[0][0].type === Text ? String(nodes[0][0].children) : undefined;
    };

    const handleClick = (event: MouseEvent) => {
        if (!props.disabled) {
            const { class: _class, style: _style, ...rest } = attrs;
            emit('select', { ...rest, value: props.value, label: props.label }, event);
        }
    };

    const rowClass = () => [
        props.prefixCls,
        {
            [`${props.prefixCls}-disabled`]: props.disabled,
            [`${props.prefixCls}-selected`]: props.selected,
            [`${props.prefixCls}-focused`]: props.focused,
            [`${props.prefixCls}-empty`]: props.empty,
        },
        attrs.class,
    ];
</script>

<template>
    <div v-if="props.empty" :class="rowClass()" x-semi-prop="emptyContent">
        <slot />
    </div>
    <!-- keyboard selection stays on the combobox through aria-activedescendant, so the option takes no focus -->
    <div v-else :id="props.semiOptionId" v-bind="getDataAttr(attrs)" :aria-disabled="props.disabled ? 'true' : 'false'" :aria-selected="props.selected || props.current ? 'true' : 'false'" :class="rowClass()" role="option" :style="attrs.style as never" @click="handleClick" @mouseenter="emit('mouseenter', $event)">
        <div v-if="props.showTick" :class="`${props.prefixCls}-icon`">
            <IconTick />
        </div>
        <template v-for="(text, i) in [plainText()]" :key="i">
            <div v-if="text !== undefined" :class="`${props.prefixCls}-text`">
                <Highlight v-if="props.inputValue" :highlightClassName="`${props.prefixCls}-keyword`" :searchWords="[props.inputValue]" :sourceString="text" />
                <template v-else>{{ text }}</template>
            </div>
            <slot v-else />
        </template>
    </div>
</template>
