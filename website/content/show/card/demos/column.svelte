<script lang="ts">
    import { Card, Col, Row } from '@fibrae/semi-ui-svelte';

    const rows = [
        [8, 8, 8],
        [16, 8],
    ];
</script>

<div style="background-color: var(--semi-color-fill-0); padding: 20px">
    {#each rows as spans, rowIndex (rowIndex)}
        <Row gutter={[16, 16]}>
            {#each spans as span, colIndex (colIndex)}
                <Col {span}>
                    <Card bordered={false} title="Card Title">Card Content</Card>
                </Col>
            {/each}
        </Row>
    {/each}
</div>
