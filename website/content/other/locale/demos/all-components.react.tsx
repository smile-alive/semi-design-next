import { useState, useMemo, useCallback, useRef } from 'react';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconUser, IconSemiLogo, IconStar } from '@fibrae/semi-icons-react';
import { LocaleProvider, ConfigProvider, Pagination, Modal, Button, Select, Cascader, DatePicker, TreeSelect, Table, TimePicker, List, Calendar, Typography, Transfer, ImagePreview, Image, Form, Nav } from '@fibrae/semi-ui-react';

// A pack loads when it is picked, so the page does not bundle every language up front
const loaders = {
    ar: () => import('@fibrae/semi-foundation/locale/source/ar'),
    az: () => import('@fibrae/semi-foundation/locale/source/az'),
    bg: () => import('@fibrae/semi-foundation/locale/source/bg'),
    bn_IN: () => import('@fibrae/semi-foundation/locale/source/bn_IN'),
    ca: () => import('@fibrae/semi-foundation/locale/source/ca'),
    ceb_PH: () => import('@fibrae/semi-foundation/locale/source/ceb_PH'),
    cs_CZ: () => import('@fibrae/semi-foundation/locale/source/cs_CZ'),
    da: () => import('@fibrae/semi-foundation/locale/source/da'),
    de: () => import('@fibrae/semi-foundation/locale/source/de'),
    el_GR: () => import('@fibrae/semi-foundation/locale/source/el_GR'),
    en_GB: () => import('@fibrae/semi-foundation/locale/source/en_GB'),
    en_US: () => import('@fibrae/semi-foundation/locale/source/en_US'),
    es: () => import('@fibrae/semi-foundation/locale/source/es'),
    es_419: () => import('@fibrae/semi-foundation/locale/source/es_419'),
    et: () => import('@fibrae/semi-foundation/locale/source/et'),
    fa_IR: () => import('@fibrae/semi-foundation/locale/source/fa_IR'),
    fi_FI: () => import('@fibrae/semi-foundation/locale/source/fi_FI'),
    fil_PH: () => import('@fibrae/semi-foundation/locale/source/fil_PH'),
    fr: () => import('@fibrae/semi-foundation/locale/source/fr'),
    fr_CA: () => import('@fibrae/semi-foundation/locale/source/fr_CA'),
    ga: () => import('@fibrae/semi-foundation/locale/source/ga'),
    he_IL: () => import('@fibrae/semi-foundation/locale/source/he_IL'),
    hi_IN: () => import('@fibrae/semi-foundation/locale/source/hi_IN'),
    hr: () => import('@fibrae/semi-foundation/locale/source/hr'),
    hu_HU: () => import('@fibrae/semi-foundation/locale/source/hu_HU'),
    id_ID: () => import('@fibrae/semi-foundation/locale/source/id_ID'),
    is: () => import('@fibrae/semi-foundation/locale/source/is'),
    it: () => import('@fibrae/semi-foundation/locale/source/it'),
    ja_JP: () => import('@fibrae/semi-foundation/locale/source/ja_JP'),
    jv_ID: () => import('@fibrae/semi-foundation/locale/source/jv_ID'),
    kk: () => import('@fibrae/semi-foundation/locale/source/kk'),
    km_KH: () => import('@fibrae/semi-foundation/locale/source/km_KH'),
    ko_KR: () => import('@fibrae/semi-foundation/locale/source/ko_KR'),
    lt: () => import('@fibrae/semi-foundation/locale/source/lt'),
    lv: () => import('@fibrae/semi-foundation/locale/source/lv'),
    ms_MY: () => import('@fibrae/semi-foundation/locale/source/ms_MY'),
    my_MM: () => import('@fibrae/semi-foundation/locale/source/my_MM'),
    nb: () => import('@fibrae/semi-foundation/locale/source/nb'),
    nl_NL: () => import('@fibrae/semi-foundation/locale/source/nl_NL'),
    pl_PL: () => import('@fibrae/semi-foundation/locale/source/pl_PL'),
    pt: () => import('@fibrae/semi-foundation/locale/source/pt'),
    pt_BR: () => import('@fibrae/semi-foundation/locale/source/pt_BR'),
    ro: () => import('@fibrae/semi-foundation/locale/source/ro'),
    ru_RU: () => import('@fibrae/semi-foundation/locale/source/ru_RU'),
    sk: () => import('@fibrae/semi-foundation/locale/source/sk'),
    sl: () => import('@fibrae/semi-foundation/locale/source/sl'),
    sq: () => import('@fibrae/semi-foundation/locale/source/sq'),
    sv_SE: () => import('@fibrae/semi-foundation/locale/source/sv_SE'),
    sw: () => import('@fibrae/semi-foundation/locale/source/sw'),
    th_TH: () => import('@fibrae/semi-foundation/locale/source/th_TH'),
    tr_TR: () => import('@fibrae/semi-foundation/locale/source/tr_TR'),
    uk_UA: () => import('@fibrae/semi-foundation/locale/source/uk_UA'),
    ur: () => import('@fibrae/semi-foundation/locale/source/ur'),
    uz: () => import('@fibrae/semi-foundation/locale/source/uz'),
    vi_VN: () => import('@fibrae/semi-foundation/locale/source/vi_VN'),
    zh_TW: () => import('@fibrae/semi-foundation/locale/source/zh_TW'),
};
type LocaleCode = 'zh_CN' | keyof typeof loaders;

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
const I18nComponent = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const columns = useMemo(
        () => [
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
        ],
        []
    );
    const dataSource = useMemo(() => {
        const data = [];
        for (let i = 0; i < 46; i++) {
            data.push({
                key: '' + i,
                name: `Bytedance ${i}`,
                age: 32,
                address: `Beijing, Haidian. Zhichun Road ${i}`,
            });
        }
        return data;
    }, []);
    const transferData = useMemo(() => {
        return Array.from({ length: 100 }, (_v, i) => {
            return {
                label: `选项名称 ${i}`,
                value: i,
                disabled: false,
                key: i,
            };
        });
    }, []);
    const srcList = useMemo(() => ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'], []);
    const style = { margin: 10 };
    return (
        <>
            <h5>Pagination</h5>
            <Pagination total={100} showTotal showSizeChanger style={style} showQuickJumper />
            <h5>Modal</h5>

            <div style={style}>
                <Button onClick={() => setModalVisible(true)}>Show Modal</Button>
                <Modal title="Modal" visible={modalVisible} onOk={() => setModalVisible(false)} onCancel={() => setModalVisible(false)}>
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
                <Cascader style={{ width: 300, margin: 10 }} treeData={treeData} filterTreeNode prefix="Cascader" />
            </div>
            <h5>DatePicker</h5>
            <DatePicker style={{ ...style, width: 250 }} />
            <DatePicker style={{ ...style, width: 300 }} type="dateTime" />
            <DatePicker style={{ ...style, width: 300 }} type="dateRange" />
            <DatePicker style={{ ...style, width: 450 }} type="dateTimeRange" />
            <h5>TimePicker</h5>
            <TimePicker style={style} />
            <TimePicker use12Hours style={style} />
            <br />
            <br />
            <h5>TreeSelect</h5>
            <TreeSelect style={{ ...style, width: 300 }} dropdownStyle={{ maxHeight: 400, overflow: 'auto' }} treeData={treeData} filterTreeNode />
            <h5>Table</h5>
            <Table columns={columns} dataSource={dataSource} scroll={{ y: 320 }} />
            <h5>Table - Empty</h5>
            <Table columns={columns} dataSource={[]} scroll={{ y: 320 }} />
            <h5>List - Empty</h5>
            <List header={<div>List</div>} dataSource={[]} />
            <h5>Calendar</h5>
            <Calendar mode="month" displayValue={new Date(2019, 6, 23)} />
            <h5>Typography - Copyable</h5>
            <Typography.Paragraph copyable>Click to copy text.</Typography.Paragraph>
            <h5>Typography - Collapsible</h5>
            <Typography.Paragraph ellipsis={{ rows: 3, expandable: true, collapsible: true }} style={{ width: 300 }}>
                支持展开和折叠：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
            </Typography.Paragraph>
            <h5>Transfer</h5>
            <Transfer style={{ width: 568, height: 416 }} dataSource={transferData} />
            <h5>Image</h5>
            <ImagePreview showTooltip>
                {srcList.map((src, index) => {
                    return <Image key={index} src={src} width={200} alt={`lamp${index + 1}`} style={{ marginRight: 5 }} />;
                })}
            </ImagePreview>
            <h5>Form</h5>
            <Form layout="horizontal" onValueChange={(values) => console.log(values)}>
                <Form.Input field="UserName" label={{ text: '角色', optional: true }} style={{ width: 200 }} />
            </Form>
            <h5>Navigation</h5>
            <Nav
                bodyStyle={{ height: 320 }}
                items={[
                    { itemKey: 'user', text: '用户管理', icon: <IconUser /> },
                    { itemKey: 'union', text: '活动管理', icon: <IconStar /> },
                ]}
                header={{
                    logo: <IconSemiLogo style={{ height: '36px', fontSize: 36 }} />,
                    text: 'Semi 数据后台',
                }}
                footer={{
                    collapseButton: true,
                }}
            />
        </>
    );
};

export default function LocaleDemo() {
    const [current, setCurrent] = useState({ code: 'zh_CN', locale: zh_CN });
    const latest = useRef('zh_CN');

    const onLanguageChange = useCallback(async (value = 'zh_CN') => {
        const code = value as LocaleCode;
        latest.current = code;
        const locale = code === 'zh_CN' ? zh_CN : (await loaders[code]()).default;
        // A pick made while this pack was loading wins
        if (latest.current === code) {
            setCurrent({ code, locale });
        }
    }, []);

    return (
        <>
            <div style={{ borderBottom: '1px solid var(--semi-color-border)', paddingBottom: 20 }}>
                <Select aria-label="切换语言" onChange={onLanguageChange} prefix="切换语言" style={{ width: 250 }} defaultValue="zh_CN">
                    <Select.Option value="zh_CN">简体中文</Select.Option>
                    <Select.Option value="en_US">英语（美）</Select.Option>
                    <Select.Option value="en_GB">英语（英）</Select.Option>
                    <Select.Option value="ja_JP">日语</Select.Option>
                    <Select.Option value="ko_KR">韩语</Select.Option>
                    <Select.Option value="ar">阿拉伯语</Select.Option>
                    <Select.Option value="vi_VN">越南语</Select.Option>
                    <Select.Option value="ru_RU">俄罗斯语</Select.Option>
                    <Select.Option value="id_ID">印尼语</Select.Option>
                    <Select.Option value="ms_MY">马来语</Select.Option>
                    <Select.Option value="th_TH">泰语</Select.Option>
                    <Select.Option value="tr_TR">土耳其语</Select.Option>
                    <Select.Option value="pt_BR">葡萄牙语（巴西）</Select.Option>
                    <Select.Option value="zh_TW">繁体中文</Select.Option>
                    <Select.Option value="es">西班牙语</Select.Option>
                    <Select.Option value="de">德语</Select.Option>
                    <Select.Option value="it">意大利语</Select.Option>
                    <Select.Option value="fr">法语</Select.Option>
                    <Select.Option value="ro">罗马尼亚语</Select.Option>
                    <Select.Option value="sv_SE">瑞典语</Select.Option>
                    <Select.Option value="pl_PL">波兰语</Select.Option>
                    <Select.Option value="nl_NL">荷兰语</Select.Option>
                    <Select.Option value="az">阿塞拜疆语</Select.Option>
                    <Select.Option value="bn_IN">孟加拉语</Select.Option>
                    <Select.Option value="bg">保加利亚语</Select.Option>
                    <Select.Option value="ca">加泰罗尼亚语</Select.Option>
                    <Select.Option value="cs_CZ">捷克语</Select.Option>
                    <Select.Option value="ceb_PH">宿务语</Select.Option>
                    <Select.Option value="da">丹麦语</Select.Option>
                    <Select.Option value="el_GR">希腊语</Select.Option>
                    <Select.Option value="es_419">西班牙语（拉美）</Select.Option>
                    <Select.Option value="et">爱沙尼亚语</Select.Option>
                    <Select.Option value="fa_IR">波斯语</Select.Option>
                    <Select.Option value="fil_PH">菲律宾语</Select.Option>
                    <Select.Option value="fi_FI">芬兰语</Select.Option>
                    <Select.Option value="fr_CA">法语（加）</Select.Option>
                    <Select.Option value="ga">爱尔兰语</Select.Option>
                    <Select.Option value="he_IL">希伯来语</Select.Option>
                    <Select.Option value="hi_IN">印地语</Select.Option>
                    <Select.Option value="hr">克罗地亚语</Select.Option>
                    <Select.Option value="hu_HU">匈牙利语</Select.Option>
                    <Select.Option value="is">冰岛语</Select.Option>
                    <Select.Option value="jv_ID">爪哇语</Select.Option>
                    <Select.Option value="kk">哈萨克语</Select.Option>
                    <Select.Option value="km_KH">高棉语</Select.Option>
                    <Select.Option value="lt">立陶宛语</Select.Option>
                    <Select.Option value="lv">拉脱维亚语</Select.Option>
                    <Select.Option value="my_MM">缅甸语</Select.Option>
                    <Select.Option value="nb">挪威语</Select.Option>
                    <Select.Option value="pt">葡萄牙语</Select.Option>
                    <Select.Option value="sk">斯洛伐克语</Select.Option>
                    <Select.Option value="sl">斯洛文尼亚语</Select.Option>
                    <Select.Option value="sq">阿尔巴尼亚语</Select.Option>
                    <Select.Option value="sw">斯瓦希里语</Select.Option>
                    <Select.Option value="uk_UA">乌克兰语</Select.Option>
                    <Select.Option value="ur">乌尔都语</Select.Option>
                    <Select.Option value="uz">乌兹别克语</Select.Option>
                </Select>
            </div>
            <LocaleProvider locale={current.locale}>
                <ConfigProvider direction={current.code === 'ar' ? 'rtl' : 'ltr'} locale={current.locale}>
                    <I18nComponent key={current.code} />
                </ConfigProvider>
            </LocaleProvider>
        </>
    );
}
