<script lang="ts">
    import { useFieldApi, useFieldState, useFormApi, useFormState } from '../hooks';

    const formApi = useFormApi();
    const formState = useFormState();
    const nameApi = useFieldApi('name');
    const nameState = useFieldState(() => 'name');
</script>

<output data-testid="hooks">{JSON.stringify({ values: formState().values, field: nameState() })}</output>
<button type="button" onclick={() => nameApi.setValue('hooked')}>字段写入</button>
<button type="button" onclick={() => nameApi.setError('出错')}>字段报错</button>
<button type="button" onclick={() => formApi.setValue('name', 'form')}>表单写入</button>
