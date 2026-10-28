<script setup lang="ts">
    import { IconMinusCircle, IconPlusCircle } from '@fibrae/semi-icons-vue';
    import { ArrayField, Button, Card, Form, FormInput, FormSelect, TypographyText } from '@fibrae/semi-ui-vue';

    const selectOption = [
        { label: '发件人地址', value: 'address' },
        { label: '邮件主题', value: 'title' },
        { label: '发送时间', value: 'sendTime' },
        { label: '接收时间', value: 'receiveTime' },
        { label: '正文', value: 'main' },
        { label: '附件名称', value: 'attachmentName' },
    ];
    const typeOption = [
        { label: '包含', value: 'include' },
        { label: '不包含', value: 'exclude' },
    ];

    const initValue = {
        group: [
            {
                name: '收信规则1',
                rules: [
                    { ruleType: 'address', type: 'include', text: 'bytedance.com' },
                    { ruleType: 'title', type: 'exclude', text: '更新日志' },
                ],
            },
            {
                name: '收信规则2',
                rules: [{ ruleType: 'sendTime', type: 'include', text: '2019' }],
            },
        ],
    };

    const newRule = {
        name: '新规则名称',
        rules: [
            { ruleType: 'main', type: 'include', text: '' },
            { ruleType: 'attachmentName', type: 'include', text: '' },
        ],
    };

    const rowStyle = { marginTop: '12px', marginLeft: '12px' };
</script>

<template>
    <Form allowEmpty :initValues="initValue" labelPosition="left" :style="{ textAlign: 'left' }" @valueChange="(values) => console.log(values)">
        <ArrayField field="group">
            <template #default="{ arrayFields, onAddWithInitValue }">
                <Button theme="solid" @click="onAddWithInitValue(newRule)">
                    <template #icon>
                        <IconPlusCircle />
                    </template>
                    新增收信规则
                </Button>
                <div v-for="item in arrayFields" :key="item.key" :style="{ width: '1000px', display: 'flex', flexWrap: 'wrap' }">
                    <FormInput :field="`${item.field}[name]`" label="规则名称" labelPosition="top" :style="{ width: '600px' }" />
                    <Button aria-label="删除规则" :style="{ margin: '36px 0 0 12px' }" type="danger" @click="item.onRemove">
                        <template #icon>
                            <IconMinusCircle />
                        </template>
                    </Button>
                    <TypographyText strong :style="{ flexBasis: '100%' }">当邮件到达，满足以下条件时：</TypographyText>
                    <Card shadows="hover" :style="{ width: '620px', margin: '12px 0 0 24px' }">
                        <ArrayField :field="`${item.field}.rules`">
                            <template #default="{ arrayFields: rules, onAddWithInitValue: addRule }">
                                <div v-for="(rule, i) in rules" :key="rule.key" :style="{ display: 'flex' }">
                                    <FormSelect :field="`${rule.field}[ruleType]`" :label="`${rule.field}.ruleType`" noLabel :optionList="selectOption" :style="{ width: '120px', marginRight: '12px' }" />
                                    <FormSelect :field="`${rule.field}[type]`" :label="`${rule.field}.type`" noLabel :optionList="typeOption" :style="{ width: '100px', marginRight: '12px' }" />
                                    <FormInput aria-label="条件内容" :field="`${rule.field}[text]`" :label="`${rule.field}.text`" noLabel :style="{ width: '200px' }" />
                                    <Button aria-label="删除条件" :style="rowStyle" theme="borderless" type="danger" @click="rule.onRemove">
                                        <template #icon>
                                            <IconMinusCircle />
                                        </template>
                                    </Button>
                                    <Button aria-label="新增条件" :disabled="i !== rules.length - 1" :style="rowStyle" @click="addRule({ ruleType: `条件${rules.length + 1}`, type: 'include' })">
                                        <template #icon>
                                            <IconPlusCircle />
                                        </template>
                                    </Button>
                                </div>
                            </template>
                        </ArrayField>
                    </Card>
                </div>
            </template>
        </ArrayField>
    </Form>
</template>
