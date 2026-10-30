<script lang="ts">
    import { Button, Form, FormInput } from '@fibrae/semi-ui-svelte';

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const validateName = (val?: string) => {
        if (!val) {
            return "【sync】can't be empty";
        } else if (val.length <= 5) {
            return '【sync】must more than 5';
        }
        return '';
    };

    const asyncValidate = (val?: string) =>
        sleep(2000).then(() => {
            if (!val) {
                return "【async】can't be empty";
            } else if (val.length <= 5) {
                return '【async】must more than 5';
            } else {
                return '';
            }
        });
</script>

<Form>
    <FormInput field="name" label="【name】asyncValidate after 2s" trigger="blur" validator={asyncValidate} />
    <FormInput field="familyName" label="【familyName】syncValidate" trigger="blur" validator={validateName} />
    <Button htmlType="reset">reset</Button>
</Form>
