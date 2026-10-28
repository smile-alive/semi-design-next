import * as React from 'react';
import type { PropsWithChildren } from 'react';
import { omit } from 'es-toolkit';
import Table, { type TableProps } from '../../table';

export default function table(props: PropsWithChildren<TableProps>) {
    const { children } = props;

    // children may be one element, an array or whitespace text, so normalize via Children.toArray
    const elementChildren = React.Children.toArray(children).filter(React.isValidElement<{ children?: React.ReactNode }>);

    const thead = elementChildren.find((node) => node.type === 'thead');
    const toRows = (section?: React.ReactElement<{ children?: React.ReactNode }>) => React.Children.toArray(section?.props.children).filter(React.isValidElement<{ children?: React.ReactNode }>);

    // without a thead (rehype-raw) the first tbody row is the header; trs directly under the table are body rows too
    const tbodyRows = elementChildren.flatMap((node) => (node.type === 'tbody' ? toRows(node) : node.type === 'tr' ? [node] : []));
    const [headTr, ...bodyRows] = thead ? [toRows(thead)[0], ...tbodyRows] : tbodyRows;
    const headerCells = React.Children.toArray(headTr?.props.children);

    const titlesColumns = headerCells.map((column: any, i) => {
        return {
            dataIndex: String(i),
            title: column?.props?.children ?? '',
            align: column?.props?.style?.textAlign,
        };
    });
    const tableDataSource = bodyRows.map((row: any, i) => ({
        key: String(i),
        ...Object.fromEntries(React.Children.toArray(row?.props?.children).map((child: any, index) => [String(index), child?.props?.children ?? ''])),
    }));

    // a chat message must not hide rows behind the default 10-row pagination
    return <Table columns={titlesColumns} dataSource={tableDataSource} pagination={false} {...omit(props, ['children'])} />;
}
