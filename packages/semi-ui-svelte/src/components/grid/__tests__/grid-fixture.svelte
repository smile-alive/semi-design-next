<script lang="ts">
    import Col from '../col.svelte';
    import type { ColProps, RowProps } from '../interface';
    import Row from '../row.svelte';

    let { store }: { store: { row: RowProps; col: ColProps; nested?: RowProps } } = $props();
</script>

<Row {...store.row}>
    <Col {...store.col}>
        {#if store.nested}
            <Row {...store.nested} class="inner">
                <Col class="inner-col" />
            </Row>
        {:else}
            <span>child</span>
        {/if}
    </Col>
</Row>
