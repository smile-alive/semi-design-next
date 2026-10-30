<script lang="ts">
    import { Col, Row } from '@fibrae/semi-ui-svelte';

    const rows = [
        { title: 'Align Top', justify: 'center', align: 'top' },
        { title: 'Align Center', justify: 'space-around', align: 'middle' },
        { title: 'Align Bottom', justify: 'space-between', align: 'bottom' },
    ] as const;
    const cols = [1, 2, 3, 4];
</script>

<div class="grid grid-flex">
    {#each rows as row (row.title)}
        <p>{row.title}</p>
        <Row align={row.align} justify={row.justify} type="flex">
            {#each cols as col (col)}
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
            {/each}
        </Row>
    {/each}
</div>
