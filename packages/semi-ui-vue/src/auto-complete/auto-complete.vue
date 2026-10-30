<script setup lang="ts" generic="T extends AutoCompleteItems = AutoCompleteItems">
    import { computed, onDeactivated, useAttrs, useId, useTemplateRef, watch } from 'vue';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/auto-complete/constants';
    import AutoCompleteFoundation, { type AutoCompleteAdapter, type AutoCompleteBaseProps, type StateOptionItem } from '@fibrae/semi-foundation/auto-complete/foundation';
    import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
    import { isInnerControlKey } from '@fibrae/semi-foundation/utils/a11y';
    import { centerInScroller, toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
    import '@fibrae/semi-foundation/auto-complete/auto-complete.scss';
    import { splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import slotKind from '../_base/slot-kind';
    import useClickOutside from '../_base/use-click-outside';
    import useDidUpdate from '../_base/use-did-update';
    import useFoundation from '../_base/use-foundation';
    import useConfig from '../config-provider/use-config';
    import Input from '../input';
    import { provideInputGroupContext } from '../input/context';
    import { keepsTypedValue } from '../input/model-modifiers';
    import useGroupLooks from '../input/use-group-looks';
    import Popover from '../popover';
    import SelectOption from '../select/option.vue';
    import Spin from '../spin';
    import { useNestedPopups } from '../tooltip/context';
    import type { AutoCompleteDataItem, AutoCompleteEmits, AutoCompleteHandle, AutoCompleteItems, AutoCompleteProps, AutoCompleteSlots, AutoCompleteTriggerSlotProps } from './interface';

    interface AutoCompleteState {
        inputValue?: string | number;
        options: StateOptionItem[];
        visible: boolean;
        focusIndex: number;
        selection: Map<unknown, AutoCompleteDataItem>;
    }

    type Foundation = AutoCompleteFoundation<AutoCompleteBaseProps, AutoCompleteState, FocusEvent>;
    type Adapter = AutoCompleteAdapter<AutoCompleteBaseProps, AutoCompleteState, FocusEvent>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<AutoCompleteProps<T> & /* @vue-ignore */ ElementProps<'div', keyof AutoCompleteProps<T> | EmitHandlers<AutoCompleteEmits>>>(), {
        modelValue: undefined,
        modelModifiers: undefined,
        defaultValue: semiGlobalDefault('AutoComplete', 'defaultValue'),
        data: () => semiDefault('AutoComplete', 'data', []) as T[],
        autofocus: () => semiDefault('AutoComplete', 'autofocus', false),
        autoAdjustOverflow: semiGlobalDefault('AutoComplete', 'autoAdjustOverflow'),
        defaultActiveFirstOption: () => semiDefault('AutoComplete', 'defaultActiveFirstOption', false),
        defaultOpen: semiGlobalDefault('AutoComplete', 'defaultOpen'),
        // size and disabled resolve own value -> InputGroup -> global default in useGroupLooks
        disabled: undefined,
        dropdownClassName: semiGlobalDefault('AutoComplete', 'dropdownClassName'),
        dropdownMatchSelectWidth: () => semiDefault('AutoComplete', 'dropdownMatchSelectWidth', true),
        dropdownStyle: semiGlobalDefault('AutoComplete', 'dropdownStyle'),
        // A global id would repeat on every instance.
        insetLabelId: undefined,
        loading: () => semiDefault('AutoComplete', 'loading', false),
        maxHeight: () => semiDefault('AutoComplete', 'maxHeight', 300),
        motion: () => semiDefault('AutoComplete', 'motion', true),
        selectWithObject: () => semiDefault('AutoComplete', 'selectWithObject', false),
        placeholder: semiGlobalDefault('AutoComplete', 'placeholder'),
        position: semiGlobalDefault('AutoComplete', 'position'),
        renderSelectedItem: undefined,
        showClear: () => semiDefault('AutoComplete', 'showClear', false),
        size: undefined,
        stopPropagation: () => semiDefault('AutoComplete', 'stopPropagation', true),
        validateStatus: () => semiDefault('AutoComplete', 'validateStatus', 'default'),
    });

    const emit = defineEmits<AutoCompleteEmits>();
    const slots = defineSlots<AutoCompleteSlots<T>>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const config = useConfig();

    const root = useTemplateRef('root');
    const listbox = useTemplateRef('listbox');
    const listId = useId();
    const controlKeys = new Set(['id', 'name', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-label', 'aria-labelledby', 'aria-required']);

    const looks = useGroupLooks('AutoComplete', props, { size: 'default' });

    const prefix = cssClasses.PREFIX;
    const position = computed(() => props.position ?? (config.value.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'));
    const renderSelectedItem = computed(() => props.renderSelectedItem ?? readSemiDefault(semi, 'AutoComplete', 'renderSelectedItem'));

    const { foundation, state } = useFoundation<Foundation, Adapter, AutoCompleteBaseProps, AutoCompleteState>(
        AutoCompleteFoundation,
        props as AutoCompleteBaseProps,
        (view) => AutoCompleteFoundation.getInitialState(view),
        (base) => ({
            updateFocusIndex: (focusIndex) => base.setState({ focusIndex }),
            updateScrollTop: (index) => {
                // the rows are the listbox's direct children
                const list = listbox.value;
                const destNode = list?.children[index] as HTMLElement | undefined;
                if (list && destNode) {
                    centerInScroller(destNode, list);
                }
            },
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            toggleListVisible: (visible) => base.setState({ visible }),
            updateOptionList: (options) => base.setState({ options }),
            updateSelection: (selection) => base.setState({ selection }),
            notifySearch: (inputValue) => emit('search', inputValue),
            notifyChange: (value) => {
                emit('update:modelValue', value);
                emit('change', value);
            },
            notifySelect: (option) => emit('select', option),
            notifyDropdownVisibleChange: (visible) => emit('dropdownVisibleChange', visible),
            notifyClear: () => emit('clear'),
            notifyFocus: (event) => emit('focus', event as FocusEvent),
            notifyBlur: (event) => emit('blur', event as FocusEvent),
            notifyKeyDown: (event) => emit('keydown', event),
        }),
        {
            props: {
                disabled: () => looks.disabled,
                value: () => props.modelValue,
                onSelectWithObject: () => props.selectWithObject,
                renderSelectedItem: () => renderSelectedItem.value as AutoCompleteBaseProps['renderSelectedItem'],
            },
        }
    );

    const visibleOptions = computed(() => state.value.options.filter((option) => option.show));

    // the Input inside is part of this control, not a member of the group
    provideInputGroupContext(undefined);

    // Typing re-renders the Input (the list opens and filters), which would write a trimmed or numbered model back over
    // the typed text, so the typed text stays while it normalises to the model.
    const shownValue = () => {
        const { inputValue } = state.value;
        if (props.modelValue === undefined || keepsTypedValue(String(inputValue ?? ''), props.modelValue, props.modelModifiers)) {
            return inputValue;
        }
        return props.modelValue;
    };

    const optionId = (index: number) => `${listId}-option-${index}`;

    // the spinner replaces the options while loading, and a stale focusIndex can point past a shorter list
    const activeDescendant = computed(() => {
        const { visible, focusIndex } = state.value;
        return visible && !props.loading && focusIndex !== -1 && focusIndex < visibleOptions.value.length ? optionId(focusIndex) : undefined;
    });

    const isControlKey = (key: string) => controlKeys.has(key);

    const inputId = () => (attrs.id as string | undefined) ?? `${listId}-input`;

    // Tooltip gives a trigger without a tabindex 0; only the input inside takes the focus
    const rootAttrs = () => ({
        ...splitControlAttrs(attrs, isControlKey).root,
        // a custom trigger has no input for a label's `for`, so the id stays on the root
        id: slots.trigger ? (attrs.id as string | undefined) : undefined,
        tabindex: -1,
    });

    // A rendered inset label names the combobox and the listbox, so it needs an id even when the caller gives none; the
    // condition is Input's own for rendering it
    const insetLabelShown = () => !slots.trigger && !slotKind(slots.prefix) && Boolean(slotKind(slots.insetLabel));

    const prefixId = () => props.insetLabelId ?? (insetLabelShown() ? `${listId}-inset-label` : undefined);

    // The listbox binds it too: the combobox's name source, never the input itself, whose typed value accname would read
    const nameAttrs = () => comboboxName(attrs['aria-labelledby'] as string | undefined, attrs['aria-label'] as string | undefined, insetLabelShown() ? prefixId() : undefined, undefined);

    const inputAttrs = () => ({ ...splitControlAttrs(attrs, isControlKey).control, ...nameAttrs() });

    const triggerSlotProps = (): AutoCompleteTriggerSlotProps<T> => {
        const { id: _id, name: _name, ...controlAttrs } = splitControlAttrs(attrs, isControlKey).control;
        return {
            value: [...state.value.selection.values()],
            inputValue: shownValue(),
            placeholder: props.placeholder,
            disabled: looks.disabled,
            autofocus: props.autofocus,
            size: looks.size,
            validateStatus: props.validateStatus,
            showClear: props.showClear,
            insetLabelId: props.insetLabelId,
            onChange: foundation.handleSearch,
            onClear: foundation.handleClear,
            onFocus: foundation.handleFocus,
            onBlur: foundation.handleBlur,
            controlAttrs,
            componentProps: { ...props, ...looks },
        };
    };

    const handleSearch = (value: string) => foundation.handleSearch(value);

    const handleKeydown = (event: KeyboardEvent) => {
        // a control inside the trigger (the clear button, a custom trigger's button) keeps its own keys
        if (isInnerControlKey(event)) {
            emit('keydown', event);
        } else {
            foundation.handleKeyDown(event);
        }
    };

    // A snapshot of the items, so an array changed in place (push, an edited field) is noticed as well; the items are
    // flat data, nodes go in the item slot.
    useDidUpdate(
        () => props.data.map((item) => (typeof item === 'object' ? { ...item } : item)),
        () => foundation.handleDataChange(props.data),
        isEqual,
        'pre'
    );

    watch(() => props.modelValue, foundation.handleValueChange);

    useClickOutside(
        [root, listbox],
        (event) => {
            // without a rendered list there is nothing to close
            if (listbox.value) {
                foundation.handleClickOutside(event);
            }
        },
        () => state.value.visible,
        useNestedPopups()
    );

    // The list follows the foundation state, which a cached KeepAlive subtree would keep open
    onDeactivated(foundation.close);

    defineExpose<AutoCompleteHandle>({
        get nativeElement() {
            return root.value;
        },
    });
</script>

<template>
    <!-- the listbox inside is the combobox's popup; the arrow keys move the highlight through aria-activedescendant, never the focus into the list -->
    <Popover
        :autoAdjustOverflow="props.autoAdjustOverflow"
        disableArrowKeyDown
        :motion="props.motion"
        :position="position"
        role="presentation"
        :stopPropagation="props.stopPropagation"
        :style="props.dropdownMatchSelectWidth ? { minWidth: 'var(--semi-tooltip-trigger-width)' } : undefined"
        trigger="custom"
        :visible="state.visible"
    >
        <div
            ref="root"
            v-bind="rootAttrs()"
            :class="
                $slots.trigger
                    ? []
                    : [
                          prefix,
                          {
                              [`${prefix}-disabled`]: looks.disabled,
                          },
                      ]
            "
            @click="foundation.handleInputClick"
            @keydown="handleKeydown"
        >
            <slot v-if="$slots.trigger" name="trigger" v-bind="triggerSlotProps()" />
            <Input
                v-else
                v-bind="inputAttrs()"
                :id="inputId()"
                :aria-activedescendant="activeDescendant"
                aria-autocomplete="list"
                :aria-controls="listId"
                :aria-expanded="state.visible"
                aria-haspopup="listbox"
                :autofocus="props.autofocus"
                :disabled="looks.disabled"
                :insetLabelId="prefixId()"
                :modelValue="shownValue()"
                :placeholder="props.placeholder"
                role="combobox"
                :showClear="props.showClear"
                :size="looks.size"
                :validateStatus="props.validateStatus"
                @blur="foundation.handleBlur"
                @change="handleSearch"
                @clear="foundation.handleClear"
                @focus="foundation.handleFocus"
            >
                <template v-if="$slots.prefix" #prefix>
                    <slot name="prefix" />
                </template>
                <template v-if="$slots.suffix" #suffix>
                    <slot name="suffix" />
                </template>
                <template v-if="$slots.insetLabel" #insetLabel>
                    <slot name="insetLabel" />
                </template>
                <template v-if="$slots.clearIcon" #clearIcon>
                    <slot name="clearIcon" />
                </template>
            </Input>
        </div>
        <template #content>
            <div :id="listId" ref="listbox" v-bind="nameAttrs()" :class="[`${prefix}-option-list`, props.dropdownClassName]" role="listbox" :style="[{ maxHeight: toCssLength(props.maxHeight) }, props.dropdownStyle]" @mousedown.prevent>
                <div v-if="props.loading" :class="`${prefix}-loading-wrapper`">
                    <Spin />
                </div>
                <slot v-else-if="state.options.length === 0" name="emptyContent" />
                <template v-else>
                    <!-- item fields that share a name with the row's own props stay out: only class, style and data-* go along -->
                    <SelectOption
                        v-for="(option, index) in visibleOptions"
                        :key="option.key ?? `${option.label}${option.value}${index}`"
                        v-bind="{
                            ...getDataAttr(option),
                            class: option.class,
                            style: option.style,
                        }"
                        :current="index === state.focusIndex"
                        :disabled="option.disabled"
                        :focused="index === state.focusIndex"
                        :label="option.label ?? option.value"
                        :prefixCls="cssClasses.PREFIX_OPTION"
                        :semiOptionId="optionId(index)"
                        :showTick="false"
                        :value="option.value"
                        @mouseenter="foundation.handleOptionMouseEnter(index)"
                        @select="foundation.handleSelect(option, index)"
                    >
                        <slot :index="index" :item="option._source as T" name="item">{{ option.label ?? option.value }}</slot>
                    </SelectOption>
                </template>
            </div>
        </template>
    </Popover>
</template>
