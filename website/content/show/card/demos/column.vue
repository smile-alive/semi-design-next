<script setup lang="ts">
    import { Card, Col, Row } from '@fibrae/semi-ui-vue';

    const rows = [
        [8, 8, 8],
        [16, 8],
    ];
</script>

<template>
    <div :style="{ backgroundColor: 'var(--semi-color-fill-0)', padding: '20px' }">
        <Row v-for="(spans, rowIndex) in rows" :key="rowIndex" :gutter="[16, 16]">
            <Col v-for="(span, colIndex) in spans" :key="colIndex" :span="span">
                <Card :bordered="false" title="Card Title">Card Content</Card>
            </Col>
        </Row>
    </div>
</template>
