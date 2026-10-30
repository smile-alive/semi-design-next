import { useState, type ComponentProps, type ReactNode } from 'react';
import { IconLink, IconArticle, IconTextRectangle, IconBriefcase, IconLikeHeart, IconSafe, IconCustomize, IconBulb, IconPuzzle, IconAlertTriangle, IconFlipHorizontal, IconAppCenter, IconListView, IconSync } from '@fibrae/semi-icons-react';
import { Anchor, Tabs, MarkdownRender, Toast } from '@fibrae/semi-ui-react';
import {
    conceptIntroduction,
    designPrinciples,
    textDesignSpecification,
    graphicDesignSpecification,
    informationPresentationSpecification,
    rtlDesignSpecification,
    conceptIntroductionEn,
    designPrinciplesEn,
    textDesignSpecificationEn,
    graphicDesignSpecificationEn,
    informationPresentationSpecificationEn,
    rtlDesignSpecificationEn,
    conceptIntroductionAnchor,
    conceptIntroductionAnchorEn,
    textDesignSpecificationAnchor,
    textDesignSpecificationAnchorEn,
    graphicDesignSpecificationAnchor,
    graphicDesignSpecificationAnchorEn,
    informationPresentationSpecificationAnchor,
    informationPresentationSpecificationAnchorEn,
    rtlDesignSpecificationAnchor,
    rtlDesignSpecificationAnchorEn,
} from '../internationalization-data.js';
import '../internationalization-tabs.scss';

type Locale = 'zh-CN' | 'en-US';
type AnchorData = { title: string; url: string }[];
type IconRenderProps = { props?: ComponentProps<typeof IconArticle> };

function makeAnchorId(id: ReactNode) {
    if (typeof id !== 'string' || !id) {
        return null;
    }
    return id
        .toLowerCase()
        .replace(/\//g, '')
        .replace(/\s/g, '-')
        .replace(/(\(|\))/g, 'aaa')
        .replace(/\./g, '-')
        .replace(/&/g, '-')
        .replace(/(^[^一-龥^a-z%])/, 'n$1');
}

interface ImageCardProps {
    icon?: ReactNode;
    title: string;
    image: string;
    description?: ReactNode;
}

function ImageCard({ icon, title, image, description }: ImageCardProps) {
    return (
        <div className="internationalization-image-card">
            <div className="internationalization-image-card-title">
                {icon}
                {title}
            </div>
            <div className="internationalization-image-card-image">
                <img src={image} alt={title} style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="internationalization-image-card-description">{description}</div>
        </div>
    );
}

interface ColorImageCardProps extends ImageCardProps {
    color: string;
}

function ColorImageCard({ color, icon, title, image, description }: ColorImageCardProps) {
    return (
        <div className={`internationalization-color-image-card internationalization-color-image-card-${color}`}>
            <div className={`internationalization-color-image-card-${color}-title`}>
                {icon}
                {title}
            </div>
            <div className="internationalization-color-image-card-image">
                <img src={image} alt={title} style={{ width: '100%' }} />
            </div>
            <div className="internationalization-color-image-card-description">
                <div className="md markdown gatsby-p">{description}</div>
            </div>
        </div>
    );
}

function ImageList({ title, image, description }: Omit<ImageCardProps, 'icon'>) {
    return (
        <div className="internationalization-image-list">
            <div className="internationalization-image-list-image">
                <img src={image} alt={title} style={{ height: '100%', width: '240px' }} />
            </div>
            <div>
                <div className="internationalization-image-list-title">{title}</div>
                <div className="internationalization-image-list-description">
                    <div className="md markdown gatsby-p">{description}</div>
                </div>
            </div>
        </div>
    );
}

interface TextCardProps {
    color: string;
    title: ReactNode;
    description: ReactNode[];
}

function TextCard({ color, title, description }: TextCardProps) {
    return (
        <div className={`internationalization-text-card internationalization-text-card-${color}`}>
            <div className="internationalization-text-card-title">{title}</div>
            {description.map((item, index) => (
                <div className="internationalization-text-card-description" key={index}>
                    {item}
                </div>
            ))}
        </div>
    );
}

interface ColorCardProps {
    color: string;
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
}

function ColorCard({ color, icon, title, description }: ColorCardProps) {
    return (
        <div className={`internationalization-color-card internationalization-color-card-${color}`}>
            <div className={`internationalization-color-card-${color}-title`}>
                {icon}
                {title}
            </div>
            <div className="internationalization-color-card-description md markdown gatsby-p">{description}</div>
        </div>
    );
}

function ColorList({ color, title, description }: Omit<ColorCardProps, 'icon'>) {
    return (
        <div className={`internationalization-color-list internationalization-color-list-${color}`}>
            <div className={`internationalization-color-list-${color}-title`}>{title}</div>
            <div className="md markdown gatsby-p internationalization-color-list-description">{description}</div>
        </div>
    );
}

function InnerAnchor({ data = [] }: { data?: AnchorData }) {
    return (
        <Anchor size="small" showTooltip scrollMotion offsetTop={200} className="category-anchor" targetOffset={100}>
            {data.map((item) => (
                <span key={item.title}>
                    <Anchor.Link href={'#' + makeAnchorId(item.url)} title={item.title} key={item.title} />
                </span>
            ))}
        </Anchor>
    );
}

interface ChildrenProps {
    children?: ReactNode;
}

const copySuccess = { 'zh-CN': '复制成功', 'en-US': 'Copy Success' };

function makeComponents(locale: Locale) {
    const AnchorHeading = ({ as: Tag, children }: { as: 'h2' | 'h3'; children?: ReactNode }) => {
        const onIconLinkClick = () => {
            void navigator.clipboard.writeText(`${window.location.href.replace(window.location.hash, '')}#${window.encodeURI(String(children))}`).then(() => {
                Toast.success({
                    content: copySuccess[locale],
                    duration: 3,
                });
            });
        };
        return (
            <Tag className={`md markdown gatsby-${Tag}`} id={makeAnchorId(children) ?? undefined}>
                {children}
                <button type="button" style={{ padding: 0, border: 'none', background: 'none', font: 'inherit', color: 'inherit' }} onClick={onIconLinkClick}>
                    <IconLink className="anchor-link-button-icon" />
                </button>
            </Tag>
        );
    };
    return {
        h2: ({ children }: ChildrenProps) => <AnchorHeading as="h2">{children}</AnchorHeading>,
        h3: ({ children }: ChildrenProps) => <AnchorHeading as="h3">{children}</AnchorHeading>,
        p: ({ children }: ChildrenProps) => <div className="md markdown gatsby-p">{children}</div>,
        ul: ({ children }: ChildrenProps) => <ul className="md markdown gatsby-ul">{children}</ul>,
        li: ({ children }: ChildrenProps) => <li className="md markdown gatsby-li">{children}</li>,
        a: ({ children, href, target }: ChildrenProps & { href?: string; target?: string }) => (
            <a href={href} className="md gatsby-a" target={target}>
                {children}
            </a>
        ),
        IconArticle: ({ props }: IconRenderProps) => <IconArticle className="internationalization-icon" {...props} />,
        IconTextRectangle: ({ props }: IconRenderProps) => <IconTextRectangle className="internationalization-icon" {...props} />,
        IconBriefcase: ({ props }: IconRenderProps) => <IconBriefcase className="internationalization-icon" {...props} />,
        IconLikeHeart: ({ props }: IconRenderProps) => <IconLikeHeart className="internationalization-icon" {...props} />,
        IconSafe: ({ props }: IconRenderProps) => <IconSafe className="internationalization-icon" {...props} />,
        IconCustomize: ({ props }: IconRenderProps) => <IconCustomize className="internationalization-icon" {...props} />,
        IconBulb: ({ props }: IconRenderProps) => <IconBulb className="internationalization-icon" {...props} />,
        IconPuzzle: ({ props }: IconRenderProps) => <IconPuzzle className="internationalization-icon" {...props} />,
        IconAlertTriangle: ({ props }: IconRenderProps) => <IconAlertTriangle className="internationalization-icon" {...props} />,
        IconFlipHorizontal: ({ props }: IconRenderProps) => <IconFlipHorizontal className="internationalization-icon" {...props} />,
        IconAppCenter: ({ props }: IconRenderProps) => <IconAppCenter className="internationalization-icon" {...props} />,
        IconListView: ({ props }: IconRenderProps) => <IconListView className="internationalization-icon" {...props} />,
        IconSync: ({ props }: IconRenderProps) => <IconSync className="internationalization-icon" {...props} />,
        TextCard: ({ color, title, description }: TextCardProps) => <TextCard color={color} title={title} description={description} />,
        ImageCard: ({ icon, title, image, description }: ImageCardProps) => <ImageCard icon={icon} title={title} image={image} description={description} />,
        ImageList: ({ title, image, description }: Omit<ImageCardProps, 'icon'>) => <ImageList title={title} image={image} description={description} />,
        ColorCard: ({ color, icon, title, description }: ColorCardProps) => <ColorCard color={color} icon={icon} title={title} description={description} />,
        ColorList: ({ color, title, description }: Omit<ColorCardProps, 'icon'>) => <ColorList color={color} title={title} description={description} />,
        ColorImageCard: ({ color, icon, title, image, description }: ColorImageCardProps) => <ColorImageCard color={color} icon={icon} title={title} image={image} description={description} />,
    };
}

const components = { 'zh-CN': makeComponents('zh-CN'), 'en-US': makeComponents('en-US') };

function DesignSpecificationsTabs({ locale }: { locale: Locale }) {
    const isChinese = locale === 'zh-CN';
    const [key, setKey] = useState('textDesignSpecification');
    const [innerAnchorData, setInnerAnchorData] = useState<AnchorData>(isChinese ? textDesignSpecificationAnchor : textDesignSpecificationAnchorEn);
    const contentList: Record<string, string> = {
        textDesignSpecification: isChinese ? textDesignSpecification : textDesignSpecificationEn,
        graphicDesignSpecification: isChinese ? graphicDesignSpecification : graphicDesignSpecificationEn,
        informationPresentationSpecification: isChinese ? informationPresentationSpecification : informationPresentationSpecificationEn,
        rtlDesignSpecification: isChinese ? rtlDesignSpecification : rtlDesignSpecificationEn,
    };

    return (
        <>
            <InnerAnchor data={innerAnchorData} />
            <Tabs
                type="button"
                style={{ marginTop: '1.46em' }}
                tabList={[
                    {
                        tab: isChinese ? '文字设计规范' : 'Text Design Specification',
                        itemKey: 'textDesignSpecification',
                    },
                    {
                        tab: isChinese ? '图形设计规范' : 'Graphic Design Specification',
                        itemKey: 'graphicDesignSpecification',
                    },
                    {
                        tab: isChinese ? '信息呈现规范' : 'Information Presentation Specification',
                        itemKey: 'informationPresentationSpecification',
                    },
                    { tab: isChinese ? 'RTL 设计规范' : 'RTL Design Specification', itemKey: 'rtlDesignSpecification' },
                ]}
                onChange={(key) => {
                    setKey(key);
                    switch (key) {
                        case 'textDesignSpecification':
                            setInnerAnchorData(isChinese ? textDesignSpecificationAnchor : textDesignSpecificationAnchorEn);
                            break;
                        case 'graphicDesignSpecification':
                            setInnerAnchorData(isChinese ? graphicDesignSpecificationAnchor : graphicDesignSpecificationAnchorEn);
                            break;
                        case 'informationPresentationSpecification':
                            setInnerAnchorData(isChinese ? informationPresentationSpecificationAnchor : informationPresentationSpecificationAnchorEn);
                            break;
                        case 'rtlDesignSpecification':
                            setInnerAnchorData(isChinese ? rtlDesignSpecificationAnchor : rtlDesignSpecificationAnchorEn);
                            break;
                    }
                }}
            >
                <MarkdownRender style={{ marginTop: '1.46em' }} raw={contentList[key]} components={components[locale]} />
            </Tabs>
        </>
    );
}

export default function InternationalizationTabs({ locale }: { locale: Locale }) {
    const isChinese = locale === 'zh-CN';
    const [key, setKey] = useState('conceptIntroduction');
    const [anchorData, setAnchorData] = useState<AnchorData>(isChinese ? conceptIntroductionAnchor : conceptIntroductionAnchorEn);

    const contentList: Record<string, ReactNode> = {
        conceptIntroduction: <MarkdownRender raw={isChinese ? conceptIntroduction : conceptIntroductionEn} components={components[locale]} />,
        designPrinciples: <MarkdownRender raw={isChinese ? designPrinciples : designPrinciplesEn} components={components[locale]} />,
        designSpecificationsTabs: <DesignSpecificationsTabs locale={locale} />,
    };
    return (
        <>
            <InnerAnchor data={anchorData} />
            <Tabs
                type="line"
                tabList={[
                    { tab: isChinese ? '概念介绍' : 'Concept Introduction', itemKey: 'conceptIntroduction' },
                    { tab: isChinese ? '设计原则' : 'Design Principles', itemKey: 'designPrinciples' },
                    { tab: isChinese ? '设计规范' : 'Design Specifications', itemKey: 'designSpecificationsTabs' },
                ]}
                onChange={(key) => {
                    setKey(key);
                    if (key === 'conceptIntroduction') {
                        setAnchorData(isChinese ? conceptIntroductionAnchor : conceptIntroductionAnchorEn);
                    } else {
                        setAnchorData([]);
                    }
                }}
            >
                {contentList[key]}
            </Tabs>
        </>
    );
}
