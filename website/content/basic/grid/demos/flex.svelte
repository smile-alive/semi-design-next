<script lang="ts">
    import { Col, Row } from '@fibrae/semi-ui-svelte';

    const rows = [
        { title: 'sub-element align left', justify: 'start' },
        { title: 'sub-element align center', justify: 'center' },
        { title: 'sub-element align right', justify: 'end' },
        { title: 'sub-element monospaced arrangement', justify: 'space-between' },
        { title: 'sub-element align full', justify: 'space-around' },
    ] as const;
    const cols = [1, 2, 3, 4];
</script>

<div class="grid">
    {#each rows as row (row.title)}
        <p>{row.title}</p>
        <Row justify={row.justify} type="flex">
            {#each cols as col (col)}
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
            {/each}
        </Row>
    {/each}
</div>
