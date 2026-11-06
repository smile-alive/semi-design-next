<script lang="ts">
    import { Col, Row } from '@fibrae/semi-ui-svelte';
</script>

<div class="grid grid-flex">
    <p>Align Top</p>
    <Row align="top" justify="center" type="flex">
        <Col span={4}>
            <div class="col-content">col-4</div>
        </Col>
        <Col span={4}>
            <div class="col-content">col-4</div>
        </Col>
        <Col span={4}>
            <div class="col-content">col-4</div>
        </Col>
        <Col span={4}>
            <div class="col-content">col-4</div>
        </Col>
    </Row>

    <p>Align Center</p>
    <Row align="middle" justify="space-around" type="flex">
        <Col span={4}>
            <div class="col-content">col-4</div>
        </Col>
        <Col span={4}>
            <div class="col-content">col-4</div>
        </Col>
        <Col span={4}>
            <div class="col-content">col-4</div>
        </Col>
        <Col span={4}>
            <div class="col-content">col-4</div>
        </Col>
    </Row>

    <p>Align Bottom</p>
    <Row align="bottom" justify="space-between" type="flex">
        <Col span={4}>
            <div class="col-content">col-4</div>
        </Col>
        <Col span={4}>
            <div class="col-content">col-4</div>
        </Col>
        <Col span={4}>
            <div class="col-content">col-4</div>
        </Col>
        <Col span={4}>
            <div class="col-content">col-4</div>
        </Col>
    </Row>
</div>
