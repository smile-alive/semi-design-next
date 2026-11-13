<script lang="ts">
    import type { InputSpecProps } from '@test/specs/input';
    import Input from '../input.svelte';

    let { store }: { store: InputSpecProps } = $props();

    const rest = $derived.by(() => {
        const { value, defaultValue, className, maxLength, minLength, prefix, suffix, addonBefore, addonAfter, insetLabel, ...others } = store;
        return { ...others, class: className, maxlength: maxLength, minlength: minLength };
    });
    // Svelte has no `defaultValue` and a one-way `value` lets the component override it locally: the spec's default is
    // the binding's initial value and its controlled value goes through a function binding that ignores writes
    // svelte-ignore state_referenced_locally
    let typed = $state<string | number | undefined>(store.defaultValue);
</script>

{#snippet prefix()}{store.prefix}{/snippet}
{#snippet suffix()}{store.suffix}{/snippet}
{#snippet addonBefore()}{store.addonBefore}{/snippet}
{#snippet addonAfter()}{store.addonAfter}{/snippet}
{#snippet insetLabel()}{store.insetLabel}{/snippet}

<Input
    bind:value={
        () => (store.value === undefined ? typed : store.value),
        (next) => {
            typed = next;
        }
    }
    {...rest}
    {...store.prefix === undefined ? {} : { prefix }}
    {...store.suffix === undefined ? {} : { suffix }}
    {...store.addonBefore === undefined ? {} : { addonBefore }}
    {...store.addonAfter === undefined ? {} : { addonAfter }}
    {...store.insetLabel === undefined ? {} : { insetLabel }}
/>
