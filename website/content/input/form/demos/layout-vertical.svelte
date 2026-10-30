<script lang="ts">
    import { Button, Form, FormCheckbox, FormInput, Toast } from '@fibrae/semi-ui-svelte';

    const handleSubmit = (values: Record<string, unknown>) => {
        console.log(values);
        Toast.info('表单已提交');
    };
</script>

<Form onSubmit={handleSubmit} style="width: 400px">
    {#snippet children({ values })}
        <FormInput field="phone" label="PhoneNumber" placeholder="Enter your phone number" style="width: 100%" />
        <FormInput field="password" label="Password" placeholder="Enter your password" style="width: 100%" />
        <FormCheckbox field="agree" noLabel>I have read and agree to the terms of service</FormCheckbox>
        <div style="display: flex; justify-content: space-between; align-items: center">
            <p>
                <span>Or</span>
                <Button style="color: var(--semi-color-primary); margin-left: 10px; cursor: pointer" theme="borderless">Sign up</Button>
            </p>
            <Button disabled={!values.agree} htmlType="submit" type="tertiary">Log in</Button>
        </div>
    {/snippet}
</Form>
