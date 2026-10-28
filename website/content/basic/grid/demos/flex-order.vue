<script setup lang="ts">
    import { Col, Row } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div class="grid">
        <Row type="flex">
            <Col :order="4" :span="6">
                <div class="col-content">col-4</div>
            </Col>
            <Col :order="3" :span="6">
                <div class="col-content">col-3</div>
            </Col>
            <Col :order="2" :span="6">
                <div class="col-content">col-2</div>
            </Col>
            <Col :order="1" :span="6">
                <div class="col-content">col-1</div>
            </Col>
        </Row>
    </div>
</template>
