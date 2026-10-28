<script setup lang="ts">
    import { Col, Row } from '@fibrae/semi-ui-vue';

    const rows = [
        { title: 'Align Top', justify: 'center', align: 'top' },
        { title: 'Align Center', justify: 'space-around', align: 'middle' },
        { title: 'Align Bottom', justify: 'space-between', align: 'bottom' },
    ] as const;
</script>

<template>
    <div class="grid grid-flex">
        <template v-for="row in rows" :key="row.title">
            <p>{{ row.title }}</p>
            <Row :align="row.align" :justify="row.justify" type="flex">
                <Col v-for="i in 4" :key="i" :span="4">
                    <div class="col-content">col-4</div>
                </Col>
            </Row>
        </template>
    </div>
</template>
