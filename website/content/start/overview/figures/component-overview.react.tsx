import { frameworkHref } from '#/lib/framework-links';
import type { Framework } from '#/lib/frameworks';
import { pathsByEnTitle } from './component-overview-pages.ts';
import '../component-overview.css';

// Cards that point at a section of another page rather than a same-named doc page
const specialUrl: Record<string, string> = {
    'AIIcon 图标': '/zh-CN/react/basic/tokens',
    'AIButton 按钮': '/zh-CN/react/basic/button#ai-风格---多彩按钮',
    'AITag 标签': '/zh-CN/react/show/tag#ai-风格---多彩标签',
    'AIFloatButton 悬浮按钮': '/zh-CN/react/basic/float-button#ai-风格---多彩悬浮按钮',
    AIIcon: '/en-US/react/basic/icon',
    AIButton: '/en-US/react/basic/button#ai-style---colorful-buttons',
    AITag: '/en-US/react/show/tag#ai-style---colorful-labels',
    AIFloatButton: '/en-US/react/basic/float-button#ai-style---colorful-floating-buttons',
};

// For cards whose name and English name (first word) match no English doc title
const titleAlias: Record<string, string> = {
    'VChart 图表': 'Data Visualization',
    VChart: 'Data Visualization',
    'Markdown 渲染器': 'Markdown Render',
    'Lottie 动画': 'Lottie Animation',
    'Descriptions 描述列表': 'Description',
};

const imageUrl = (enName: string, dark: boolean) => `/assets/${dark ? 'components-dark' : 'components'}/${enName}.${dark ? 'png' : 'jpg'}`;

export default function ComponentOverview({ locale, names, framework }: { locale: string; names: string[]; framework: Framework }) {
    const { paths, available } = pathsByEnTitle();
    return (
        <div className="semi-overview-list">
            {names.map((name: string) => {
                const enName = name.split(' ')[0];
                const path = paths[titleAlias[name] ?? name] ?? paths[enName];
                const url = frameworkHref(specialUrl[name] ?? (path && `/${locale}/react/${path}`), framework, available);
                const card = (
                    <>
                        <img src={imageUrl(enName, false)} className="semi-overview-card-image semi-overview-card-image-light" alt="" />
                        <img src={imageUrl(enName, true)} className="semi-overview-card-image semi-overview-card-image-dark" alt="" />
                        <div className="semi-overview-card-text">{name}</div>
                    </>
                );
                // Names without a page title render as plain cards
                return url ? (
                    <a key={name} href={url} className="semi-overview-card">
                        {card}
                    </a>
                ) : (
                    <div key={name} className="semi-overview-card">
                        {card}
                    </div>
                );
            })}
        </div>
    );
}
