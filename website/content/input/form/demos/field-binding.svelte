<script lang="ts">
    import { Col, Form, FormInput, FormLabel, Row, TextArea, Toast } from '@fibrae/semi-ui-svelte';
</script>

<Form onSubmit={(values) => Toast.info({ content: JSON.stringify(values) })}>
    {#snippet children(form)}
        <Row>
            <Col span={12}>
                <FormInput aria-label="username" field="username" placeholder="请尝试输入值" />
                <FormInput aria-label="user[0]" field="user[0]" placeholder="请尝试输入值" />
                <FormInput aria-label="siblings.1" field="siblings.1" placeholder="请尝试输入值" />
                <FormInput aria-label="siblings['2']" field="siblings['2']" placeholder="请尝试输入值" />
                <FormInput aria-label="parents[0].name" field="parents[0].name" placeholder="请尝试输入值" />
                <FormInput aria-label="parents[1]['name']" field="parents[1]['name']" placeholder="请尝试输入值" />
            </Col>
            <Col offset={1} span={10} style="margin-block-start: 12px">
                <FormLabel text="FormState实时映射值：" />
                <TextArea aria-label="FormState实时映射值" value={JSON.stringify(form.formState.values)} />
            </Col>
        </Row>
    {/snippet}
</Form>
