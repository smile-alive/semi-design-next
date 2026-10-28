<script setup lang="ts">
    import { Checkbox, CheckboxGroup, Col, Row } from '@fibrae/semi-ui-vue';

    const values = ['A', 'B', 'C', 'D', 'E'];
</script>

<template>
    <CheckboxGroup aria-label="CheckboxGroup 示例" :style="{ width: '100%' }">
        <Row>
            <Col v-for="value in values" :key="value" :span="8">
                <Checkbox :value="value">{{ value }}</Checkbox>
            </Col>
        </Row>
    </CheckboxGroup>
</template>
