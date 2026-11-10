<script lang="ts">
    import { IconSemiLogo, IconStar, IconUser } from '@fibrae/semi-icons-svelte';
    import { Button, Calendar, Cascader, ConfigProvider, DatePicker, Form, FormInput, Image, ImagePreview, List, LocaleProvider, Modal, Nav, Pagination, Select, Table, TimePicker, Transfer, TreeSelect, Typography, type ColumnProps, type NavItems } from '@fibrae/semi-ui-svelte';
    import { en_US, zh_CN } from '@fibrae/semi-ui-svelte/locale';

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

    const columns: ColumnProps[] = [
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

    const languageOptions = [
        { value: 'zh_CN', label: '简体中文' },
        { value: 'en_US', label: '英语（美）' },
    ];

    let localeCode = $state('zh_CN');
    const locale = $derived(localeCode === 'en_US' ? en_US : zh_CN);
    let modalVisible = $state(false);
    const closeModal = () => {
        modalVisible = false;
    };
</script>

<div>
    <div style="border-block-end: 1px solid var(--semi-color-border); padding-block-end: 20px">
        <Select aria-label="切换语言" onChange={(value) => (localeCode = String(value))} optionList={languageOptions} style="width: 250px" value={localeCode}>
            {#snippet prefix()}切换语言{/snippet}
        </Select>
    </div>
    <LocaleProvider {locale}>
        <ConfigProvider {locale}>
            {#key localeCode}
                <div>
                    <h5>Pagination</h5>
                    <Pagination showQuickJumper showSizeChanger showTotal style="margin: 10px" total={100} />
                    <h5>Modal</h5>
                    <div style="margin: 10px">
                        <Button onclick={() => (modalVisible = true)}>Show Modal</Button>
                        <Modal bind:visible={modalVisible} onCancel={closeModal} onOk={closeModal} title="Modal">
                            <p>This is the content of a basic modal.</p>
                            <p>More content...</p>
                        </Modal>
                    </div>
                    <h5>Select &amp; Cascader</h5>
                    <div style="margin: 10px">
                        <Select
                            aria-label="Select"
                            filter
                            optionList={[
                                { value: 'abc', label: 'abc' },
                                { value: 'vigo', label: 'vigo', disabled: true },
                                { value: 'hotsoon', label: 'hotsoon' },
                            ]}
                            style="width: 180px"
                        />
                        <Cascader filterTreeNode style="width: 300px; margin: 10px" {treeData}>
                            {#snippet prefix()}Cascader{/snippet}
                        </Cascader>
                    </div>
                    <h5>DatePicker</h5>
                    <DatePicker style="margin: 10px; width: 250px" />
                    <DatePicker style="margin: 10px; width: 300px" type="dateTime" />
                    <DatePicker style="margin: 10px; width: 300px" type="dateRange" />
                    <DatePicker style="margin: 10px; width: 450px" type="dateTimeRange" />
                    <h5>TimePicker</h5>
                    <TimePicker style="margin: 10px" />
                    <TimePicker style="margin: 10px" use12Hours />
                    <br />
                    <br />
                    <h5>TreeSelect</h5>
                    <TreeSelect dropdownStyle="max-height: 400px; overflow: auto" filterTreeNode style="margin: 10px; width: 300px" {treeData} />
                    <h5>Table</h5>
                    <Table {columns} {dataSource} scroll={{ y: 320 }} />
                    <h5>Table - Empty</h5>
                    <Table {columns} dataSource={[]} scroll={{ y: 320 }} />
                    <h5>List - Empty</h5>
                    <List dataSource={[]}>
                        {#snippet header()}
                            <div>List</div>
                        {/snippet}
                    </List>
                    <h5>Calendar</h5>
                    <Calendar displayValue={new Date(2024, 4, 6, 12)} mode="month" />
                    <h5>Typography - Copyable</h5>
                    <Typography.Paragraph copyable>Click to copy text.</Typography.Paragraph>
                    <h5>Typography - Collapsible</h5>
                    <Typography.Paragraph ellipsis={{ rows: 3, expandable: true, collapsible: true }} style="width: 300px">
                        支持展开和折叠：Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
                    </Typography.Paragraph>
                    <h5>Transfer</h5>
                    <Transfer dataSource={transferData} style="width: 568px; height: 416px" />
                    <h5>Image</h5>
                    <ImagePreview showTooltip src={srcList}>
                        {#each srcList as src, index (src)}
                            <Image alt="lamp{index + 1}" {src} style="margin-inline-end: 5px" width={200} />
                        {/each}
                    </ImagePreview>
                    <h5>Form</h5>
                    <Form layout="horizontal" onValueChange={(values) => console.log(values)}>
                        <FormInput field="UserName" label={{ text: '角色', optional: true }} style="width: 200px" />
                    </Form>
                    <h5>Navigation</h5>
                    <Nav bodyStyle="height: 320px" footer={{ collapseButton: true }} items={navItems}>
                        {#snippet header()}
                            <Nav.Header text="Semi 数据后台">
                                {#snippet logo()}
                                    <IconSemiLogo style="height: 36px; font-size: 36px" />
                                {/snippet}
                            </Nav.Header>
                        {/snippet}
                        {#snippet icon({ item, size })}
                            {@const Icon = navIcons[item.itemKey as keyof typeof navIcons]}
                            {#if Icon}
                                <Icon {size} />
                            {/if}
                        {/snippet}
                    </Nav>
                </div>
            {/key}
        </ConfigProvider>
    </LocaleProvider>
</div>
