<script setup lang="ts">
    import { Text, useAttrs } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/select/constants';
    import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
    import { IconTick } from '@fibrae/semi-icons-vue';
    import slotNodes from '../../utils/slot-nodes';
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
        attrs.class,
    ];
</script>

<template>
    <div v-if="props.empty" :class="rowClass()" x-semi-prop="emptyContent">
        <slot />
    </div>
    <!-- keyboard selection stays on the combobox through aria-activedescendant, so the option takes no focus -->
    <div v-else :id="props.semiOptionId" v-bind="getDataAttr(attrs)" :aria-disabled="props.disabled ? 'true' : 'false'" :aria-selected="props.selected || props.current ? 'true' : 'false'" :class="rowClass()" role="option" :style="attrs.style as never" @click="handleClick" @mouseenter="emit('mouseenter', $event)">
        <div v-if="props.showTick" :class="`${prefixCls}-icon`">
            <IconTick />
        </div>
        <template v-for="(text, i) in [plainText()]" :key="i">
            <div v-if="text !== undefined" :class="`${prefixCls}-text`">
                <Highlight v-if="props.inputValue" :highlightClassName="`${prefixCls}-keyword`" :searchWords="[props.inputValue]" :sourceString="text" />
                <template v-else>{{ text }}</template>
            </div>
            <slot v-else />
        </template>
    </div>
</template>
