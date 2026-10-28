import { createMemo, splitProps } from 'solid-js';
import Table, { type ColumnProps, type TableProps } from '../../table';
import { isMarkdownElement, type MarkdownElement, readMarkdownData, renderMarkdownNode } from '../runtime';

// by position, not tag, so a `components` override of th or td still counts; drops the text between elements
const elementsOf = (node?: MarkdownElement) => [node?.props.children].flat().filter(isMarkdownElement);

function parseTable(content: unknown): { columns: ColumnProps[]; dataSource: { key: string }[] } {
    const sections = [content].flat().filter(isMarkdownElement);
    const thead = sections.find((node) => node.type === 'thead');
    // a custom rehype plugin can put a tr directly under the table
    const tbodyRows = sections.flatMap((node) => (node.type === 'tbody' ? elementsOf(node) : node.type === 'tr' ? [node] : []));
    // rehype-raw puts every row of a thead-less table in the tbody, so the first row is the header
    const [headRow, ...bodyRows] = thead ? [elementsOf(thead)[0], ...tbodyRows] : tbodyRows;
    const body = bodyRows.map((row) => elementsOf(row).map((cell) => cell.props.children));
    // the cell content is created where Table inserts it, so the server and the first client render match
    const columns = elementsOf(headRow).map((cell, i): ColumnProps => ({
        dataIndex: String(i),
        title: () => renderMarkdownNode(cell.props.children),
        // the runtime compiles with stylePropertyNameCase 'css', and both compilers turn a cell's align into this style
        align: (cell.props.style as { 'text-align'?: ColumnProps['align'] } | undefined)?.['text-align'],
        render: (_, record: { key: string }) => renderMarkdownNode(body[Number(record.key)][i]),
    }));
    return { columns, dataSource: body.map((_, i) => ({ key: String(i) })) };
}

export default function MarkdownTable(props: TableProps) {
    const [local, rest] = splitProps(props, ['children']);

    // read as data: reading the children as nodes would create cells that are never inserted
    const parsed = createMemo(() => parseTable(readMarkdownData(() => local.children)));

    // a chat message must not hide rows behind the default 10-row pagination
    return <Table columns={parsed().columns} dataSource={parsed().dataSource} pagination={false} {...rest} />;
}
