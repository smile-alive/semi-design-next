<script lang="ts">
    import { type Component, untrack } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { blankRow, describeSchemaField, type JsonSchema, type SchemaFieldKind, type SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';
    import { formatLocale } from '@fibrae/semi-foundation/locale';
    import { warning } from '@fibrae/semi-foundation/utils';
    import { IconArrowDown, IconArrowUp, IconDelete, IconPlus } from '@fibrae/semi-icons-svelte';
    import Button from '../../button/button.svelte';
    import useLocale from '../../locale/use-locale.svelte.js';
    import ArrayField from '../array-field.svelte';
    import FormInputNumber from '../fields/form-input-number.svelte';
    import FormInput from '../fields/form-input.svelte';
    import FormSelect from '../fields/form-select.svelte';
    import FormSwitch from '../fields/form-switch.svelte';
    import FormTextArea from '../fields/form-text-area.svelte';
    import type { SchemaFieldProps } from '../interface.js';
    import FormSection from '../section.svelte';
    import SchemaNode from './schema-node.svelte';

    interface SchemaNodeProps extends Pick<SchemaFieldProps, 'widgets' | 'renderField'> {
        root: JsonSchema;
        node: SchemaFieldNode;
    }

    let { root, node, widgets, renderField }: SchemaNodeProps = $props();

    const locale = useLocale('Form');

    const rowClass = `${cssClasses.PREFIX}-schema-array-row`;
    const builtins: Partial<Record<SchemaFieldKind, Component<any, any, any>>> = { input: FormInput, textarea: FormTextArea, number: FormInputNumber, switch: FormSwitch, select: FormSelect };
    const renderer = $derived(renderField?.[node.pattern]);
    const Control = $derived((node.format !== undefined && widgets?.[node.format]) || widgets?.[node.kind] || builtins[node.kind]);
    const label = $derived({ text: node.title ?? itemText('item', Number(node.key)), required: node.required });

    const controlProps = $derived.by((): Record<string, unknown> => {
        switch (node.kind) {
            case 'input':
                return { maxLength: node.maxLength };
            case 'textarea':
                return { maxCount: node.maxLength };
            case 'number':
                return { min: node.minimum, max: node.maximum, precision: node.integer ? 0 : undefined };
            case 'select':
                return { optionList: node.options, multiple: node.multiple };
            default:
                return {};
        }
    });

    function itemText(key: 'item' | 'removeItem' | 'moveUpItem' | 'moveDownItem', index: number) {
        return formatLocale(locale().locale[key], { index: index + 1 });
    }

    untrack(() => warning(node.kind === 'unsupported' && !renderer && !Control, `[Semi Form] SchemaField cannot render "${node.field}": its JSON Schema maps to no control; give it a renderField entry or a widget`));
</script>

{#snippet description()}{node.description}{/snippet}

{#snippet sectionText()}{label.text}{/snippet}

{#snippet properties()}
    {#each node.children ?? [] as child (child.field)}
        <SchemaNode node={child} {renderField} {root} {widgets} />
    {/each}
{/snippet}

{#if renderer}
    {@render renderer({ node, field: node.field })}
{:else if Control}
    <Control {...controlProps} extraText={node.description ? description : undefined} field={node.field} initValue={node.default} {label} />
{:else if node.kind === 'object'}
    {#if node.field === ''}
        {@render properties()}
    {:else}
        <FormSection text={sectionText}>{@render properties()}</FormSection>
    {/if}
{:else if node.kind === 'array'}
    {#if node.field === ''}
        {@render arrayField()}
    {:else}
        <FormSection text={sectionText}>{@render arrayField()}</FormSection>
    {/if}
{/if}

{#snippet arrayField()}
    <ArrayField field={node.field}>
        {#snippet children({ arrayFields, onAddWithInitValue, onMove })}
            {#each arrayFields as item, index (item.key)}
                <div class={rowClass}>
                    <div class="{rowClass}-content">
                        <SchemaNode node={describeSchemaField(root, item.field)} {renderField} {root} {widgets} />
                    </div>
                    <div class="{rowClass}-actions">
                        <Button aria-label={itemText('moveUpItem', index)} disabled={index === 0} theme="borderless" type="tertiary" onclick={() => onMove(index, index - 1)}>
                            {#snippet icon()}<IconArrowUp />{/snippet}
                        </Button>
                        <Button aria-label={itemText('moveDownItem', index)} disabled={index === arrayFields.length - 1} theme="borderless" type="tertiary" onclick={() => onMove(index, index + 1)}>
                            {#snippet icon()}<IconArrowDown />{/snippet}
                        </Button>
                        {#if !node.fixed}
                            <Button aria-label={itemText('removeItem', index)} disabled={node.minItems !== undefined && arrayFields.length <= node.minItems} theme="borderless" type="tertiary" onclick={item.onRemove}>
                                {#snippet icon()}<IconDelete />{/snippet}
                            </Button>
                        {/if}
                    </div>
                </div>
            {/each}
            {#if !node.fixed}
                <Button disabled={node.maxItems !== undefined && arrayFields.length >= node.maxItems} onclick={() => onAddWithInitValue(blankRow(root, node), arrayFields.length)}>
                    {#snippet icon()}<IconPlus />{/snippet}
                    {locale().locale.addItem}
                </Button>
            {/if}
        {/snippet}
    </ArrayField>
{/snippet}
