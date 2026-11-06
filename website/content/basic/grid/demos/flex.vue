<script setup lang="ts">
    import { Col, Row } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div class="grid">
        <p>sub-element align left</p>
        <Row justify="start" type="flex">
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

        <p>sub-element align center</p>
        <Row justify="center" type="flex">
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

        <p>sub-element align right</p>
        <Row justify="end" type="flex">
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

        <p>sub-element monospaced arrangement</p>
        <Row justify="space-between" type="flex">
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

        <p>sub-element align full</p>
        <Row justify="space-around" type="flex">
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
