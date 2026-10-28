<script setup lang="ts">
    import { shallowRef } from 'vue';
    import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
    import { IconSemiLogo, IconStar, IconUser } from '@fibrae/semi-icons-vue';
    import { Button, Calendar, Cascader, ConfigProvider, DatePicker, Form, FormInput, Image, ImagePreview, List, LocaleProvider, Modal, Nav, Pagination, Select, Table, TimePicker, Transfer, TreeSelect, Typography, type NavItemConfig, type NavItems } from '@fibrae/semi-ui-vue';

    const { Paragraph } = Typography;

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
    const navItems: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
    ];
    const navIcons = { user: IconUser, union: IconStar };
    const navIconOf = (item: NavItemConfig) => navIcons[item.itemKey as keyof typeof navIcons];

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

    const languageOptions: { value: LocaleCode; label: string }[] = [
        { value: 'zh_CN', label: '简体中文' },
        { value: 'en_US', label: '英语（美）' },
        { value: 'en_GB', label: '英语（英）' },
        { value: 'ja_JP', label: '日语' },
        { value: 'ko_KR', label: '韩语' },
        { value: 'ar', label: '阿拉伯语' },
        { value: 'vi_VN', label: '越南语' },
        { value: 'ru_RU', label: '俄罗斯语' },
        { value: 'id_ID', label: '印尼语' },
        { value: 'ms_MY', label: '马来语' },
        { value: 'th_TH', label: '泰语' },
        { value: 'tr_TR', label: '土耳其语' },
        { value: 'pt_BR', label: '葡萄牙语（巴西）' },
        { value: 'zh_TW', label: '繁体中文' },
        { value: 'es', label: '西班牙语' },
        { value: 'de', label: '德语' },
        { value: 'it', label: '意大利语' },
        { value: 'fr', label: '法语' },
        { value: 'ro', label: '罗马尼亚语' },
        { value: 'sv_SE', label: '瑞典语' },
        { value: 'pl_PL', label: '波兰语' },
        { value: 'nl_NL', label: '荷兰语' },
        { value: 'az', label: '阿塞拜疆语' },
        { value: 'bn_IN', label: '孟加拉语' },
        { value: 'bg', label: '保加利亚语' },
        { value: 'ca', label: '加泰罗尼亚语' },
        { value: 'cs_CZ', label: '捷克语' },
        { value: 'ceb_PH', label: '宿务语' },
        { value: 'da', label: '丹麦语' },
        { value: 'el_GR', label: '希腊语' },
        { value: 'es_419', label: '西班牙语（拉美）' },
        { value: 'et', label: '爱沙尼亚语' },
        { value: 'fa_IR', label: '波斯语' },
        { value: 'fil_PH', label: '菲律宾语' },
        { value: 'fi_FI', label: '芬兰语' },
        { value: 'fr_CA', label: '法语（加）' },
        { value: 'ga', label: '爱尔兰语' },
        { value: 'he_IL', label: '希伯来语' },
        { value: 'hi_IN', label: '印地语' },
        { value: 'hr', label: '克罗地亚语' },
        { value: 'hu_HU', label: '匈牙利语' },
        { value: 'is', label: '冰岛语' },
        { value: 'jv_ID', label: '爪哇语' },
        { value: 'kk', label: '哈萨克语' },
        { value: 'km_KH', label: '高棉语' },
        { value: 'lt', label: '立陶宛语' },
        { value: 'lv', label: '拉脱维亚语' },
        { value: 'my_MM', label: '缅甸语' },
        { value: 'nb', label: '挪威语' },
        { value: 'pt', label: '葡萄牙语' },
        { value: 'sk', label: '斯洛伐克语' },
        { value: 'sl', label: '斯洛文尼亚语' },
        { value: 'sq', label: '阿尔巴尼亚语' },
        { value: 'sw', label: '斯瓦希里语' },
        { value: 'uk_UA', label: '乌克兰语' },
        { value: 'ur', label: '乌尔都语' },
        { value: 'uz', label: '乌兹别克语' },
    ];

    const localeCode = shallowRef<LocaleCode>('zh_CN');
    const locale = shallowRef(zh_CN);
    let latest: LocaleCode = 'zh_CN';
    const onLanguageChange = async (code: LocaleCode) => {
        latest = code;
        const pack = code === 'zh_CN' ? zh_CN : (await loaders[code]()).default;
        // A pick made while this pack was loading wins
        if (latest === code) {
            localeCode.value = code;
            locale.value = pack;
        }
    };
    const modalVisible = shallowRef(false);
    const closeModal = () => {
        modalVisible.value = false;
    };
</script>

<template>
    <div>
        <div :style="{ borderBottom: '1px solid var(--semi-color-border)', paddingBottom: '20px' }">
            <Select aria-label="切换语言" defaultValue="zh_CN" :style="{ width: '250px' }" @change="(value) => onLanguageChange(value as LocaleCode)">
                <template #prefix>切换语言</template>
                <Select.Option v-for="option in languageOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                </Select.Option>
            </Select>
        </div>
        <LocaleProvider :locale="locale">
            <ConfigProvider :direction="localeCode === 'ar' ? 'rtl' : 'ltr'" :locale="locale">
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
                    <Paragraph copyable>Click to copy text.</Paragraph>
                    <h5>Typography - Collapsible</h5>
                    <Paragraph :ellipsis="{ rows: 3, expandable: true, collapsible: true }" :style="{ width: '300px' }">
                        支持展开和折叠：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
                    </Paragraph>
                    <h5>Transfer</h5>
                    <Transfer :dataSource="transferData" :style="{ width: '568px', height: '416px' }" />
                    <h5>Image</h5>
                    <ImagePreview showTooltip>
                        <Image v-for="(src, index) in srcList" :key="src" :alt="`lamp${index + 1}`" :src="src" :style="{ marginRight: '5px' }" :width="200" />
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
