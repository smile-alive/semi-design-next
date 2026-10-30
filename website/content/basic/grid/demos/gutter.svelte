<script lang="ts">
    import { Col, Row } from '@fibrae/semi-ui-svelte';

    const cols = [1, 2, 3, 4, 5, 6, 7, 8];
</script>

<div class="grid grid-gutter">
    <p>horizontal</p>
    <hr />
    <Row gutter={16}>
        {#each cols as col (col)}
            <Col span={6}>
                <div class="col-content">col-6</div>
            </Col>
        {/each}
    </Row>
    <p>vertical</p>
    <hr />
    <Row gutter={[16, 24]}>
        {#each cols as col (col)}
            <Col span={6}>
                <div class="col-content">col-6</div>
            </Col>
        {/each}
    </Row>
</div>
