<script setup lang="ts">
    import { Col, Row } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div class="grid">
        <Row>
            <Col :span="8">
                <div class="col-content">col-8</div>
            </Col>
            <Col :offset="8" :span="8">
                <div class="col-content">col-8</div>
            </Col>
        </Row>
        <br />
        <Row>
            <Col :offset="6" :span="6">
                <div class="col-content">col-6</div>
            </Col>
            <Col :offset="6" :span="6">
                <div class="col-content">col-6</div>
            </Col>
        </Row>
        <br />
        <Row>
            <Col :offset="6" :span="12">
                <div class="col-content">col-12</div>
            </Col>
        </Row>
    </div>
</template>
