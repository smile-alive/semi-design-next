import { useMemo, useState } from 'react';
import { Tabs, Table, type ColumnProps } from '@fibrae/semi-ui-react';
import { global, normal, animation } from '../theme-tokens.js';

interface Token {
    key: string;
    value: string;
    comment?: string;
    color?: string;
}
type Locale = 'zh-CN' | 'en-US';
type Mode = 'light' | 'dark';

// theme-tokens.js is untyped JS, so its token lists are re-typed here
const globalTokens: Record<Mode, Token[]> = global;

const messages = {
    'zh-CN': { variable: '变量', defaultValue: '默认值', usage: '用法', WIP: '暂无' },
    'en-US': { variable: 'variable', defaultValue: 'defaultValue', usage: 'usage', WIP: 'WIP' },
};

const trimDollar = (text: string) => text.replace(/^\$+|\$+$/g, '');

const jumpTargets = new Set([...global.light, ...normal].map((token) => token.key));

const JumpLink = ({ value, locale }: { value: string; locale: Locale }) => {
    const target = value.startsWith('var') ? value.slice(4, value.length - 1) : value;
    if (!jumpTargets.has(target)) {
        return <div>{value}</div>;
    }
    const params = new URLSearchParams({ token: trimDollar(target) });
    return (
        <a href={`/${locale}/react/basic/tokens?${params}`} style={{ display: 'block' }}>
            {value}
        </a>
    );
};

const TokenTable = ({ tokenList, locale, mode = 'light' }: { tokenList: Token[]; locale: Locale; mode?: Mode }) => {
    const t = messages[locale];
    const columns: ColumnProps<Token>[] = [
        {
            title: t.variable,
            dataIndex: 'key',
            render: (text, record) => (
                <div data-token={trimDollar(text)} style={{ fontWeight: 600 }}>
                    {record.color && (
                        <>
                            {' '}
                            <div
                                style={{
                                    width: 16,
                                    height: 16,
                                    display: 'inline-block',
                                    borderRadius: 3,
                                    background: record.color,
                                    transform: 'translateY(0.3rem)',
                                    marginRight: 8,
                                }}
                                className={mode === 'dark' ? 'semi-always-dark' : 'semi-always-light'}
                            />{' '}
                        </>
                    )}
                    {text}
                </div>
            ),
        },
        {
            title: t.defaultValue,
            dataIndex: 'value',
            render: (text) => <JumpLink value={text} locale={locale} />,
        },
        {
            title: t.usage,
            dataIndex: 'comment',
            render: (text) => <div>{text || t.WIP}</div>,
        },
    ];
    return <Table key={mode} columns={columns} dataSource={tokenList} />;
};

const GlobalTokenTab = ({ reg, locale }: { reg: RegExp; locale: Locale }) => {
    const [mode, setMode] = useState<Mode>('light');
    const modeTokens = globalTokens[mode].filter((token) => reg.test(token.key));
    const tokenList = [...modeTokens, ...normal.filter((token) => reg.test(token.key))].map((token) => (token.key.startsWith('--semi-color') ? { ...token, color: token.value } : token));
    if (!modeTokens.length) {
        return <TokenTable tokenList={tokenList} locale={locale} />;
    }
    return (
        <Tabs
            defaultActiveKey="light"
            tabList={[
                { tab: 'Light', itemKey: 'light' },
                { tab: 'Dark', itemKey: 'dark' },
            ]}
            onChange={(key) => setMode(key as Mode)}
        >
            <TokenTable tokenList={tokenList} locale={locale} mode={mode} />
        </Tabs>
    );
};

const GlobalAnimationToken = ({ locale }: { locale: Locale }) => {
    const tokenMap = useMemo(() => {
        const map: Record<string, Token[]> = {};
        animation.forEach((token) => {
            const tab = token.key.match(/--semi-transition_([\w\W]+)-/)?.[1] ?? 'other';
            map[tab] = [...(map[tab] ?? []), token];
        });
        return map;
    }, []);
    return (
        <Tabs defaultActiveKey={Object.keys(tokenMap)[0]}>
            {Object.entries(tokenMap).map(([category, tokenList]) => (
                <Tabs.TabPane tab={category} itemKey={category} key={category}>
                    <TokenTable tokenList={tokenList} locale={locale} />
                </Tabs.TabPane>
            ))}
        </Tabs>
    );
};

interface GlobalTokenProps {
    locale: Locale;
    reg: RegExp;
    isAnimation?: boolean;
}

export default function GlobalToken({ locale, reg, isAnimation }: GlobalTokenProps) {
    return isAnimation ? <GlobalAnimationToken locale={locale} /> : <GlobalTokenTab reg={reg} locale={locale} />;
}
