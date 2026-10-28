<script setup lang="ts">
    import { Col, Row } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div class="grid grid-gutter">
        <p>horizontal</p>
        <hr />
        <Row :gutter="16">
            <Col v-for="i in 8" :key="i" :span="6">
                <div class="col-content">col-6</div>
            </Col>
        </Row>
        <p>vertical</p>
        <hr />
        <Row :gutter="[16, 24]">
            <Col v-for="i in 8" :key="i" :span="6">
                <div class="col-content">col-6</div>
            </Col>
        </Row>
    </div>
</template>
