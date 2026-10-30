<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { ClassValue } from 'svelte/elements';
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import Col from '../grid/col.svelte';
    import type { ColProps } from '../grid/interface.js';
    import Row from '../grid/row.svelte';

    interface FieldGridProps {
        label?: Snippet;
        /** The main content: the control, its messages and extra text */
        children?: Snippet;
        mainClass?: ClassValue;
        labelAlign?: string;
        labelCol?: ColProps;
        wrapperCol?: ColProps;
        labelPosition?: string;
        /** Wraps the columns in their own Row, for a field whose columns the Form does not set */
        row?: boolean;
    }

    let { label, children, mainClass, labelAlign, labelCol, wrapperCol, labelPosition, row }: FieldGridProps = $props();

    const prefix = cssClasses.PREFIX;
</script>

{#snippet labelColumn()}
    <Col {...labelCol} class={[labelCol?.class, { [`${prefix}-col-${labelAlign}`]: labelAlign }]}>{@render label?.()}</Col>
{/snippet}

{#snippet columns()}
    <!-- a top label needs an overflow hidden wrapper, or it lays out horizontally -->
    {#if labelPosition === 'top'}
        <div style="overflow: hidden">{@render labelColumn()}</div>
    {:else}
        {@render labelColumn()}
    {/if}
    <Col {...wrapperCol}>
        <div class={mainClass}>{@render children?.()}</div>
    </Col>
{/snippet}

{#if !(labelCol && wrapperCol)}
    {@render label?.()}
    <div class={mainClass}>{@render children?.()}</div>
{:else if row}
    <Row>{@render columns()}</Row>
{:else}
    {@render columns()}
{/if}
