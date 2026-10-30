import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
import type { ColumnAlign, ColumnProps } from '../../table/index.js';
import { type MarkdownChild, type MarkdownNode, isNode } from '../runtime.js';
import Code from './code.svelte';
import Img from './img.svelte';

const childNodes = (child: MarkdownChild) => (Array.isArray(child) ? child : [child]).filter(isNode);

/** The Semi img renders a div, which a p cannot hold. Known limit: only the Semi img is detected, not a replacement. */
export function containsImage(child: MarkdownChild): boolean {
    return childNodes(child).some((node) => node.type === Img || containsImage(node.props.children as MarkdownChild));
}

/** A rehype plugin may split code text into elements, which have no source text to highlight */
export function isPlainText(child: MarkdownChild) {
    return Array.isArray(child) ? child.every(isPlainText) : !isNode(child);
}

/** CodeHighlight's div and pre may not sit inside a pre, so the wrapper of a block the Semi code highlights goes */
export function isHighlightedBlock(child: MarkdownChild) {
    const content = [child].flat().filter((item) => typeof item !== 'string' || item.trim() !== '');
    if (content.length !== 1 || !isNode(content[0])) return false;
    const { type, props } = content[0];
    return type === Code && Boolean(MarkdownRenderFoundation.getCodeLanguage(props.class as string | undefined)) && isPlainText(props.children as MarkdownChild);
}

/** The plain text of a subtree, through components too */
export function textOf(child: MarkdownChild): string {
    if (Array.isArray(child)) return child.map(textOf).join('');
    if (isNode(child)) return textOf(child.props.children as MarkdownChild);
    return typeof child === 'string' || typeof child === 'number' ? String(child) : '';
}

export interface ParsedTable {
    columns: ColumnProps[];
    dataSource: { key: string }[];
    /** Content of each header cell, by column */
    head: MarkdownChild[];
    /** Content of each body cell, by row and column */
    body: MarkdownChild[][];
}

// by position, not tag, so a `components` override of tr, th or td still counts
const elementsOf = (node?: MarkdownNode) => childNodes(node?.props.children as MarkdownChild);

export function parseTable(content: MarkdownChild): ParsedTable {
    const sections = childNodes(content);
    const thead = sections.find((node) => node.type === 'thead');
    // a custom rehype plugin can put a tr directly under the table
    const tbodyRows = sections.flatMap((node) => (node.type === 'tbody' ? elementsOf(node) : node.type === 'tr' ? [node] : []));
    // rehype-raw puts every row of a thead-less table in the tbody, so the first row is the header
    const [headRow, ...bodyRows] = thead ? [elementsOf(thead)[0], ...tbodyRows] : tbodyRows;
    const head = elementsOf(headRow);
    const body = bodyRows.map((row) => elementsOf(row).map((cell) => cell.props.children as MarkdownChild));
    return {
        columns: head.map((cell, i) => ({
            dataIndex: String(i),
            title: textOf(cell.props.children as MarkdownChild),
            // the runtime compiles with stylePropertyNameCase 'css', and both compilers turn a cell's align into this style
            align: (cell.props.style as { 'text-align'?: ColumnAlign } | undefined)?.['text-align'],
        })),
        dataSource: body.map((_, i) => ({ key: String(i) })),
        head: head.map((cell) => cell.props.children as MarkdownChild),
        body,
    };
}
