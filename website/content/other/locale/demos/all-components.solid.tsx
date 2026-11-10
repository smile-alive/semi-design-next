import { createSignal, For } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { IconUser, IconSemiLogo, IconStar } from '@fibrae/semi-icons-solid';
import { LocaleProvider, ConfigProvider, Pagination, Modal, Button, Select, Cascader, DatePicker, TreeSelect, Table, TimePicker, List, Calendar, Typography, Transfer, ImagePreview, Image, Form, FormInput, Nav, type ColumnProps } from '@fibrae/semi-ui-solid';
import { en_US, zh_CN } from '@fibrae/semi-ui-solid/locale';

interface Person {
    key: string;
    name: string;
    age: number;
    address: string;
}

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

const columns: ColumnProps<Person>[] = [
    {
        title: 'Name',
        width: 250,
        dataIndex: 'name',
    },
    {
        title: 'Age',
        width: 150,
        dataIndex: 'age',
    },
    {
        title: 'Address',
        dataIndex: 'address',
    },
];

const dataSource: Person[] = Array.from({ length: 46 }, (_, i) => ({
    key: String(i),
    name: `Bytedance ${i}`,
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

const style = { margin: '10px' };

const navItems = [
    { itemKey: 'user', text: '用户管理' },
    { itemKey: 'union', text: '活动管理' },
];

const navIcons: Record<string, typeof IconUser> = { user: IconUser, union: IconStar };

const navHeader = {
    logo: () => <IconSemiLogo style={{ height: '36px', 'font-size': '36px' }} />,
    text: 'Semi 数据后台',
};

function I18nComponent() {
    const [modalVisible, setModalVisible] = createSignal(false);

    return (
        <>
            <h5>Pagination</h5>
            <Pagination total={100} showTotal showSizeChanger style={style} showQuickJumper />
            <h5>Modal</h5>

            <div style={style}>
                <Button onClick={() => setModalVisible(true)}>Show Modal</Button>
                <Modal title="Modal" visible={modalVisible()} onOk={() => setModalVisible(false)} onCancel={() => setModalVisible(false)}>
                    <p>This is the content of a basic modal.</p>
                    <p>More content...</p>
                </Modal>
            </div>
            <h5>Select & Cascader</h5>
            <div style={style}>
                <Select aria-label="Select" filter style={{ width: '180px' }}>
                    <Select.Option value="abc">abc</Select.Option>
                    <Select.Option value="vigo" disabled>
                        vigo
                    </Select.Option>
                    <Select.Option value="hotsoon">hotsoon</Select.Option>
                </Select>
                <Cascader style={{ width: '300px', margin: '10px' }} treeData={treeData} filterTreeNode prefix="Cascader" />
            </div>
            <h5>DatePicker</h5>
            <DatePicker style={{ ...style, width: '250px' }} />
            <DatePicker style={{ ...style, width: '300px' }} type="dateTime" />
            <DatePicker style={{ ...style, width: '300px' }} type="dateRange" />
            <DatePicker style={{ ...style, width: '450px' }} type="dateTimeRange" />
            <h5>TimePicker</h5>
            <TimePicker style={style} />
            <TimePicker use12Hours style={style} />
            <br />
            <br />
            <h5>TreeSelect</h5>
            <TreeSelect style={{ ...style, width: '300px' }} dropdownStyle={{ 'max-height': '400px', overflow: 'auto' }} treeData={treeData} filterTreeNode />
            <h5>Table</h5>
            <Table columns={columns} dataSource={dataSource} scroll={{ y: 320 }} />
            <h5>Table - Empty</h5>
            <Table columns={columns} dataSource={[]} scroll={{ y: 320 }} />
            <h5>List - Empty</h5>
            <List header={<div>List</div>} dataSource={[]} />
            <h5>Calendar</h5>
            <Calendar mode="month" displayValue={new Date(2024, 4, 6, 12)} />
            <h5>Typography - Copyable</h5>
            <Typography.Paragraph copyable>Click to copy text.</Typography.Paragraph>
            <h5>Typography - Collapsible</h5>
            <Typography.Paragraph ellipsis={{ rows: 3, expandable: true, collapsible: true }} style={{ width: '300px' }}>
                支持展开和折叠：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
            </Typography.Paragraph>
            <h5>Transfer</h5>
            <Transfer style={{ width: '568px', height: '416px' }} dataSource={transferData} />
            <h5>Image</h5>
            <ImagePreview showTooltip>
                <For each={srcList}>{(src, index) => <Image src={src} width={200} alt={`lamp${index() + 1}`} style={{ 'margin-inline-end': '5px' }} />}</For>
            </ImagePreview>
            <h5>Form</h5>
            <Form layout="horizontal" onValueChange={(values) => console.log(values)}>
                <FormInput field="UserName" label={{ text: '角色', optional: true }} style={{ width: '200px' }} />
            </Form>
            <h5>Navigation</h5>
            <Nav bodyStyle={{ height: '320px' }} items={navItems} renderItemIcon={({ item }) => <Dynamic component={navIcons[String(item.itemKey)]} />} header={navHeader} footer={{ collapseButton: true }} />
        </>
    );
}

export default function LocaleDemo() {
    const [code, setCode] = createSignal('zh_CN');
    const locale = () => (code() === 'en_US' ? en_US : zh_CN);

    return (
        <>
            <div style={{ 'border-block-end': '1px solid var(--semi-color-border)', 'padding-block-end': '20px' }}>
                <Select aria-label="切换语言" onChange={(value) => setCode(String(value))} prefix="切换语言" style={{ width: '250px' }} value={code()}>
                    <Select.Option value="zh_CN">简体中文</Select.Option>
                    <Select.Option value="en_US">英语（美）</Select.Option>
                </Select>
            </div>
            <LocaleProvider locale={locale()}>
                <ConfigProvider locale={locale()}>
                    {/* Keyed by the code so each language switch remounts the demo, as the React version does with key */}
                    <For each={[code()]}>{() => <I18nComponent />}</For>
                </ConfigProvider>
            </LocaleProvider>
        </>
    );
}
