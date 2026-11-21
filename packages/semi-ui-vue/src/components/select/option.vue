<script setup lang="ts">
    import { Text, useAttrs, type ClassValue, type StyleValue } from 'vue';
    import { cssClasses, type SelectPart } from '@fibrae/semi-foundation/components/select/constants';
    import { getDataAttr } from '@fibrae/semi-foundation/utils';
    import { IconTick } from '@fibrae/semi-icons-vue';
    import { slotNodes } from '../../utils/index';
    import Highlight from '../highlight';
    import { useOptionPrefixContext } from './context';
    import type { SelectOptionBaseProps, SelectOptionProps, SelectOptionSlots } from './interface';

    /**
     * Inside a Select's default slot a `SelectOption` is only read, never rendered: its props and attributes become the
     * option record. The Select and AutoComplete render their rows with it, passing the props below.
     */
    interface OptionRowProps {
        empty?: boolean;
        selected?: boolean;
        focused?: boolean;
        /** The row aria-activedescendant points at; AutoComplete marks it aria-selected */
        current?: boolean;
        inputValue?: string;
        semiOptionId?: string;
        /** The `item*` parts of the parent, applied before the option's own */
        parentClassNames?: Partial<Record<SelectPart, ClassValue>>;
        parentStyles?: Partial<Record<SelectPart, StyleValue>>;
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
        classNames: undefined,
        styles: undefined,
        parentClassNames: undefined,
        parentStyles: undefined,
    });

    const emit = defineEmits<{ select: [option: SelectOptionProps, event: MouseEvent]; mouseenter: [event: MouseEvent] }>();
    const slots = defineSlots<SelectOptionSlots>();
    const attrs = useAttrs();

    const prefixCls = useOptionPrefixContext() ?? cssClasses.PREFIX_OPTION;

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
        prefixCls,
        {
            [`${prefixCls}-disabled`]: props.disabled,
            [`${prefixCls}-selected`]: props.selected,
            [`${prefixCls}-focused`]: props.focused,
            [`${prefixCls}-empty`]: props.empty,
        },
        props.parentClassNames?.item,
        attrs.class,
    ];
</script>

<template>
    <div v-if="props.empty" :class="rowClass()" :style="$attrs.style as never" x-semi-prop="emptyContent">
        <slot />
    </div>
    <!-- keyboard selection stays on the combobox through aria-activedescendant, so the option takes no focus -->
    <div
        v-else
        :id="props.semiOptionId"
        v-bind="getDataAttr($attrs)"
        :aria-disabled="props.disabled ? 'true' : 'false'"
        :aria-selected="props.selected || props.current ? 'true' : 'false'"
        :class="rowClass()"
        role="option"
        :style="[props.parentStyles?.item, $attrs.style as never]"
        @click="handleClick"
        @mouseenter="emit('mouseenter', $event)"
    >
        <div v-if="props.showTick" :class="[`${prefixCls}-icon`, props.parentClassNames?.itemIcon, props.classNames?.icon]" :style="[props.parentStyles?.itemIcon, props.styles?.icon]">
            <IconTick />
        </div>
        <template v-for="(text, i) in [plainText()]" :key="i">
            <div v-if="text !== undefined" :class="[`${prefixCls}-text`, props.parentClassNames?.itemContent, props.classNames?.content]" :style="[props.parentStyles?.itemContent, props.styles?.content]">
                <Highlight v-if="props.inputValue" :classNames="{ highlight: `${prefixCls}-keyword` }" :searchWords="[props.inputValue]" :sourceString="text" />
                <template v-else>{{ text }}</template>
            </div>
            <slot v-else />
        </template>
    </div>
</template>
