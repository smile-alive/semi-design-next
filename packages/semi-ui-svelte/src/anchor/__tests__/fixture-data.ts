import type { AnchorLinkItem, AnchorProps } from '../interface';

export const flat = (...ids: string[]): AnchorLinkItem[] => ids.map((id) => ({ href: `#${id}`, title: id }));

/** welcome, api > docs > (doc1, doc2), contact */
export const nested: AnchorLinkItem[] = [
    { href: '#welcome', title: 'welcome' },
    {
        href: '#api',
        title: 'api too much to show',
        children: [
            {
                href: '#docs',
                title: 'docs',
                children: [
                    { href: '#doc1', title: 'doc1' },
                    { href: '#doc2', title: 'doc2' },
                ],
            },
        ],
    },
    { href: '#contact', title: 'contact' },
];

export const collapsible: AnchorLinkItem[] = [
    {
        href: '#Semi Design',
        title: '1. Semi Design',
        children: [
            {
                href: '#组件',
                title: '1.1 组件',
                children: [
                    { href: '#头像', title: '1.1.1 Avatar' },
                    { href: '#按钮', title: '1.1.2 Button' },
                    { href: '#图标', title: '1.1.3 Icon' },
                ],
            },
            { href: '#物料', title: '1.2 物料' },
            { href: '#主题商店', title: '1.3 主题商店' },
        ],
    },
    { href: '#设计语言', title: '2. 设计语言' },
];

export interface Fixture {
    props: AnchorProps;
    sections: string[];
    boxId?: string;
    showBox?: boolean;
    extraBoxes?: boolean;
    nodeTitles?: boolean;
}
