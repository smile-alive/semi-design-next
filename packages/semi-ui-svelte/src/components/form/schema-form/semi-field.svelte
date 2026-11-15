<script lang="ts">
    import type { Component } from 'svelte';
    import { controlProps, schemaFieldWarnings, singleItemName, type SchemaFieldKind, type SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';
    import { formatLocale } from '@fibrae/semi-foundation/locale';
    import { warning } from '@fibrae/semi-foundation/utils';
    import useLocale from '../../locale/use-locale.svelte.js';
    import FormInputNumber from '../fields/form-input-number.svelte';
    import FormInput from '../fields/form-input.svelte';
    import FormSelect from '../fields/form-select.svelte';
    import FormSwitch from '../fields/form-switch.svelte';
    import FormTextArea from '../fields/form-text-area.svelte';

    let { node }: { node: SchemaFieldNode } = $props();

    const locale = useLocale('Form');

    const controls: Partial<Record<SchemaFieldKind, Component<any, any, any>>> = { input: FormInput, textarea: FormTextArea, number: FormInputNumber, switch: FormSwitch, select: FormSelect };
    const Control = $derived(controls[node.kind]);
    const itemName = $derived(singleItemName(node, locale().locale));

    // Svelte's Input names the native attribute `maxlength`
    const controlAttrs = $derived.by(() => {
        const { maxLength, ...rest } = controlProps(node);
        return node.kind === 'input' ? { ...rest, maxlength: maxLength } : rest;
    });

    const label = $derived({ text: node.title ?? formatLocale(locale().locale.item, { index: (node.item?.index ?? 0) + 1 }), required: node.required });

    $effect(() => {
        warning(!Control, schemaFieldWarnings.unsupported(node.field));
    });
</script>

{#snippet description()}{node.description}{/snippet}

{#if Control}
    {#if itemName === undefined}
        <Control {...controlAttrs} extraText={node.description ? description : undefined} field={node.field} initValue={node.default} {label} />
    {:else}
        <Control {...controlAttrs} aria-label={itemName} field={node.field} initValue={node.default} noLabel />
    {/if}
{/if}
