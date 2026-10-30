<script lang="ts">
    import { Col, Form, FormDatePicker, FormInput, FormSelect, Row, type RuleItem } from '@fibrae/semi-ui-svelte';

    const nickNameRules: RuleItem[] = [
        { required: true, message: 'required error' },
        { type: 'string', message: 'type error' },
        { validator: (_rule, value) => value === 'semi', message: 'should be semi' },
    ];
    const businessOptions = [
        { label: 'Semi', value: 'abc' },
        { label: '轻颜相机', value: 'ulikeCam' },
        { label: '今日头条', value: 'toutiao' },
    ];
    const roleOptions = [
        { label: '运营', value: 'operate' },
        { label: '开发', value: 'rd' },
        { label: '产品', value: 'pm' },
        { label: '设计', value: 'ued' },
    ];
</script>

<Form labelPosition="top" style="padding: 10px">
    <Row>
        <Col span={8}>
            <FormInput field="nickName1" label="用户名" rules={nickNameRules} style="width: 250px" trigger="blur" />
        </Col>
        <Col span={8}>
            <FormDatePicker field="date1" label="有效日期" style="width: 250px" />
        </Col>
        <Col span={8}>
            <FormSelect field="business1" label="业务线" optionList={businessOptions} style="width: 250px" />
        </Col>
    </Row>
    <Row>
        <Col span={6}>
            <FormInput field="nickName2" label="用户名" rules={nickNameRules} style="width: 200px" trigger="blur" />
        </Col>
        <Col span={6}>
            <FormDatePicker field="date2" label="有效日期" style="width: 200px" />
        </Col>
        <Col span={6}>
            <FormSelect field="business2" label="业务线" optionList={businessOptions} style="width: 200px" />
        </Col>
        <Col span={6}>
            <FormSelect field="role" label="角色" optionList={roleOptions} style="width: 200px" />
        </Col>
    </Row>
</Form>
