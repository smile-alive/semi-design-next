<script setup lang="ts">
    import type { StyleValue } from 'vue';
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import {
        Button,
        Col,
        Form,
        FormCascader,
        FormCheckbox,
        FormCheckboxGroup,
        FormDatePicker,
        FormInput,
        FormInputNumber,
        FormRadio,
        FormRadioGroup,
        FormRating,
        FormSection,
        FormSelect,
        FormSlider,
        FormSwitch,
        FormTagInput,
        FormTextArea,
        FormTimePicker,
        FormTreeSelect,
        FormUpload,
        Row,
        Space,
    } from '@fibrae/semi-ui-vue';

    const today = new Date(2024, 4, 6, 10, 30, 0);

    const initValues = {
        name: 'semi',
        business: ['ulikeCam'],
        role: 'ued',
        switch: true,
        files: [
            {
                uid: '1',
                name: 'vigo.png',
                status: 'success',
                size: '130KB',
                preview: true,
                url: '/assets/placeholder/avatar-d.svg',
            },
            {
                uid: '2',
                name: 'resso.jpeg',
                status: 'validateFail',
                size: '222KB',
                percent: 50,
                preview: true,
                fileInstance: new File([new ArrayBuffer(2048)], 'resso.jpeg', { type: 'image/jpeg' }),
                url: '/assets/placeholder/avatar-b.svg',
            },
            {
                uid: '3',
                name: 'douyin.jpeg',
                status: 'uploading',
                size: '222KB',
                percent: 50,
                preview: true,
                fileInstance: new File([new ArrayBuffer(2048)], 'dy.jpeg', { type: 'image/jpeg' }),
                url: '/assets/placeholder/avatar-a.svg',
            },
        ],
    };

    const treeData = [
        {
            label: '亚洲',
            value: 'Asia',
            key: '0',
            children: [
                {
                    label: '中国',
                    value: 'China',
                    key: '0-0',
                    children: [
                        {
                            label: '北京',
                            value: 'Beijing',
                            key: '0-0-0',
                        },
                        {
                            label: '上海',
                            value: 'Shanghai',
                            key: '0-0-1',
                        },
                    ],
                },
            ],
        },
        {
            label: '北美洲',
            value: 'North America',
            key: '1',
        },
    ];

    const style = { width: '90%' };
    const extraTextStyle: StyleValue = {
        color: 'var(--semi-blue-5)',
        fontSize: '14px',
        userSelect: 'none',
        cursor: 'pointer',
    };
</script>

<template>
    <Form :initValues="initValues" :style="{ padding: '10px', width: '100%' }" @valueChange="(values) => console.log(values)">
        <FormSection>
            <template #text>基本信息</template>
            <Row>
                <Col :span="12">
                    <FormInput field="name" initValue="mikeya" label="名称（Input）" :style="style" trigger="blur" />
                </Col>
                <Col :span="12">
                    <FormDatePicker field="date" :initValue="today" label="日期（DatePicker）" placeholder="请选择生效日期" :style="style" />
                </Col>
            </Row>
            <Row>
                <Col :span="12">
                    <FormSelect field="role" label="角色（Select）" placeholder="请选择你的角色" :style="style">
                        <FormSelect.Option value="operate">运营</FormSelect.Option>
                        <FormSelect.Option value="rd">开发</FormSelect.Option>
                        <FormSelect.Option value="pm">产品</FormSelect.Option>
                        <FormSelect.Option value="ued">设计</FormSelect.Option>
                    </FormSelect>
                </Col>
                <Col :span="12">
                    <FormSelect field="business" label="业务线（多选Select）" multiple placeholder="请选择业务线" :style="style">
                        <template #extraText>
                            <div :style="extraTextStyle">没有找到合适的业务线？</div>
                        </template>
                        <FormSelect.Option value="abc">Semi</FormSelect.Option>
                        <FormSelect.Option value="ulikeCam">轻颜相机</FormSelect.Option>
                        <FormSelect.Option value="toutiao">今日头条</FormSelect.Option>
                    </FormSelect>
                </Col>
            </Row>
            <Row>
                <Col :span="12">
                    <FormCascader field="area" label="地区（Cascader）" placeholder="请选择所在地区" :style="style" :treeData="treeData" />
                </Col>
                <Col :span="12">
                    <FormTreeSelect field="tree" filterTreeNode label="节点（TreeSelect）" placeholder="请选择服务节点" :style="style" :treeData="treeData" />
                </Col>
            </Row>
            <Row>
                <Col :span="12">
                    <FormTagInput field="product" :initValue="['abc', 'ulikeCam']" label="产品（TagInput）" placeholder="请输入产品" :style="style" />
                </Col>
            </Row>
            <Row>
                <Col :span="24">
                    <FormUpload action="//semi.design/api/upload" field="files" label="证明文件（Upload）">
                        <Button theme="light">
                            <template #icon>
                                <IconUpload />
                            </template>
                            点击上传
                        </Button>
                    </FormUpload>
                </Col>
            </Row>
        </FormSection>
        <FormSection>
            <template #text>资源详情</template>
            <Row>
                <Col :span="12">
                    <FormTextArea field="description" label="申请理由（TextArea）" placeholder="请填写申请资源理由" :style="{ ...style, height: '120px' }" />
                </Col>
                <Col :span="12">
                    <FormCheckboxGroup direction="horizontal" field="type" :initValue="['user', 'admin']" label="申请类型（CheckboxGroup）" :rules="[{ required: true }]">
                        <FormCheckbox value="admin">admin</FormCheckbox>
                        <FormCheckbox value="user">user</FormCheckbox>
                        <FormCheckbox value="guest">guest</FormCheckbox>
                        <FormCheckbox value="root">root</FormCheckbox>
                    </FormCheckboxGroup>
                    <FormRadioGroup field="isMonopolize" label="是否独占资源（Radio）" :rules="[{ type: 'boolean' }, { required: true, message: '必须选择是否独占 ' }]">
                        <FormRadio :value="1">是</FormRadio>
                        <FormRadio :value="0">否</FormRadio>
                    </FormRadioGroup>
                </Col>
            </Row>
            <Row>
                <Col :span="12">
                    <FormTimePicker field="time" label="截止时刻（TimePicker）" :style="style" />
                </Col>
                <Col :span="12">
                    <FormInputNumber field="number" :initValue="20" label="申请数量（InputNumber）" :style="style" />
                </Col>
            </Row>
            <Row>
                <Col :span="12">
                    <FormSlider field="range" :initValue="10" label="资源使用报警阈值(%)（Slider）" :style="style" />
                </Col>
                <Col :span="12">
                    <FormSwitch field="switch" label="开关(Switch)" />
                </Col>
            </Row>
            <Row>
                <Col :span="12">
                    <FormRating field="rating" :initValue="2" label="满意度(Rating)" :style="style" />
                </Col>
            </Row>
        </FormSection>
        <FormCheckbox field="agree" noLabel value="false">我已阅读并清楚相关规定（Checkbox）</FormCheckbox>
        <Space>
            <Button class="btn-margin-right" htmlType="submit" type="primary">提交(submit)</Button>
            <Button htmlType="reset">重置(reset)</Button>
        </Space>
    </Form>
</template>
