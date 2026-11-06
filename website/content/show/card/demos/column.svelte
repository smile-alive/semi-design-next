<script lang="ts">
    import { Card, Col, Row } from '@fibrae/semi-ui-svelte';
</script>

<div style="background-color: var(--semi-color-fill-0); padding: 20px">
    <Row gutter={[16, 16]}>
        <Col span={8}>
            <Card bordered={false} title="Card Title">Card Content</Card>
        </Col>
        <Col span={8}>
            <Card bordered={false} title="Card Title">Card Content</Card>
        </Col>
        <Col span={8}>
            <Card bordered={false} title="Card Title">Card Content</Card>
        </Col>
    </Row>
    <Row gutter={[16, 16]}>
        <Col span={16}>
            <Card bordered={false} title="Card Title">Card Content</Card>
        </Col>
        <Col span={8}>
            <Card bordered={false} title="Card Title">Card Content</Card>
        </Col>
    </Row>
</div>
