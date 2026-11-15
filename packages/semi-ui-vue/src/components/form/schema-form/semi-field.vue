<script setup lang="ts">
    import { type Component, computed, watchEffect } from 'vue';
    import { controlProps, type SchemaFieldKind, schemaFieldWarnings, singleItemName } from '@fibrae/semi-foundation/components/form/json-schema';
    import { formatLocale } from '@fibrae/semi-foundation/locale';
    import { warning } from '@fibrae/semi-foundation/utils';
    import useLocale from '../../locale/use-locale';
    import { FormInput, FormInputNumber, FormSelect, FormSwitch, FormTextArea } from '../field';
    import type { SchemaLeafContext } from '../interface';

    const props = defineProps<{ context: SchemaLeafContext }>();

    const locale = useLocale('Form');

    const controls: Partial<Record<SchemaFieldKind, Component>> = {
        input: FormInput,
        textarea: FormTextArea,
        number: FormInputNumber,
        switch: FormSwitch,
        select: FormSelect,
    };

    const node = computed(() => props.context.node);
    const control = computed(() => controls[node.value.kind]);
    const itemName = computed(() => singleItemName(node.value, locale.value.locale));
    const labelProps = computed(() => (itemName.value === undefined ? { label: { text: node.value.title ?? formatLocale(locale.value.locale.item, { index: (node.value.item?.index ?? 0) + 1 }), required: node.value.required } } : { noLabel: true, 'aria-label': itemName.value }));

    // Input declares the native spelling of the length limit, as TextArea declares maxCount
    const controlAttrs = computed(() => {
        const { maxLength, ...rest } = controlProps(node.value);
        return maxLength === undefined ? rest : { ...rest, maxlength: maxLength };
    });

    watchEffect(() => warning(!control.value, schemaFieldWarnings.unsupported(node.value.field)), { flush: 'post' });
</script>

<template>
    <component :is="control" v-if="control" :field="node.field" :initValue="node.default" v-bind="{ ...labelProps, ...controlAttrs }">
        <template v-if="itemName === undefined && node.description" #extraText>
            {{ node.description }}
        </template>
    </component>
</template>
