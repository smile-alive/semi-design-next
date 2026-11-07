<script lang="ts">
    import CheckboxGroup from '../checkbox-group.svelte';
    import Checkbox from '../checkbox.svelte';
    import type { CheckboxEvent, CheckboxValue } from '../interface';

    type Scene = 'rejecting-indeterminate' | 'check-all' | 'interactive' | 'propagation' | 'late' | 'group-children' | 'group-mixed' | 'group-labels' | 'form';

    let { scene, stop = true, store }: { scene: Scene; stop?: boolean; store: { log: string[]; show: boolean } } = $props();

    const all = ['a', 'b', 'c'];
    let checkedList = $state<CheckboxValue[]>(['a']);
    const checkAll = $derived(checkedList.length === all.length);
    const indeterminate = $derived(checkedList.length > 0 && !checkAll);

    const onCheckAllChange = (event: CheckboxEvent) => {
        checkedList = event.target.checked ? all : [];
    };
    const onItemChange = (event: CheckboxEvent) => {
        if (stop) {
            event.stopPropagation();
            event.preventDefault();
        }
    };
</script>

{#if scene === 'rejecting-indeterminate'}
    <Checkbox bind:checked={() => false, (value) => store.log.push(`set ${value}`)} indeterminate>partial</Checkbox>
{:else if scene === 'check-all'}
    <Checkbox checked={checkAll} {indeterminate} onChange={onCheckAllChange}>all</Checkbox>
    <CheckboxGroup bind:value={checkedList} options={all} />
{:else if scene === 'interactive'}
    <Checkbox onChange={() => store.log.push('change')}>
        accept <a href="#terms" onclick={(event) => event.preventDefault()}>terms</a>
        <button type="button">more</button>
        {#snippet extra()}
            <a href="#extra" onclick={(event) => event.preventDefault()}>extra link</a>
        {/snippet}
    </Checkbox>
{:else if scene === 'propagation'}
    <div role="presentation" onclick={() => store.log.push('parent')}>
        <Checkbox onChange={onItemChange} />
    </div>
{:else if scene === 'late'}
    {#if store.show}
        <Checkbox autofocus>label</Checkbox>
    {/if}
{:else if scene === 'group-children'}
    <CheckboxGroup onChange={(value) => store.log.push(JSON.stringify(value))} value={['A']}>
        {#each ['A', 'B', 'C'] as item (item)}
            <Checkbox onChange={() => store.log.push(`item ${item}`)} value={item}>{item}</Checkbox>
        {/each}
    </CheckboxGroup>
{:else if scene === 'group-mixed'}
    <CheckboxGroup aria-invalid={true} onChange={(value) => store.log.push(JSON.stringify(value))} value={['a']}>
        <Checkbox value="a">A</Checkbox>
        <Checkbox aria-invalid={false} value="b">B</Checkbox>
        <Checkbox onChange={() => store.log.push('free')}>free</Checkbox>
    </CheckboxGroup>
{:else if scene === 'group-labels'}
    <CheckboxGroup options={['plain', { label: 'B', value: 'b', extra: 'x' }]}>
        {#snippet label({ option, index })}
            <i>{index}:{option.label}</i>
        {/snippet}
        {#snippet extra({ option })}
            <b>extra-{String(option.value)}</b>
        {/snippet}
    </CheckboxGroup>
{:else}
    <form data-testid="form" onsubmit={(event) => event.preventDefault()}>
        <Checkbox checked name="fruit" value="apple">apple</Checkbox>
        <Checkbox name="plain">plain</Checkbox>
    </form>
{/if}
