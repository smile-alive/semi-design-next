<script lang="ts">
    import { Form, FormInput, type FormApi } from '@fibrae/semi-ui-svelte';

    type ValidateStatus = 'default' | 'error' | 'warning' | 'success';

    let hint = $state('');
    let validateStatus = $state<ValidateStatus>('default');
    let formApi: FormApi | undefined;

    const validator = (val?: string) => {
        if (!val) {
            validateStatus = 'error';
            return '密码不能为空';
        } else if (val.length <= 3) {
            validateStatus = 'warning';
            hint = '密码强度：弱'; // 展示 helpText
            return ''; // 校验通过
        }
        hint = '';
        validateStatus = 'success';
        return '';
    };

    const onSubmit = () => console.log('submit success');
    const onSubmitFail = (errors: unknown) => console.log(errors);

    const random = () => {
        const pw = (Math.random() * 100000).toString().slice(0, 5);
        formApi?.setValue('Password', pw);
        formApi?.setError('Password', '');
        hint = '';
        validateStatus = 'success';
    };
</script>

{#snippet weak()}
    <span style="color: var(--semi-color-warning)">{hint}</span>
{/snippet}

{#snippet generate()}
    <button style="padding: 0; border: none; background: none; font: inherit; color: var(--semi-color-link); font-size: 14px; user-select: none; cursor: pointer" type="button" onclick={random}> 没有想到合适的密码？点击随机生成一个 </button>
{/snippet}

<Form getFormApi={(api) => (formApi = api)} {onSubmit} {onSubmitFail} showValidateIcon>
    <FormInput extraText={generate} field="Password" helpText={hint ? weak : undefined} {validateStatus} {validator} />
</Form>
