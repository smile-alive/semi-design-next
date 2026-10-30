<script lang="ts">
    import { Button, Form, FormInput, FormSelect, TextArea, type FormApi } from '@fibrae/semi-ui-svelte';

    interface Effect {
        name: string;
        type: string;
        key: number;
    }

    interface FormValues {
        effects: Effect[];
    }

    const initValues: FormValues = {
        effects: [
            { name: '脸部贴纸', type: '2D', key: 1 },
            { name: '背景贴纸', type: '3D', key: 2 },
        ],
    };
    const typeOptions = [
        { label: '2D', value: '2D' },
        { label: '3D', value: '3D' },
    ];

    let formApi: FormApi<FormValues> | undefined;
    let nextKey = 3;

    const add = () => {
        const effects = formApi?.getValue('effects') ?? [];
        formApi?.setValue('effects', [...effects, { name: '', type: '', key: nextKey++ }]);
    };

    const remove = (key: number) => {
        const effects = (formApi?.getValue('effects') ?? []).filter((effect) => key !== effect.key);
        formApi?.setValue('effects', effects.length ? effects : undefined);
    };
</script>

<Form getFormApi={(api) => (formApi = api)} {initValues} labelPosition="left" labelWidth="180px" style="width: 500px">
    {#snippet children({ values })}
        <Button onclick={add}>添加</Button>
        {#each values.effects ?? [] as effect, i (effect.key)}
            <div style="width: 1000px; display: flex">
                <FormInput aria-label={`特效 ${i + 1} 名称`} field={`effects[${i}].name`} style="width: 200px; margin-right: 12px" />
                <FormSelect field={`effects[${i}].type`} optionList={typeOptions} style="width: 90px" />
                <Button style="margin: 12px" type="danger" onclick={() => remove(effect.key)}>删除</Button>
            </div>
        {/each}
        <TextArea aria-label="表单值" style="margin-top: 10px" value={JSON.stringify(values)} />
    {/snippet}
</Form>
