<script lang="ts">
    import { Button, Form, FormCheckboxGroup, FormInput, Space, Toast, type FormApi } from '@fibrae/semi-ui-svelte';

    const allFields = ['a', 'b', 'c', 'd', 'b.name'];
    const options = allFields.map((item) => ({ label: item, value: item }));

    const validate = (val?: string) => {
        if (!val) {
            return "can't be empty";
        } else if (val.length <= 5) {
            return '我是传入的节点';
        }
        return undefined;
    };

    let formApi: FormApi | undefined;

    const validatePartial = (type?: 'all') => {
        const scope = type === 'all' ? allFields : (formApi?.getValue('validateScope') ?? []);
        formApi
            ?.validate(scope)
            .then((values) => {
                console.log(values);
                Toast.success('pass');
            })
            .catch((error) => {
                Toast.error('error');
                console.log(error);
            });
    };

    const resetPartial = () => {
        formApi?.reset(formApi.getValue('resetScope'));
    };
</script>

<Form autoScrollToError getFormApi={(api) => (formApi = api)} layout="horizontal">
    {#snippet children({ values })}
        <div>
            <FormInput field="a[1]" trigger="blur" validator={validate} />
            <FormInput field="a[0]" trigger="blur" validator={validate} />
            <FormInput field="b.name[0]" trigger="blur" validator={validate} />
            <FormInput field="b.name[1]" trigger="blur" validator={validate} />
            <FormInput field="b.type" trigger="blur" validator={validate} />
            <FormInput field="c" trigger="blur" validator={validate} />
            <FormInput field="d" trigger="blur" validator={validate} />
        </div>
        <div>
            <FormCheckboxGroup direction="horizontal" field="validateScope" initValue={['a', 'b']} label="当前希望校验的Field" {options} />
            <FormCheckboxGroup direction="horizontal" field="resetScope" label="当前需要Reset的Field" {options} />
            <Space>
                <Button htmlType="reset">reset</Button>
                <Button onclick={() => validatePartial('all')}>all validate</Button>
                <Button onclick={() => validatePartial()}>partial validate {JSON.stringify(values.validateScope)}</Button>
                <Button onclick={resetPartial}>partial reset</Button>
            </Space>
        </div>
    {/snippet}
</Form>
