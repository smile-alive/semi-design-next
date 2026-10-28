<script setup lang="ts">
    import { defineComponent, h, type PropType } from 'vue';
    import { Form, Input, Select, withField } from '@fibrae/semi-ui-vue';

    interface BaseInfo {
        name?: string;
        role?: string;
    }

    const roles = [
        { value: 'rd', label: '开发' },
        { value: 'UED', label: '设计师' },
    ];

    // A single-file demo cannot define a component inline, so a render function; use a separate SFC in real code
    // aria-required is a prop for each control; id, aria-labelledby and the rest land on the root fieldset
    const MyComponent = defineComponent({
        props: { modelValue: Object as PropType<BaseInfo>, ariaRequired: Boolean },
        emits: { change: (value: BaseInfo) => Boolean(value) },
        setup(props, { emit }) {
            const update = (patch: BaseInfo) => emit('change', { ...props.modelValue, ...patch });
            return () =>
                h('fieldset', { class: 'customField', style: 'border: 0; margin: 0; padding: 0' }, [
                    h(
                        Input,
                        {
                            'aria-label': '名称',
                            'aria-required': props.ariaRequired,
                            modelValue: props.modelValue?.name,
                            'onUpdate:modelValue': (name: string) => update({ name }),
                            style: 'width: 180px; margin-inline-end: 12px',
                        },
                        { prefix: () => '名称' }
                    ),
                    h(
                        Select,
                        {
                            'aria-label': '角色',
                            'aria-required': props.ariaRequired,
                            modelValue: props.modelValue?.role,
                            'onUpdate:modelValue': (role: unknown) => update({ role: role as string }),
                            style: 'width: 200px',
                            optionList: roles,
                        },
                        { prefix: () => '角色' }
                    ),
                ]);
        },
    });
    const CustomField = withField(MyComponent);
</script>

<template>
    <Form>
        <template #default="{ formState }">
            <CustomField field="baseInfo" :label="{ text: '基本信息', required: true }" />
            <pre><code>{{ JSON.stringify(formState) }}</code></pre>
        </template>
    </Form>
</template>
