<script setup lang="ts">
    import { computed, nextTick, shallowRef, useAttrs, useId, useTemplateRef, watch, type InputHTMLAttributes } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/tag-input/constants';
    import TagInputFoundation, { type OnSortEndProps, type TagInputAdapter, type TagInputBaseState } from '@fibrae/semi-foundation/tag-input/foundation';
    import { focusTagStop, getFocusedTagStop } from '@fibrae/semi-foundation/tag-input/utils/tag-focus';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/tag-input/tag-input.scss';
    import { IconClear } from '@fibrae/semi-icons-vue';
    import { splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import slotKind from '../_base/slot-kind';
    import useClickOutside from '../_base/use-click-outside';
    import useFoundation from '../_base/use-foundation';
    import type SortableComponent from '../_sortable/sortable.vue';
    import Input, { type InputHandle } from '../input';
    import { provideInputGroupContext } from '../input/context';
    import useGroupLooks from '../input/use-group-looks';
    import useLocale from '../locale/use-locale';
    import Popover, { type PopoverProps } from '../popover';
    import { useNestedPopups } from '../tooltip/context';
    import type { TagInputEmits, TagInputHandle, TagInputProps, TagInputSlots } from './interface';
    import TagItem from './tag-item.vue';

    interface FoundationProps extends TagInputProps {
        value?: string[] | null;
    }

    type Foundation = TagInputFoundation<FoundationProps, TagInputBaseState, Event>;
    type Adapter = TagInputAdapter<FoundationProps, TagInputBaseState, Event>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<TagInputProps & /* @vue-ignore */ ElementProps<'div', keyof TagInputProps | EmitHandlers<TagInputEmits>>>(), {
        modelValue: undefined,
        defaultValue: semiGlobalDefault('TagInput', 'defaultValue'),
        inputValue: semiGlobalDefault('TagInput', 'inputValue'),
        inputValueModifiers: undefined,
        // size and disabled resolve own value -> InputGroup -> global default in useGroupLooks
        disabled: undefined,
        maxLength: semiGlobalDefault('TagInput', 'maxLength'),
        max: semiGlobalDefault('TagInput', 'max'),
        maxTagCount: semiGlobalDefault('TagInput', 'maxTagCount'),
        showRestTagsPopover: () => semiDefault('TagInput', 'showRestTagsPopover', true),
        restTagsPopoverProps: semiGlobalDefault('TagInput', 'restTagsPopoverProps'),
        showContentTooltip: () => semiDefault('TagInput', 'showContentTooltip', true),
        allowDuplicates: () => semiDefault('TagInput', 'allowDuplicates', true),
        addOnBlur: () => semiDefault('TagInput', 'addOnBlur', false),
        draggable: () => semiDefault('TagInput', 'draggable', false),
        expandRestTagsOnClick: () => semiDefault('TagInput', 'expandRestTagsOnClick', true),
        placeholder: semiGlobalDefault('TagInput', 'placeholder'),
        insetLabelId: undefined,
        separator: () => semiDefault('TagInput', 'separator', ','),
        showClear: () => semiDefault('TagInput', 'showClear', false),
        size: undefined,
        split: undefined,
        validateStatus: () => semiDefault('TagInput', 'validateStatus', 'default'),
        autofocus: () => semiDefault('TagInput', 'autofocus', false),
        preventScroll: semiGlobalDefault('TagInput', 'preventScroll'),
    });

    const emit = defineEmits<TagInputEmits>();
    const slots = defineSlots<TagInputSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const locale = useLocale('TagInput');

    const root = useTemplateRef('root');
    const wrapper = useTemplateRef('wrapper');

    // explicit type: the adapter reads this ref while the template reads foundation state, which would make inference circular
    const inputRef = useTemplateRef<InputHandle>('input');
    const clearButton = useTemplateRef('clearButton');
    const Sortable = shallowRef<typeof SortableComponent | null>(null);
    const dragging = shallowRef(false);

    // These describe the text input, not the root. A combobox built on TagInput (Cascader, TreeSelect) makes the input
    // itself the combobox (ARIA 1.2), hence the role. The root is a group, not a focus target, so a tabindex (Tooltip
    // injects 0) goes to the input as well.
    const controlKeys = new Set(['id', 'name', 'role', 'tabindex', 'aria-activedescendant', 'aria-autocomplete', 'aria-controls', 'aria-describedby', 'aria-errormessage', 'aria-expanded', 'aria-haspopup', 'aria-invalid', 'aria-label', 'aria-labelledby', 'aria-required']);

    const looks = useGroupLooks('TagInput', props, { size: 'default' });

    const prefix = cssClasses.PREFIX;
    const splitFn = computed(() => props.split ?? readSemiDefault(semi, 'TagInput', 'split'));

    const popoverProps = computed((): PopoverProps => ({
        autoAdjustOverflow: true,
        position: 'top',
        showArrow: true,
        trigger: 'hover',
        ...props.restTagsPopoverProps,
    }));

    // the Input inside is part of this control, not a member of the group
    provideInputGroupContext(undefined);

    const focusInput = () => inputRef.value?.input?.focus({ preventScroll: props.preventScroll });

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, TagInputBaseState>(
        TagInputFoundation,
        props,
        (view) => ({
            tagsArray: view.defaultValue ?? [],
            inputValue: '',
            focusing: false,
            active: false,
            entering: false,
        }),
        (base) => ({
            setInputValue: (inputValue) => base.setState({ inputValue }),
            setTagsArray: (tagsArray) => base.setState({ tagsArray }),
            setFocusing: (focusing) => base.setState({ focusing }),
            toggleFocusing: (isFocus) => {
                if (isFocus) {
                    focusInput();
                } else {
                    inputRef.value?.input?.blur();
                }
                base.setState({ focusing: isFocus });
            },
            setActive: (active) => base.setState({ active }),
            setEntering: (entering) => base.setState({ entering }),
            notifyBlur: (event) => emit('blur', event),
            notifyFocus: (event) => emit('focus', event),
            notifyInputChange: (value, event) => {
                emit('update:inputValue', value);
                emit('inputChange', value, event);
            },
            notifyTagChange: (value) => {
                emit('update:modelValue', value);
                emit('change', value);
            },
            notifyTagAdd: (value) => emit('add', value),
            notifyTagRemove: (value, index) => emit('remove', value, index),
            notifyKeyDown: (event) => emit('keydown', event),
            notifyInputExceed: (value) => emit('inputExceed', value),
            notifyExceed: (value) => emit('exceed', value),
            getInput: () => inputRef.value?.input ?? null,
        }),
        { props: { size: () => looks.size, disabled: () => looks.disabled, value: () => props.modelValue, split: () => splitFn.value } }
    );

    const tags = computed(() => TagInputFoundation.getTagsArray({ value: props.modelValue }, state.value));
    const inputValue = computed(() => TagInputFoundation.getInputValue(props, state.value));

    const sortIds = shallowRef(TagInputFoundation.getSortIds(tags.value));

    const draggableActive = computed(() => Boolean(state.value.active && props.draggable));
    const sorting = computed(() => draggableActive.value && tags.value.length > 0);
    const restCount = computed(() => (!sorting.value && (!state.value.active || !props.expandRestTagsOnClick) && props.maxTagCount && props.maxTagCount < tags.value.length ? tags.value.length - props.maxTagCount : 0));
    const shownTags = computed(() => (restCount.value > 0 ? tags.value.slice(0, props.maxTagCount) : tags.value));
    const restTags = computed(() => (restCount.value > 0 ? tags.value.slice(props.maxTagCount) : []));
    const clearable = computed(() => (inputValue.value !== '' || tags.value.length > 0) && !looks.disabled);

    const handleSortEnd = (move: OnSortEndProps) => {
        sortIds.value = { ...sortIds.value, move };
        foundation.handleSortEnd(move);
    };

    const handleClear = (event: MouseEvent) => {
        foundation.handleClearBtn(event);
        focusInput();
    };

    const handleTagClose = (index: number, event?: Event) => {
        // Tag hides itself unless its close event is prevented; the value decides
        if (event instanceof Event) {
            event.preventDefault();
        }
        if (looks.disabled) {
            return;
        }
        // a removed node fires no blur either, so the input takes the focus first
        if (root.value?.contains(FocusTrapHandle.getActiveElement(root.value))) {
            focusInput();
        }
        foundation.handleTagClose(index);
    };

    const handleFocusIn = (event: FocusEvent) => {
        if (!(event.currentTarget as Node).contains(event.relatedTarget as Node | null)) {
            foundation.handleInputFocus(event);
        }
    };

    const handleFocusOut = (event: FocusEvent) => {
        // Chromium blurs the picked-up handle when dnd-kit moves it; ending the active state would unmount the list
        if (dragging.value) {
            return;
        }
        if (!(event.currentTarget as Node).contains(event.relatedTarget as Node | null)) {
            foundation.handleInputBlur(event);
        }
    };

    const isControlKey = (key: string) => controlKeys.has(key);

    // the value under validation is the text field's, and group does not support aria-invalid
    const ariaInvalid = () => (attrs['aria-invalid'] ?? (props.validateStatus === 'error' ? true : undefined)) as InputHTMLAttributes['aria-invalid'];

    const kinds = () => ({
        prefix: slotKind(slots.prefix),
        insetLabel: slotKind(slots.insetLabel),
        suffix: slotKind(slots.suffix),
    });

    const insetLabelShown = () => !slotKind(slots.prefix) && Boolean(slotKind(slots.insetLabel));

    const rootClass = (k: ReturnType<typeof kinds>) => [
        prefix,
        {
            [`${prefix}-focus`]: state.value.focusing || state.value.active,
            [`${prefix}-disabled`]: looks.disabled,
            [`${prefix}-error`]: props.validateStatus === 'error',
            [`${prefix}-warning`]: props.validateStatus === 'warning',
            [`${prefix}-small`]: looks.size === 'small',
            [`${prefix}-large`]: looks.size === 'large',
            [`${prefix}-with-prefix`]: Boolean(k.prefix || k.insetLabel),
            [`${prefix}-with-suffix`]: Boolean(k.suffix),
        },
    ];

    // a value that goes back to undefined clears the tags (a form reset) and leaves them uncontrolled
    watch(
        () => props.modelValue,
        (value) => {
            if (value === undefined) {
                foundation.setState({ tagsArray: [] });
            }
        }
    );

    // the state keeps what was typed under control; leaving control must not bring it back
    watch(
        () => props.inputValue,
        (value) => {
            if (value === undefined) {
                foundation.setState({ inputValue: '' });
            }
        }
    );

    watch(tags, (value) => {
        sortIds.value = TagInputFoundation.getSortIds(value, sortIds.value);
    });

    watch(
        draggableActive,
        (on) => {
            if (on && !Sortable.value) {
                void import('../_sortable/sortable.vue').then((module) => {
                    Sortable.value = module.default;
                });
            }
        },
        { immediate: true }
    );

    // Switching plain/sortable lists rebuilds every tag, so the input holds focus during the patch; the same tag then
    // takes it back.
    watch(
        () => Boolean(Sortable.value && sorting.value),
        async () => {
            const stop = getFocusedTagStop(wrapper.value);
            if (stop >= 0) {
                // the tag takes focus back right after; do not scroll the input into view
                inputRef.value?.input?.focus({ preventScroll: true });
                await nextTick();
                focusTagStop(wrapper.value, stop);
            }
        }
    );

    // mousedown: a press inside released outside makes a click on their common ancestor, which reads as outside
    useClickOutside([root], foundation.deactivate, () => Boolean(state.value.active), useNestedPopups());

    // the placeholder shows only while there are no tags
    watch([inputValue, () => tags.value.length === 0, () => props.placeholder, () => looks.size], foundation.fitInputWidth, { flush: 'post' });

    // A removed node fires no blur, so move focus off the clear button in a pre-flush watcher, before the patch removes it.
    watch(clearable, (now) => {
        if (!now && clearButton.value === FocusTrapHandle.getActiveElement(clearButton.value)) {
            focusInput();
        }
    });

    // a rendered inset label names the input (WCAG 2.5.3), so it needs an id even when the caller gives none
    const generatedLabelId = useId();

    const prefixId = () => props.insetLabelId ?? (insetLabelShown() ? generatedLabelId : undefined);

    const insetNameId = () => (insetLabelShown() ? prefixId() : undefined);

    // a Form label reaches the input through `id`; without any name source it would have no name
    const ariaLabel = () => (attrs['aria-label'] ?? (attrs['aria-labelledby'] || attrs.id || insetNameId() ? undefined : locale.value.locale.input)) as string | undefined;

    const ariaLabelledby = () => (attrs['aria-labelledby'] ?? (attrs['aria-label'] ? undefined : insetNameId())) as string | undefined;

    defineExpose<TagInputHandle>({
        focus: () => {
            focusInput();
            if (!looks.disabled) {
                foundation.handleClick();
            }
        },
        blur: () => {
            const activeElement = FocusTrapHandle.getActiveElement(root.value);
            if (activeElement instanceof HTMLElement && root.value?.contains(activeElement)) {
                activeElement.blur();
            }
            foundation.deactivate();
        },
    });
</script>

<template>
    <div ref="root" v-bind="splitControlAttrs($attrs, isControlKey).root" :aria-disabled="looks.disabled || undefined" :class="rootClass(kinds())" role="group" @click="foundation.handleClick" @focusin="handleFocusIn" @focusout="handleFocusOut">
        <template v-for="(k, i) in [kinds()]" :key="i">
            <div
                v-if="k.prefix || k.insetLabel"
                :id="prefixId()"
                :class="[`${prefix}-prefix`, { [`${prefix}-inset-label`]: Boolean(k.insetLabel), [`${prefix}-prefix-text`]: (k.prefix ?? k.insetLabel) === 'text', [`${prefix}-prefix-icon`]: (k.prefix ?? k.insetLabel) === 'icon' }]"
                x-semi-prop="prefix"
                @click="foundation.handleClickPrefixOrSuffix"
                @mousedown.prevent
            >
                <slot v-if="k.prefix" name="prefix" />
                <slot v-else name="insetLabel" />
            </div>
        </template>
        <div ref="wrapper" :class="`${prefix}-wrapper`">
            <component :is="Sortable" v-if="Sortable && sorting" :class="`${prefix}-sortable-list`" :dragHandleLabel="locale.locale.dragSort" :dragOverlayClass="`${prefix}-drag-item-move`" :items="sortIds.ids" :prefix="prefix" :transition="null" @dragging="dragging = $event" @sortEnd="handleSortEnd">
                <template #item="{ index }">
                    <TagItem :disabled="looks.disabled" draggableActive :index="index" :showContentTooltip="props.showContentTooltip" :size="looks.size" :value="tags[index]" withHandle @close="handleTagClose(index, $event)">
                        <template v-if="$slots.tag" #tag="tagProps">
                            <slot name="tag" v-bind="tagProps" />
                        </template>
                    </TagItem>
                </template>
            </component>
            <template v-else>
                <TagItem v-for="(value, index) in shownTags" :key="`${index}-${value}`" :disabled="looks.disabled" :draggableActive="draggableActive" :index="index" :showContentTooltip="props.showContentTooltip" :size="looks.size" :value="value" :withHandle="false" @close="handleTagClose(index, $event)">
                    <template v-if="$slots.tag" #tag="tagProps">
                        <slot name="tag" v-bind="tagProps" />
                    </template>
                </TagItem>
                <Popover v-if="restCount > 0 && props.showRestTagsPopover" v-bind="popoverProps">
                    <span :class="[`${prefix}-wrapper-n`, { [`${prefix}-wrapper-n-disabled`]: looks.disabled }]">+{{ restCount }}</span>
                    <template #content>
                        <TagItem
                            v-for="(value, index) in restTags"
                            :key="`${shownTags.length + index}-${value}`"
                            :disabled="looks.disabled"
                            :draggableActive="draggableActive"
                            :index="shownTags.length + index"
                            :showContentTooltip="props.showContentTooltip"
                            :size="looks.size"
                            :value="value"
                            :withHandle="false"
                            @close="handleTagClose(shownTags.length + index, $event)"
                        >
                            <template v-if="$slots.tag" #tag="tagProps">
                                <slot name="tag" v-bind="tagProps" />
                            </template>
                        </TagItem>
                    </template>
                </Popover>
                <span v-else-if="restCount > 0" :class="[`${prefix}-wrapper-n`, { [`${prefix}-wrapper-n-disabled`]: looks.disabled }]">+{{ restCount }}</span>
            </template>
            <Input
                ref="input"
                v-bind="splitControlAttrs($attrs, isControlKey).control"
                :aria-invalid="ariaInvalid()"
                :aria-label="ariaLabel()"
                :aria-labelledby="ariaLabelledby()"
                :autofocus="props.autofocus"
                :class="[`${prefix}-wrapper-input`, `${prefix}-wrapper-input-${looks.size}`]"
                :disabled="looks.disabled"
                :modelModifiers="props.inputValueModifiers"
                :modelValue="inputValue"
                :placeholder="tags.length === 0 ? props.placeholder : ''"
                :preventScroll="props.preventScroll"
                :showClear="false"
                :size="looks.size"
                @change="foundation.handleInputChange"
                @compositionend="foundation.handleInputCompositionEnd"
                @compositionstart="foundation.handleInputCompositionStart"
                @keydown="foundation.handleKeyDown"
            />
        </div>
        <template v-if="props.showClear">
            <button v-if="clearable" ref="clearButton" :aria-label="locale.locale.clear" :class="`${prefix}-clearBtn`" type="button" @click="handleClear">
                <slot name="clearIcon">
                    <IconClear />
                </slot>
            </button>
            <span v-else :class="`${prefix}-clearBtn-placeholder`" />
        </template>
        <template v-for="(k, i) in [kinds()]" :key="i">
            <div v-if="k.suffix" :class="[`${prefix}-suffix`, { [`${prefix}-suffix-text`]: k.suffix === 'text', [`${prefix}-suffix-icon`]: k.suffix === 'icon' }]" x-semi-prop="suffix" @click="foundation.handleClickPrefixOrSuffix" @mousedown.prevent>
                <slot name="suffix" />
            </div>
        </template>
    </div>
</template>
