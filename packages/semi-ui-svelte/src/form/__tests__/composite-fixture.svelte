<script lang="ts">
    import { onMount } from 'svelte';
    import ArrayField from '../array-field.svelte';
    import FormInput from '../form-input.svelte';
    import Form from '../form.svelte';
    import InputGroup from '../input-group.svelte';
    import type { FormApi } from '../interface';
    import Section from '../section.svelte';
    import Slot from '../slot.svelte';
    import useForm from '../use-form.svelte';
    import HooksProbe from './hooks-probe.svelte';

    let { kind, initValues, onApi, onExternal }: { kind: 'array' | 'arrayFromForm' | 'group' | 'hooks' | 'layout' | 'useForm'; initValues?: Record<string, unknown>; onApi?: (api: FormApi) => void; onExternal?: (external: ReturnType<typeof useForm>) => void } = $props();

    const external = useForm();
    let formShown = $state(true);

    onMount(() => onExternal?.(external));
</script>

{#if kind === 'useForm'}
    <button type="button" onclick={() => (formShown = !formShown)}>切换表单</button>
    {#if formShown}
        <Form form={external.formApi} initValues={{ name: 'init' }}>
            <FormInput field="name" keepState label="名称" />
        </Form>
    {/if}
    <output data-testid="external">{JSON.stringify(external.values)}</output>
    <button type="button" onclick={() => external.formApi.setValue('name', 'outside')}>外部写入</button>
{:else}
    <Form getFormApi={onApi} {initValues}>
        {#if kind === 'array' || kind === 'arrayFromForm'}
            <ArrayField field="rules" initValue={kind === 'array' ? [{ name: 'a' }, { name: 'b' }] : undefined}>
                {#snippet children({ arrayFields, onAdd, onAddWithInitValue })}
                    {#each arrayFields as { key, field, onRemove } (key)}
                        <div data-testid="row">
                            <FormInput field={`${field}.name`} label="名字" />
                            <button type="button" onclick={onRemove}>删除</button>
                        </div>
                    {/each}
                    <button type="button" onclick={onAdd}>新增</button>
                    <button type="button" onclick={() => onAddWithInitValue({ name: 'top' }, 0)}>头部插入</button>
                {/snippet}
            </ArrayField>
        {:else if kind === 'hooks'}
            <FormInput field="name" label="名称" />
            <HooksProbe />
        {:else if kind === 'group'}
            <InputGroup label="地址">
                <FormInput field="city" rules={[{ required: true, message: '城市必填' }]} />
                <FormInput field="street" />
            </InputGroup>
        {:else}
            <Section>
                {#snippet text()}基本信息{/snippet}
                <FormInput field="name" label="名称" />
            </Section>
            <Slot error="说明有误" label="说明">
                <span>只读内容</span>
            </Slot>
        {/if}
    </Form>
{/if}
