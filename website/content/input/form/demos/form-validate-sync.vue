<script setup lang="ts">
    import { Button, Form, FormInput } from '@fibrae/semi-ui-vue';

    interface FormValues {
        name?: string;
        sex?: string;
    }

    const syncValidate = (values: FormValues) => {
        const errors: Record<string, unknown> = {};
        if (values.name !== 'mike') {
            errors.name = 'you must name mike';
        }
        if (values.sex !== 'female') {
            errors.sex = 'must be woman';
        }
        errors.familyName = [{ before: 'before error balabala ', after: 'after error balabala' }, 'familyName[1] error balabala'];
        return errors;
    };
</script>

<template>
    <Form layout="horizontal" :validator="syncValidate">
        <FormInput field="name" trigger="blur" />
        <FormInput field="familyName[0].before" trigger="blur" />
        <FormInput field="familyName[0].after" trigger="blur" />
        <FormInput field="familyName[1]" trigger="blur" />
        <div :style="{ display: 'flex', alignItems: 'flex-end' }">
            <Button class="btn-margin-right" htmlType="submit" type="primary">Submit</Button>
            <Button htmlType="reset">reset</Button>
        </div>
    </Form>
</template>
