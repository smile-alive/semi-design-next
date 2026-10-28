<script setup lang="ts">
    import { Col, Row } from '@fibrae/semi-ui-vue';

    const rows = [
        { title: 'sub-element align left', justify: 'start' },
        { title: 'sub-element align center', justify: 'center' },
        { title: 'sub-element align right', justify: 'end' },
        { title: 'sub-element monospaced arrangement', justify: 'space-between' },
        { title: 'sub-element align full', justify: 'space-around' },
    ] as const;
</script>

<template>
    <div class="grid">
        <template v-for="row in rows" :key="row.title">
            <p>{{ row.title }}</p>
            <Row :justify="row.justify" type="flex">
                <Col v-for="i in 4" :key="i" :span="4">
                    <div class="col-content">col-4</div>
                </Col>
            </Row>
        </template>
    </div>
</template>
