import { createElement, useState, type ElementType } from 'react';
// The package alias points at src/ and cannot reach the root package.json or svgs/meta.json, hence #packages/
import iconMeta from '#packages/semi-icons-core/svgs/icons/meta.json';
import iconLabMeta from '#packages/semi-icons-core/svgs/lab/meta.json';
import pkgJson from '#packages/semi-icons-react/package.json';
import * as SemiIconSet from '@fibrae/semi-icons-react';
import * as SemiIconLabSet from '@fibrae/semi-icons-react/lab';
import { Tabs, TabPane, Typography, Tag, Toast, Collapsible } from '@fibrae/semi-ui-react';
import '../icon-list.css';

const { Title, Text } = Typography;
const { IconChevronDown } = SemiIconSet;
// A plain object allows lookup by runtime export name
const semiIcons: Record<string, unknown> = { ...SemiIconSet };
const semiLabIcons: Record<string, unknown> = { ...SemiIconLabSet };

interface IconMeta {
    name: string;
    category: string;
}
type IconGroups = [string, IconMeta[]][];
type PkgType = 'default' | 'lab';

const messages = {
    'zh-CN': { fill: '面性图标', stroked: '线性图标', ai: 'AI 图标', lab: '彩色图标' },
    'en-US': { fill: 'Fill Icons', stroked: 'Stroked Icons', ai: 'AI Icons', lab: 'Colorful Icons' },
};

// meta.json uses snake or kebab names (a_i_bell_level_1, back-top); exports are IconAIBellLevel1, IconBackTop
const toIcon = ({ name, category }: IconMeta) => ({
    name: `Icon${name
        .split(/[-_\s]+/)
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join('')}`,
    category,
});
const iconData = iconMeta.map(toIcon);
const iconLabData = iconLabMeta.map(toIcon);

const aiCategories = ['One Color', 'Two Color', 'Multiple Color'];

const groupByCategory = (icons: IconMeta[]): IconGroups => {
    const groups = new Map<string, IconMeta[]>();
    icons.forEach((icon) => groups.set(icon.category, [...(groups.get(icon.category) ?? []), icon]));
    return [...groups].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
};

const aiIcons = iconData.filter((icon) => aiCategories.includes(icon.category));
const otherIcons = iconData.filter((icon) => !aiCategories.includes(icon.category));
const fillGroups = groupByCategory(otherIcons.filter((icon) => !icon.name.endsWith('Stroked')));
const strokedGroups = groupByCategory(otherIcons.filter((icon) => icon.name.endsWith('Stroked')));
const aiGroups: IconGroups = aiCategories.map((category) => [category, aiIcons.filter((icon) => icon.category === category)]);
const labGroups = groupByCategory(iconLabData);

const buttonResetStyle = {
    padding: 0,
    border: 'none',
    background: 'none',
    font: 'inherit',
    color: 'inherit',
    cursor: 'pointer',
};

// Fills the list item so its own layout and hover color apply
const itemButtonStyle = {
    ...buttonResetStyle,
    display: 'flex',
    flexFlow: 'column',
    alignItems: 'center',
    width: '100%',
    height: '100%',
};

const SemiIcon = ({ name, pkgType }: { name: string; pkgType: PkgType }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const componentText = `<${name} />`;
        void navigator.clipboard.writeText(componentText);
        setCopied(true);
        Toast.success({
            content: `${componentText} copied! `,
            duration: 1.5,
            onClose() {
                setCopied(false);
            },
        });
    };

    return (
        <li className={`semi-icons-item${copied ? ' semi-icons-item-copied' : ''}`}>
            <button type="button" style={itemButtonStyle} onClick={handleCopy}>
                <span className="semi-icons-item-content">{createElement((pkgType === 'default' ? semiIcons[name] : semiLabIcons[name]) as ElementType)}</span>
                <Text size="small" className="semi-icons-item-name">
                    {name}
                </Text>
            </button>
        </li>
    );
};

interface IconCategoryProps {
    groups: IconGroups;
    pkgType: PkgType;
    className?: string;
}

const IconCategory = ({ groups, pkgType, className = '' }: IconCategoryProps) => {
    const [categorySet, setCategorySet] = useState(() => new Set(groups.map((_g, i) => i)));

    const handleToggle = (i: number) => {
        setCategorySet((c) => {
            const next = new Set(c);
            if (next.has(i)) {
                next.delete(i);
            } else {
                next.add(i);
            }
            return next;
        });
    };
    return groups.map((g, i) => (
        <article key={i} className={`semi-icons-category ${className}`}>
            <Title heading={5}>
                <button type="button" id={g[0]} className="semi-icons-title" style={buttonResetStyle} onClick={() => handleToggle(i)}>
                    {g[0]}&nbsp;&nbsp;
                    <IconChevronDown className={`semi-icons-title${categorySet.has(i) ? '' : ' semi-icons-title-closed'}`} />
                </button>
            </Title>
            <Collapsible motion={false} isOpen={categorySet.has(i)} style={{ position: 'relative' }}>
                <ul className="semi-icons-content">
                    {g[1].map((icon) => (
                        <SemiIcon key={icon.name} name={icon.name} pkgType={pkgType} />
                    ))}
                </ul>
            </Collapsible>
        </article>
    ));
};

export default function IconList({ locale }: { locale: 'zh-CN' | 'en-US' }) {
    const t = messages[locale];
    return (
        <div className="semi-icons-container">
            <div>
                <img style={{ marginRight: 8 }} src={`https://badgen.net/badge/${encodeURIComponent(pkgJson.name)}/${pkgJson.version}?blue`} alt="" />
                <img src={`https://badgen.net/badge/count/${iconData.length}/blue`} alt="" />
                <img style={{ marginRight: 8, marginLeft: 24 }} src={`https://badgen.net/badge/${encodeURIComponent(`${pkgJson.name}/lab`)}/${pkgJson.version}?color=cyan`} alt="" />
                <img src={`https://badgen.net/badge/count/${iconLabData.length}/cyan`} alt="" />
            </div>
            <Tabs keepDOM>
                <TabPane tab={t.fill} itemKey="fill">
                    <IconCategory groups={fillGroups} pkgType="default" />
                </TabPane>
                <TabPane tab={t.stroked} itemKey="stroked">
                    <IconCategory groups={strokedGroups} pkgType="default" />
                </TabPane>
                <TabPane
                    tab={
                        <div style={{ display: 'flex', alignItems: 'center', columnGap: 5 }}>
                            {t.ai}
                            <Tag size="large" shape="square" color="purple">
                                New
                            </Tag>
                        </div>
                    }
                    itemKey="ai"
                >
                    <IconCategory groups={aiGroups} pkgType="default" className="icon-ai" />
                </TabPane>
            </Tabs>
            <Title heading={2}>{t.lab}</Title>
            <IconCategory groups={labGroups} pkgType="lab" />
        </div>
    );
}
