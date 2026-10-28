<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import { expectTypeOf } from 'vite-plus/test';
    import { FormAutoComplete, FormCascader, FormCheckbox, FormSelect, FormTreeSelect, FormUpload, withField } from '../..';
    import AutoComplete from '../../../auto-complete';
    import type { CascaderSimpleValue } from '../../../cascader';
    import type { BasicSelectValue, SelectHandle } from '../../../select';
    import type { TreeNodeData } from '../../../tree/interface';
    import type { FieldHandle } from '../../interface';

    type TreeValue = string | number | TreeNodeData;
    const text = ref('');
    const PlainAutoComplete = withField(AutoComplete);
    // vue-tsc types a template ref only when the call is assigned to a variable; the type comes from the `expose` that
    // field.ts declares for the generic field. Without it the ref falls back to any, which toEqualTypeOf alone accepts.
    const fs = useTemplateRef('fs');
    expectTypeOf(fs.value).not.toBeAny();
    expectTypeOf(fs.value).toEqualTypeOf<FieldHandle<SelectHandle> | null>();
</script>

<template>
    <FormSelect
        field="a"
        @change="
            (value, latest) => {
                expectTypeOf(value).toEqualTypeOf<BasicSelectValue | undefined>();
                expectTypeOf(latest).toEqualTypeOf<Record<string, any>>();
            }
        "
    >
        <FormSelect.OptGroup label="cn">
            <FormSelect.Option value="sh">Shanghai</FormSelect.Option>
        </FormSelect.OptGroup>
        <template #prefix>p</template>
    </FormSelect>
    <FormSelect field="a" multiple @change="expectTypeOf($event).toEqualTypeOf<BasicSelectValue[]>()" />
    <!-- @vue-expect-error the Form owns the value -->
    <FormSelect v-model="text" field="a" />
    <!-- @vue-expect-error the Form owns the value -->
    <FormSelect defaultValue="x" field="a" />
    <!-- @vue-expect-error field is required -->
    <FormSelect label="a" />

    <FormSelect ref="fs" field="a" />

    <FormTreeSelect
        field="t"
        @change="
            (value, node) => {
                expectTypeOf(value).toEqualTypeOf<TreeValue | undefined>();
                expectTypeOf(node).toEqualTypeOf<TreeNodeData | undefined>();
            }
        "
    />
    <FormTreeSelect
        field="t"
        multiple
        @change="
            (value, node) => {
                expectTypeOf(value).toEqualTypeOf<TreeValue[]>();
                expectTypeOf(node).toEqualTypeOf<TreeNodeData[]>();
            }
        "
    />

    <FormCascader field="c" @change="expectTypeOf($event).toEqualTypeOf<CascaderSimpleValue[]>()" />
    <FormCascader field="c" multiple @change="expectTypeOf($event).toEqualTypeOf<CascaderSimpleValue[][]>()" />

    <FormAutoComplete
        :data="['a', 'b']"
        field="ac"
        @change="
            (value, latest) => {
                expectTypeOf(value).toEqualTypeOf<string | number>();
                expectTypeOf(latest).toEqualTypeOf<Record<string, any>>();
            }
        "
    >
        <template #prefix>p</template>
    </FormAutoComplete>
    <!-- withField reads a generic SFC through its call signature, which carries no slots -->
    <PlainAutoComplete field="ac">
        <!-- @vue-expect-error the plain factory type has no #prefix slot -->
        <template #prefix>p</template>
    </PlainAutoComplete>

    <FormCheckbox value="a">A</FormCheckbox>
    <!-- @vue-expect-error the Form owns the file list -->
    <FormUpload action="/" :defaultFileList="[]" field="files" />
</template>
