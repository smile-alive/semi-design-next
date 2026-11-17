/** An ESTree node from rolldown's `parseSync` */
export interface Node {
    type: string;
    start: number;
    end: number;
    [key: string]: unknown;
}

export const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null && typeof (value as Node).type === 'string';

const asNodes = (value: unknown) => (Array.isArray(value) ? value.filter(isNode) : isNode(value) ? [value] : []);

export const children = (node: Node) => Object.values(node).flatMap(asNodes);

export const lineAt = (source: string, offset: number) => source.slice(0, offset).split('\n').length;
