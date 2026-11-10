<script setup lang="ts">
    import { computed, shallowRef } from 'vue';
    import { IconSemiLogo, IconStar, IconUser } from '@fibrae/semi-icons-vue';
    import { Button, Calendar, Cascader, ConfigProvider, DatePicker, Form, FormInput, Image, ImagePreview, List, LocaleProvider, Modal, Nav, Pagination, Select, Table, TimePicker, Transfer, TreeSelect, Typography, type NavItemConfig, type NavItems } from '@fibrae/semi-ui-vue';
    import { en_US, zh_CN } from '@fibrae/semi-ui-vue/locale';

    const treeData = [
        {
            label: 'Asia',
            value: 'asia',
            key: '1',
            children: [
                {
                    label: 'China',
                    value: 'china',
                    key: '1-0',
                    children: [
                        { label: 'Beijing', value: 'beijing', key: '1-0-0' },
                        { label: 'Shanghai', value: 'shanghai', key: '1-0-1' },
                    ],
                },
                {
                    label: 'Japan',
                    value: 'japan',
                    key: '1-1',
                    children: [{ label: 'Osaka', value: 'osaka', key: '1-1-0' }],
                },
            ],
        },
    ];

    const columns = [
        { title: 'Name', width: 250, dataIndex: 'name' },
        { title: 'Age', width: 150, dataIndex: 'age' },
        { title: 'Address', dataIndex: 'address' },
    ];
    const dataSource = Array.from({ length: 46 }, (_, i) => ({
        key: String(i),
        name: `Example ${i}`,
        age: 32,
        address: `Beijing, Haidian. Zhichun Road ${i}`,
    }));
    const transferData = Array.from({ length: 100 }, (_, i) => ({
        label: `选项名称 ${i}`,
        value: i,
        disabled: false,
        key: i,
    }));
    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'];
    const navItems: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
    ];
    const navIcons = { user: IconUser, union: IconStar };
    const navIconOf = (item: NavItemConfig) => navIcons[item.itemKey as keyof typeof navIcons];

    const localeCode = shallowRef('zh_CN');
    const locale = computed(() => (localeCode.value === 'en_US' ? en_US : zh_CN));
    const modalVisible = shallowRef(false);
    const closeModal = () => {
        modalVisible.value = false;
    };
</script>

<template>
    <div>
        <div :style="{ borderBlockEnd: '1px solid var(--semi-color-border)', paddingBlockEnd: '20px' }">
            <Select aria-label="切换语言" :style="{ width: '250px' }" :value="localeCode" @change="(value) => (localeCode = String(value))">
                <template #prefix>切换语言</template>
                <Select.Option value="zh_CN">简体中文</Select.Option>
                <Select.Option value="en_US">英语（美）</Select.Option>
            </Select>
        </div>
        <LocaleProvider :locale="locale">
            <ConfigProvider :locale="locale">
                <div :key="localeCode">
                    <h5>Pagination</h5>
                    <Pagination showQuickJumper showSizeChanger showTotal :style="{ margin: '10px' }" :total="100" />
                    <h5>Modal</h5>
                    <div :style="{ margin: '10px' }">
                        <Button @click="modalVisible = true">Show Modal</Button>
                        <Modal v-model:visible="modalVisible" title="Modal" @cancel="closeModal" @ok="closeModal">
                            <p>This is the content of a basic modal.</p>
                            <p>More content...</p>
                        </Modal>
                    </div>
                    <h5>Select &amp; Cascader</h5>
                    <div :style="{ margin: '10px' }">
                        <Select aria-label="Select" filter :style="{ width: '180px' }">
                            <Select.Option value="abc">abc</Select.Option>
                            <Select.Option disabled value="vigo">vigo</Select.Option>
                            <Select.Option value="hotsoon">hotsoon</Select.Option>
                        </Select>
                        <Cascader filterTreeNode :style="{ width: '300px', margin: '10px' }" :treeData="treeData">
                            <template #prefix>Cascader</template>
                        </Cascader>
                    </div>
                    <h5>DatePicker</h5>
                    <DatePicker :style="{ margin: '10px', width: '250px' }" />
                    <DatePicker :style="{ margin: '10px', width: '300px' }" type="dateTime" />
                    <DatePicker :style="{ margin: '10px', width: '300px' }" type="dateRange" />
                    <DatePicker :style="{ margin: '10px', width: '450px' }" type="dateTimeRange" />
                    <h5>TimePicker</h5>
                    <TimePicker :style="{ margin: '10px' }" />
                    <TimePicker :style="{ margin: '10px' }" use12Hours />
                    <br />
                    <br />
                    <h5>TreeSelect</h5>
                    <TreeSelect :dropdownStyle="{ maxHeight: '400px', overflow: 'auto' }" filterTreeNode :style="{ margin: '10px', width: '300px' }" :treeData="treeData" />
                    <h5>Table</h5>
                    <Table :columns="columns" :dataSource="dataSource" :scroll="{ y: 320 }" />
                    <h5>Table - Empty</h5>
                    <Table :columns="columns" :dataSource="[]" :scroll="{ y: 320 }" />
                    <h5>List - Empty</h5>
                    <List :dataSource="[]">
                        <template #header>
                            <div>List</div>
                        </template>
                    </List>
                    <h5>Calendar</h5>
                    <Calendar :displayValue="new Date(2024, 4, 6, 12)" mode="month" />
                    <h5>Typography - Copyable</h5>
                    <Typography.Paragraph copyable>Click to copy text.</Typography.Paragraph>
                    <h5>Typography - Collapsible</h5>
                    <Typography.Paragraph :ellipsis="{ rows: 3, expandable: true, collapsible: true }" :style="{ width: '300px' }">
                        支持展开和折叠：Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
                    </Typography.Paragraph>
                    <h5>Transfer</h5>
                    <Transfer :dataSource="transferData" :style="{ width: '568px', height: '416px' }" />
                    <h5>Image</h5>
                    <ImagePreview showTooltip>
                        <Image v-for="(src, index) in srcList" :key="src" :alt="`lamp${index + 1}`" :src="src" :style="{ marginInlineEnd: '5px' }" :width="200" />
                    </ImagePreview>
                    <h5>Form</h5>
                    <Form layout="horizontal" @valueChange="(values) => console.log(values)">
                        <FormInput field="UserName" :label="{ text: '角色', optional: true }" :style="{ width: '200px' }" />
                    </Form>
                    <h5>Navigation</h5>
                    <Nav :bodyStyle="{ height: '320px' }" :footer="{ collapseButton: true }" :items="navItems">
                        <template #icon="{ item }">
                            <component :is="navIconOf(item)" />
                        </template>
                        <Nav.Header text="Semi 数据后台">
                            <template #logo>
                                <IconSemiLogo :style="{ height: '36px', fontSize: '36px' }" />
                            </template>
                        </Nav.Header>
                    </Nav>
                </div>
            </ConfigProvider>
        </LocaleProvider>
    </div>
</template>
