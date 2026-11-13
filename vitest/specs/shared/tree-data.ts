export interface TreeSpecNode {
    label: string;
    value: string;
    key: string;
    disabled?: boolean;
    isLeaf?: boolean;
    children?: TreeSpecNode[];
}

export const leaf = (label: string, key = label.toLowerCase()): TreeSpecNode => ({ label, value: label, key });

export const regions: TreeSpecNode[] = [
    {
        label: 'Asia',
        value: 'Asia',
        key: 'asia',
        children: [
            { label: 'China', value: 'China', key: 'china', children: [leaf('Beijing'), leaf('Shanghai')] },
            { label: 'Japan', value: 'Japan', key: 'japan', children: [leaf('Tokyo'), leaf('Osaka')] },
        ],
    },
    { label: 'North America', value: 'North America', key: 'north-america', children: [leaf('Canada'), leaf('Mexico')] },
];

export const withNode = (nodes: TreeSpecNode[], key: string, patch: Partial<TreeSpecNode>): TreeSpecNode[] => nodes.map((node) => (node.key === key ? { ...node, ...patch } : { ...node, children: node.children && withNode(node.children, key, patch) }));

export const withoutNode = (nodes: TreeSpecNode[], key: string): TreeSpecNode[] => nodes.filter((node) => node.key !== key).map((node) => ({ ...node, children: node.children && withoutNode(node.children, key) }));
