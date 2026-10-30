<script lang="ts">
    import { Checkbox, CheckboxGroup, Col, Row } from '@fibrae/semi-ui-svelte';

    const values = ['A', 'B', 'C', 'D', 'E'];
</script>

<CheckboxGroup aria-label="CheckboxGroup 示例" style="width: 100%">
    <Row>
        {#each values as value (value)}
            <Col span={8}>
                <Checkbox {value}>{value}</Checkbox>
            </Col>
        {/each}
    </Row>
</CheckboxGroup>
