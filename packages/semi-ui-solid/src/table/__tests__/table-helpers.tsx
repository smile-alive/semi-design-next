import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import type { getData } from '@test/utils/solid';
import Tag from '../../tag';
import Tooltip from '../../tooltip';
import Column from '../column';
import type { ColumnProps } from '../interface';

export const P = `${BASE_CLASS_PREFIX}-table`;

export const queryAll = <E extends Element = HTMLElement>(selector: string) => Array.from(document.querySelectorAll<E & HTMLElement>(selector));
export const getBodyRows = () => queryAll(`.${P}-tbody .${P}-row`);
export const getExpandedRowKeys = () => queryAll(`.${P}-tbody .${P}-row-expanded`).map((row) => row.getAttribute('data-row-key'));
export const getFirstCellText = () => document.querySelector(`.${P}-tbody .${P}-row .${P}-row-cell`)?.textContent;
export const getPageItems = () => queryAll(`.${BASE_CLASS_PREFIX}-page .${BASE_CLASS_PREFIX}-page-item`);
export const getActivePage = () => document.querySelector(`.${BASE_CLASS_PREFIX}-page .${BASE_CLASS_PREFIX}-page-item-active`);
export const getHeaderSelectionCheckbox = () => document.querySelector<HTMLElement>(`.${P}-thead .${P}-column-selection .${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement;
export const containsSelector = (el: Element, selector: string) => el.matches(selector) || el.querySelector(selector) !== null;
export const query = <E extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<E>(selector) as E;

type Row = ReturnType<typeof getData>[number];

export function getColumns(): ColumnProps[] {
    return [
        { title: 'Name', dataIndex: 'name', width: 150, fixed: 'left' },
        { title: 'Age', dataIndex: 'age', width: 150 },
        { title: 'Description', dataIndex: 'description' },
        { title: 'Address', dataIndex: 'address' },
        {
            render: (_text, record: Row) => (
                <Tooltip content={record.description}>
                    <Tag color="green">Show Info</Tag>
                </Tooltip>
            ),
            width: 150,
            fixed: 'right',
        },
    ];
}

export function getJSXColumns() {
    return (
        <>
            <Column title="Name" dataIndex="name" width={150} />
            <Column title="Age" dataIndex="age" width={150} />
            <Column title="Address" dataIndex="address" />
            <Column<Row>
                render={(_text, record) => (
                    <Tooltip content={record.description}>
                        <Tag color="green">Show Info</Tag>
                    </Tooltip>
                )}
                width={150}
            />
        </>
    );
}

export function getGroupColumns(): ColumnProps[] {
    return [
        { dataIndex: 'city', title: 'City', width: 400, sorter: (a, b) => (a.city > b.city ? 1 : -1) },
        {
            dataIndex: 'job',
            title: 'Job',
            width: 200,
            filters: [
                { text: 'IOS', value: 'IOS' },
                { text: 'Android', value: 'Android' },
            ],
            onFilter: (value, record) => record.job && record.job.indexOf(value) === 0,
        },
        { dataIndex: 'department', title: 'Department' },
    ];
}

export function getNestColumns(): ColumnProps[] {
    return [
        {
            title: 'Base Information',
            fixed: 'left',
            children: [
                {
                    title: 'Name',
                    dataIndex: 'name',
                    fixed: 'left',
                    width: 200,
                    filters: [
                        { text: 'Code 45', value: '45' },
                        { text: 'King 4', value: 'King 4' },
                    ],
                    onFilter: (value, record) => record.name.includes(value),
                },
                { title: 'Age', dataIndex: 'age', fixed: 'left', width: 100, sorter: (a, b) => (a.age - b.age > 0 ? 1 : -1) },
            ],
        },
        {
            title: 'Company Information',
            children: [
                { title: 'Company Name', dataIndex: 'company.name' },
                { title: 'Company Address', dataIndex: 'company.address' },
            ],
        },
        { title: 'Address', width: 250, dataIndex: 'address', fixed: 'right' },
    ];
}
