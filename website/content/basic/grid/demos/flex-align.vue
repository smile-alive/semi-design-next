<script setup lang="ts">
    import { Col, Row } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div class="grid grid-flex">
        <p>Align Top</p>
        <Row align="top" justify="center">
            <Col :span="4">
                <div class="col-content">col-4</div>
            </Col>
            <Col :span="4">
                <div class="col-content">col-4</div>
            </Col>
            <Col :span="4">
                <div class="col-content">col-4</div>
            </Col>
            <Col :span="4">
                <div class="col-content">col-4</div>
            </Col>
        </Row>

        <p>Align Center</p>
        <Row align="middle" justify="space-around">
            <Col :span="4">
                <div class="col-content">col-4</div>
            </Col>
            <Col :span="4">
                <div class="col-content">col-4</div>
            </Col>
            <Col :span="4">
                <div class="col-content">col-4</div>
            </Col>
            <Col :span="4">
                <div class="col-content">col-4</div>
            </Col>
        </Row>

        <p>Align Bottom</p>
        <Row align="bottom" justify="space-between">
            <Col :span="4">
                <div class="col-content">col-4</div>
            </Col>
            <Col :span="4">
                <div class="col-content">col-4</div>
            </Col>
            <Col :span="4">
                <div class="col-content">col-4</div>
            </Col>
            <Col :span="4">
                <div class="col-content">col-4</div>
            </Col>
        </Row>
    </div>
</template>
