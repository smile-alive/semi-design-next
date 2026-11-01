/** @jsxImportSource solid-js */
// index.astro imports this file, so editors also type-check it in website/tsconfig.json, whose JSX is React's
import { createSignal, createUniqueId, For, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconArticle, IconClose, IconHistogram, IconHome, IconSearch, IconSetting, IconShoppingBag, IconUserGroup } from '@fibrae/semi-icons-solid';
import { Avatar, Badge, Breadcrumb, Button, DatePicker, Input, LocaleProvider, Nav, Pagination, RadioGroup, Select, Table, Tag, TextArea, type AvatarColor, type ColumnProps, type TagColor } from '@fibrae/semi-ui-solid';
import type { Locale } from '#/i18n/locales';
import './app-window.css';

type Status = 'pending' | 'approved' | 'rejected';

interface Row {
    id: string;
    name: string;
    initial: string;
    color: AvatarColor;
    status: Status;
    amount: string;
    date: string;
}

const statusColor: Record<Status, TagColor> = { pending: 'orange', approved: 'green', rejected: 'red' };

// Fixed values only: the page is prerendered, so nothing may depend on the build date
const text = {
    'zh-CN': {
        app: '星河运营台',
        nav: ['工作台', '审批中心', '订单管理', '客户', '数据报表', '系统设置'],
        crumbs: ['审批中心', '报销单'],
        search: '搜索单号或姓名',
        title: '报销审批',
        create: '新建报销',
        applicant: '申请人',
        department: '所属部门',
        departments: ['市场部', '销售部', '研发部', '财务部'],
        range: ['2026-10-01', '2026-10-31'],
        query: '查询',
        columns: { id: '报销单号', applicant: '申请人', status: '状态', amount: '金额', date: '提交时间' },
        status: { pending: '待审批', approved: '已通过', rejected: '已驳回' },
        total: '共 128 条',
        rows: [
            { id: 'BX-20261031-018', name: '陈雨桐', initial: '陈', color: 'amber', status: 'pending', amount: '¥3,860.00', date: '10-31 09:42' },
            { id: 'BX-20261030-054', name: '王嘉树', initial: '王', color: 'light-blue', status: 'approved', amount: '¥1,248.50', date: '10-30 17:15' },
            { id: 'BX-20261030-032', name: '周思齐', initial: '周', color: 'green', status: 'pending', amount: '¥12,400.00', date: '10-30 11:08' },
            { id: 'BX-20261029-077', name: '赵明哲', initial: '赵', color: 'violet', status: 'rejected', amount: '¥568.00', date: '10-29 15:36' },
            { id: 'BX-20261029-041', name: '刘若溪', initial: '刘', color: 'red', status: 'approved', amount: '¥2,190.00', date: '10-29 10:20' },
        ],
        sheet: {
            title: '报销单详情',
            meta: '市场部 · BX-20261031-018',
            reason: ['报销事由', '杭州展会差旅'],
            amount: ['报销金额', '¥', '3,860.00'],
            date: ['发生日期', '2026-10-22'],
            decision: ['审批结论', '同意', '驳回'],
            comment: ['审批意见', '票据齐全，金额与差旅标准一致。'],
            cancel: '取消',
            submit: '提交结论',
            close: '关闭',
        },
    },
    'en-US': {
        app: 'Galaxy Ops',
        nav: ['Dashboard', 'Approvals', 'Orders', 'Customers', 'Reports', 'Settings'],
        crumbs: ['Approvals', 'Expense reports'],
        search: 'Search ID or name',
        title: 'Expense approvals',
        create: 'New report',
        applicant: 'Applicant',
        department: 'Department',
        departments: ['Marketing', 'Sales', 'Engineering', 'Finance'],
        range: ['2026-10-01', '2026-10-31'],
        query: 'Search',
        columns: { id: 'Report ID', applicant: 'Applicant', status: 'Status', amount: 'Amount', date: 'Date' },
        status: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' },
        total: '128 reports',
        rows: [
            { id: 'EX-20261031-018', name: 'Emily Chen', initial: 'E', color: 'amber', status: 'pending', amount: '$3,860.00', date: 'Oct 31' },
            { id: 'EX-20261030-054', name: 'Ryan Wang', initial: 'R', color: 'light-blue', status: 'approved', amount: '$1,248.50', date: 'Oct 30' },
            { id: 'EX-20261030-032', name: 'Grace Zhou', initial: 'G', color: 'green', status: 'pending', amount: '$12,400.00', date: 'Oct 30' },
            { id: 'EX-20261029-077', name: 'Daniel Zhao', initial: 'D', color: 'violet', status: 'rejected', amount: '$568.00', date: 'Oct 29' },
            { id: 'EX-20261029-041', name: 'Olivia Liu', initial: 'O', color: 'red', status: 'approved', amount: '$2,190.00', date: 'Oct 29' },
        ],
        sheet: {
            title: 'Expense report details',
            meta: 'Marketing · 20261031-018',
            reason: ['Purpose', 'Trade show trip, Hangzhou'],
            amount: ['Amount', '$', '3,860.00'],
            date: ['Date', '2026-10-22'],
            decision: ['Decision', 'Approve', 'Reject'],
            comment: ['Comment', 'Receipts complete. Amount matches the travel policy.'],
            cancel: 'Cancel',
            submit: 'Submit decision',
            close: 'Close',
        },
    },
} satisfies Record<Locale, unknown>;

const navIcons = [IconHome, IconArticle, IconShoppingBag, IconUserGroup, IconHistogram, IconSetting];

function SemiMark() {
    return (
        <svg width="24" height="24" viewBox="40 40 360 360" aria-hidden="true">
            <path d="M200 60A120 120 0 0 0 200 300Z" fill="var(--semi-color-primary)" />
            <path d="M240 140A120 120 0 0 1 240 380Z" fill="var(--semi-color-primary)" />
        </svg>
    );
}

export default function AppWindow(props: { locale: Locale }) {
    // Astro renders the island once per page locale; nothing changes it afterwards
    const locale = untrack(() => props.locale);
    const t = text[locale];
    const rows = t.rows as Row[];
    const [first] = rows;
    const columns: ColumnProps<Row>[] = [
        { title: t.columns.id, dataIndex: 'id', width: locale === 'zh-CN' ? 160 : 150 },
        {
            title: t.columns.applicant,
            dataIndex: 'name',
            width: locale === 'zh-CN' ? 108 : 142,
            render: (_, row) => (
                <span class="app-window-person">
                    <Avatar size="extra-small" color={row.color}>
                        {row.initial}
                    </Avatar>
                    {row.name}
                </span>
            ),
        },
        {
            title: t.columns.status,
            dataIndex: 'status',
            width: locale === 'zh-CN' ? 88 : 104,
            render: (_, row) => (
                <Tag color={statusColor[row.status]} type="light">
                    {t.status[row.status]}
                </Tag>
            ),
        },
        { title: t.columns.amount, dataIndex: 'amount', align: 'right', width: locale === 'zh-CN' ? 112 : 104 },
        { title: t.columns.date, dataIndex: 'date' },
    ];
    const [selectedRowKeys, setSelectedRowKeys] = createSignal<(string | number)[]>([first.id]);
    const decisionId = createUniqueId();

    return (
        <LocaleProvider locale={locale === 'zh-CN' ? zh_CN : en_US}>
            <div class="app-window">
                <Nav class="app-window-nav" header={{ logo: () => <SemiMark />, text: t.app }} defaultSelectedKeys={['1']} footer={{ collapseButton: false }}>
                    <For each={t.nav}>
                        {(label, index) => (
                            <Nav.Item
                                itemKey={String(index())}
                                icon={<Dynamic component={navIcons[index()]} />}
                                text={
                                    index() === 1 ? (
                                        <span class="app-window-nav-badge">
                                            {label}
                                            <Badge count={23} />
                                        </span>
                                    ) : (
                                        label
                                    )
                                }
                            />
                        )}
                    </For>
                </Nav>
                <div class="app-window-main">
                    <header class="app-window-header">
                        <Breadcrumb compact routes={t.crumbs} />
                        <Input prefix={<IconSearch />} placeholder={t.search} style={{ width: '200px' }} />
                    </header>
                    <div class="app-window-title">
                        <div class="app-window-heading">{t.title}</div>
                        <Button theme="solid">{t.create}</Button>
                    </div>
                    <div class="app-window-filters">
                        <Input placeholder={t.applicant} style={{ width: '120px' }} />
                        <Select placeholder={t.department} optionList={t.departments.map((label) => ({ value: label, label }))} style={{ width: '132px' }} />
                        <DatePicker type="dateRange" defaultValue={t.range} style={{ width: '252px' }} />
                        <Button class="app-window-query">{t.query}</Button>
                    </div>
                    <Table class="app-window-table" rowKey="id" columns={columns} dataSource={rows} rowSelection={{ selectedRowKeys: selectedRowKeys(), onChange: (keys) => setSelectedRowKeys(keys ?? []) }} pagination={false} />
                    <div class="app-window-pagination">
                        <span>{t.total}</span>
                        <Pagination total={128} defaultCurrentPage={1} />
                    </div>
                </div>
                <aside class="app-window-sheet">
                    <div class="app-window-sheet-header">
                        <div class="app-window-heading">{t.sheet.title}</div>
                        <Button theme="borderless" type="tertiary" icon={<IconClose />} aria-label={t.sheet.close} />
                    </div>
                    <div class="app-window-sheet-body">
                        <div class="app-window-person app-window-applicant">
                            <Avatar size="small" color={first.color}>
                                {first.initial}
                            </Avatar>
                            <span class="app-window-applicant-name">
                                <strong>{first.name}</strong>
                                <span>{t.sheet.meta}</span>
                            </span>
                            <Tag color="orange" type="light">
                                {t.status.pending}
                            </Tag>
                        </div>
                        {/* Plain fields instead of Form: Form's entry pulls every field component (Upload, Cascader, TreeSelect...) into this island */}
                        <label class="app-window-field">
                            <span class="app-window-label">{t.sheet.reason[0]}</span>
                            <Input defaultValue={t.sheet.reason[1]} />
                        </label>
                        <div class="app-window-sheet-row">
                            <label class="app-window-field">
                                <span class="app-window-label">{t.sheet.amount[0]}</span>
                                <Input defaultValue={t.sheet.amount[2]} prefix={t.sheet.amount[1]} />
                            </label>
                            <label class="app-window-field">
                                <span class="app-window-label">{t.sheet.date[0]}</span>
                                <DatePicker defaultValue={t.sheet.date[1]} />
                            </label>
                        </div>
                        <div class="app-window-field">
                            <span id={decisionId} class="app-window-label">
                                {t.sheet.decision[0]}
                            </span>
                            <RadioGroup
                                aria-labelledby={decisionId}
                                defaultValue="approve"
                                options={[
                                    { value: 'approve', label: t.sheet.decision[1] },
                                    { value: 'reject', label: t.sheet.decision[2] },
                                ]}
                            />
                        </div>
                        <label class="app-window-field">
                            <span class="app-window-label">{t.sheet.comment[0]}</span>
                            <TextArea defaultValue={t.sheet.comment[1]} rows={3} />
                        </label>
                    </div>
                    <div class="app-window-sheet-footer">
                        <Button type="tertiary">{t.sheet.cancel}</Button>
                        <Button theme="solid">{t.sheet.submit}</Button>
                    </div>
                </aside>
            </div>
        </LocaleProvider>
    );
}
