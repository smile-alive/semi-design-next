<script lang="ts">
    import { Col, Row } from '@fibrae/semi-ui-svelte';
</script>

<div class="grid">
    <Row gutter={{ xs: 16, sm: 16, md: 16, lg: 24, xl: 24, xxl: 24 }}>
        <Col lg={8} md={6} sm={4} xl={10} xs={2}>
            <div class="col-content">Col</div>
        </Col>
        <Col lg={8} md={12} sm={16} xl={4} xs={20}>
            <div class="col-content">Col</div>
        </Col>
        <Col lg={8} md={6} sm={4} xl={10} xs={2}>
            <div class="col-content">Col</div>
        </Col>
    </Row>
    <br />
    <Row>
        <Col lg={{ span: 6, offset: 2 }} xs={{ span: 5, offset: 1 }}>
            <div class="col-content">Col</div>
        </Col>
        <Col lg={{ span: 6, offset: 2 }} xs={{ span: 11, offset: 1 }}>
            <div class="col-content">Col</div>
        </Col>
        <Col lg={{ span: 6, offset: 2 }} xs={{ span: 5, offset: 1 }}>
            <div class="col-content">Col</div>
        </Col>
    </Row>
</div>
