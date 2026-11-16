<script setup lang="ts" generic="V extends SelectRawValue = string | number, Multiple extends boolean | undefined = undefined, WithObject extends boolean | undefined = undefined">
    import { useTemplateRef } from 'vue';
    import { numbers } from '@fibrae/semi-foundation/components/select/constants';
    import type { SelectRawValue } from '@fibrae/semi-foundation/components/select/option-foundation';
    import { type ElementProps, type EmitHandlers, semiDefault, semiGlobalDefault } from '../../base/index';
    import type { SelectCreateItemSlotProps, SelectEmits, SelectHandle, SelectOptionItemSlotProps, SelectProps, SelectSelectedItemSlotProps, SelectSlots, SelectTriggerSlotProps } from './interface';
    import SelectBody from './select-body.vue';
    import { readOptions } from './utils';

    // vue-tsc checks a slot with a dynamic name against the intersection of every slot's scope
    type ForwardedScope = SelectOptionItemSlotProps & SelectCreateItemSlotProps & SelectSelectedItemSlotProps & SelectTriggerSlotProps;

    /**
     * Reads the option children while rendering and passes them to SelectBody, which holds the state. The state is
     * created during setup and needs the options for the first render (SSR runs no mounted hook), but Vue warns when a
     * slot passed with h() or JSX is called outside render; reading them here keeps every slot call inside a render.
     */
    const props = withDefaults(defineProps<SelectProps<V, Multiple, WithObject> & /* @vue-ignore */ ElementProps<'div', keyof SelectProps<V, Multiple, WithObject> | EmitHandlers<SelectEmits<V, Multiple, WithObject>>>>(), {
        modelValue: undefined,
        defaultValue: semiGlobalDefault('Select', 'defaultValue'),
        // a default other than undefined would break the inference of Multiple, so the global config cannot set it
        multiple: undefined,
        optionList: semiGlobalDefault('Select', 'optionList'),
        filter: undefined,
        remote: () => semiDefault('Select', 'remote', false),
        allowCreate: () => semiDefault('Select', 'allowCreate', false),
        autoClearSearchValue: () => semiDefault('Select', 'autoClearSearchValue', true),
        autofocus: () => semiDefault('Select', 'autofocus', false),
        defaultOpen: () => semiDefault('Select', 'defaultOpen', false),
        clickToHide: () => semiDefault('Select', 'clickToHide', false),
        defaultActiveFirstOption: () => semiDefault('Select', 'defaultActiveFirstOption', true),
        // a default other than undefined would break the inference of WithObject, so the global config cannot set it
        changeWithObject: undefined,
        max: semiGlobalDefault('Select', 'max'),
        maxTagCount: semiGlobalDefault('Select', 'maxTagCount'),
        maxHeight: () => semiDefault('Select', 'maxHeight', numbers.LIST_HEIGHT),
        showRestTagsPopover: () => semiDefault('Select', 'showRestTagsPopover', false),
        restTagsPopoverProps: semiGlobalDefault('Select', 'restTagsPopoverProps'),
        expandRestTagsOnClick: () => semiDefault('Select', 'expandRestTagsOnClick', false),
        ellipsisTrigger: () => semiDefault('Select', 'ellipsisTrigger', false),
        // size and disabled resolve own value -> InputGroup -> global default in useGroupLooks
        size: undefined,
        disabled: undefined,
        borderless: () => semiDefault('Select', 'borderless', false),
        validateStatus: semiGlobalDefault('Select', 'validateStatus'),
        placeholder: semiGlobalDefault('Select', 'placeholder'),
        searchPlaceholder: semiGlobalDefault('Select', 'searchPlaceholder'),
        searchPosition: () => semiDefault('Select', 'searchPosition', 'trigger'),
        loading: () => semiDefault('Select', 'loading', false),
        showArrow: () => semiDefault('Select', 'showArrow', true),
        showClear: () => semiDefault('Select', 'showClear', false),
        // no global default: a global id would repeat on every instance
        insetLabelId: undefined,
        inputProps: semiGlobalDefault('Select', 'inputProps'),
        classNames: semiGlobalDefault('Select', 'classNames'),
        styles: semiGlobalDefault('Select', 'styles'),
        dropdownMatchSelectWidth: () => semiDefault('Select', 'dropdownMatchSelectWidth', true),
        position: semiGlobalDefault('Select', 'position'),
        spacing: semiGlobalDefault('Select', 'spacing'),
        motion: () => semiDefault('Select', 'motion', true),
        autoAdjustOverflow: () => semiDefault('Select', 'autoAdjustOverflow', true),
        stopPropagation: () => semiDefault('Select', 'stopPropagation', true),
        virtualize: semiGlobalDefault('Select', 'virtualize'),
        preventScroll: semiGlobalDefault('Select', 'preventScroll'),
        id: undefined,
    });

    const emit = defineEmits<SelectEmits<V, Multiple, WithObject>>();
    const slots = defineSlots<SelectSlots>();

    const body = useTemplateRef('body');

    // SelectBody emits the raw value types; the generics only type what callers see
    const forward = emit as (event: string, ...args: unknown[]) => void;

    // The generics Multiple and WithObject have no runtime type, so Vue does not cast a valueless `multiple` or
    // `change-with-object` to true: it arrives as ''. SelectBody is not generic, hence the assertion
    const flag = (value: unknown) => value === '' || Boolean(value);

    const bodyProps = () => ({ ...props, multiple: flag(props.multiple), changeWithObject: flag(props.changeWithObject) }) as unknown as InstanceType<typeof SelectBody>['$props'];

    const optionRecords = () => readOptions(slots.default?.() ?? [], props.optionList);

    const passedSlots = () => (Object.keys(slots) as (keyof SelectSlots)[]).filter((name) => name !== 'default');

    defineExpose<SelectHandle>({
        close: () => body.value?.close(),
        open: () => body.value?.open(),
        focus: () => body.value?.focus(),
        clearInput: () => body.value?.clearInput(),
        selectAll: () => body.value?.selectAll(),
        deselectAll: () => body.value?.deselectAll(),
        search: (value, event) => body.value?.search(value, event),
        rePosition: () => body.value?.rePosition(),
    });
</script>

<template>
    <SelectBody
        ref="body"
        v-bind="bodyProps()"
        :optionRecords="optionRecords()"
        @blur="(...args) => emit('blur', ...args)"
        @change="(...args) => forward('change', ...args)"
        @clear="(...args) => emit('clear', ...args)"
        @create="(...args) => emit('create', ...args)"
        @deselect="(...args) => forward('deselect', ...args)"
        @dropdownVisibleChange="(...args) => emit('dropdownVisibleChange', ...args)"
        @exceed="(...args) => forward('exceed', ...args)"
        @focus="(...args) => emit('focus', ...args)"
        @keydown="(...args) => emit('keydown', ...args)"
        @listScroll="(...args) => emit('listScroll', ...args)"
        @search="(...args) => emit('search', ...args)"
        @select="(...args) => forward('select', ...args)"
        @update:modelValue="(...args) => forward('update:modelValue', ...args)"
    >
        <template v-for="name in passedSlots()" #[name]="scope">
            <slot :name="name" v-bind="scope as ForwardedScope" />
        </template>
    </SelectBody>
</template>
