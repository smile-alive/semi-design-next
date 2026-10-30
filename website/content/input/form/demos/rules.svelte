<script lang="ts">
    import { Button, Form, FormInput, type RuleItem } from '@fibrae/semi-ui-svelte';

    const initValues = {
        name: 'semi',
        shortcut: 'se',
    };

    const style = 'width: 100%';

    const rules: RuleItem[] = [
        { required: true, message: 'required error' },
        { type: 'string', message: 'type error' },
        { validator: (_rule, value) => value === 'semi', message: 'should be semi' },
        {
            validator: (_rule, value) => Boolean(value && value.startsWith('se')),
            message: 'should startsWith se',
        },
    ];
</script>

<Form {initValues}>
    <FormInput field="name" {rules} {style} trigger="blur" />
    <FormInput field="shortcut" {rules} stopValidateWithError {style} />
    <Button htmlType="submit">提交</Button>
</Form>
