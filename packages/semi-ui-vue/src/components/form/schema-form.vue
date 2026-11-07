<script setup lang="ts" generic="Values extends Record<string, any> = Record<string, any>, Output = Values">
    import { useTemplateRef } from 'vue';
    import type { ElementProps, EmitHandlers, EmitProps } from '../../base/element-props';
    import { semiGlobalDefault } from '../../base/semi-default';
    import Form from './form.vue';
    import type { FormDefaultSlotProps, FormEmits, FormHandle, FormProps, FormSlots, SchemaFieldSharedProps } from './interface';
    import SchemaField from './schema-field.vue';

    // The Form props and listeners stay attrs and fall through to the inner Form, which reads their global defaults
    const props = withDefaults(defineProps<SchemaFieldSharedProps & /* @vue-ignore */ FormProps<Values, Output> & /* @vue-ignore */ EmitProps<FormEmits<Values, Output>> & /* @vue-ignore */ ElementProps<'form', keyof FormProps<Values, Output> | EmitHandlers<FormEmits<Values, Output>>>>(), {
        jsonSchema: semiGlobalDefault('SchemaForm', 'jsonSchema'),
        widgets: semiGlobalDefault('SchemaForm', 'widgets'),
        renderField: semiGlobalDefault('SchemaForm', 'renderField'),
    });

    defineSlots<FormSlots<Values, Output>>();

    const form = useTemplateRef('form');

    // the inner Form takes its props as attrs, so its slot scope is typed without Values
    const slotScope = (scope: FormDefaultSlotProps) => scope as FormDefaultSlotProps<Values, Output>;

    defineExpose<FormHandle<Values, Output>>({
        // a template ref is filled on mount, before a parent can read this handle
        get formApi() {
            return (form.value as unknown as FormHandle<Values, Output>).formApi;
        },
    });
</script>

<template>
    <Form ref="form">
        <template #default="scope">
            <SchemaField :jsonSchema="props.jsonSchema" :renderField="props.renderField" :widgets="props.widgets" />
            <slot v-bind="slotScope(scope)" />
        </template>
    </Form>
</template>
