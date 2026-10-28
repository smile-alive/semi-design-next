<script setup lang="ts">
    import { Col, Row } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div class="grid">
        <Row>
            <Col :span="24">
                <div class="col-content">col-24</div>
            </Col>
        </Row>
        <br />
        <Row>
            <Col :span="12">
                <div class="col-content">col-12</div>
            </Col>
            <Col :span="12">
                <div class="col-content">col-12</div>
            </Col>
        </Row>
        <br />
        <Row>
            <Col :span="8">
                <div class="col-content">col-8</div>
            </Col>
            <Col :span="8">
                <div class="col-content">col-8</div>
            </Col>
            <Col :span="8">
                <div class="col-content">col-8</div>
            </Col>
        </Row>
        <br />
        <Row>
            <Col :span="6">
                <div class="col-content">col-6</div>
            </Col>
            <Col :span="6">
                <div class="col-content">col-6</div>
            </Col>
            <Col :span="6">
                <div class="col-content">col-6</div>
            </Col>
            <Col :span="6">
                <div class="col-content">col-6</div>
            </Col>
        </Row>
    </div>
</template>
