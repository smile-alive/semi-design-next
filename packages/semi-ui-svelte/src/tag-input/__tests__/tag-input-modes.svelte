<script lang="ts">
    import TagInput from '../tag-input.svelte';

    interface Store {
        value?: string[] | null;
        inputValue?: string;
        accept: boolean;
        log: string[];
    }

    // `target` is the prop under test; the other one is left out
    let { target, mode, store }: { target: 'value' | 'inputValue'; mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: Store } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if target === 'value'}
    {#if mode === 'bind'}
        <TagInput bind:value={store.value} onChange={(value) => log(`change ${value}`)} />
    {:else if mode === 'function'}
        <TagInput
            bind:value={
                () => store.value,
                (value) => {
                    log(`set ${value}`);
                    if (store.accept) store.value = value;
                }
            }
            onChange={(value) => log(`change ${value}`)}
        />
    {:else if mode === 'one-way'}
        <TagInput onChange={(value) => log(`change ${value}`)} value={store.value} />
    {:else}
        <TagInput onChange={(value) => log(`change ${value}`)} />
    {/if}
{:else if mode === 'bind'}
    <TagInput bind:inputValue={store.inputValue} onInputChange={(text) => log(`input ${text}`)} />
{:else if mode === 'function'}
    <TagInput
        bind:inputValue={
            () => store.inputValue,
            (text) => {
                log(`set ${text}`);
                if (store.accept) store.inputValue = text;
            }
        }
        onInputChange={(text) => log(`input ${text}`)}
    />
{:else if mode === 'one-way'}
    <TagInput inputValue={store.inputValue} onInputChange={(text) => log(`input ${text}`)} />
{:else}
    <TagInput onInputChange={(text) => log(`input ${text}`)} />
{/if}
