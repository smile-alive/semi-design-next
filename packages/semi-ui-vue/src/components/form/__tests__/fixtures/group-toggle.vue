<script setup lang="ts">
    import { Form, FormInputGroup, type FormApi } from '../..';
    import { FormInput } from './fields';

    const props = defineProps<{ showB: boolean; onApi: (api: FormApi) => void }>();
</script>

<template>
    <Form @getFormApi="props.onApi">
        <FormInputGroup label="group">
            <FormInput field="a" trigger="mount" :validator="() => 'a-err'" />
            <FormInput v-if="props.showB" field="b" trigger="mount" :validator="() => 'b-err'" />
        </FormInputGroup>
    </Form>
</template>
