import { useState, useCallback, type ComponentProps, type CSSProperties, type MouseEvent } from 'react';
import { Sidebar, Annotation, type CodeItemProps, type FileItemProps, type ImageUploadNodeOptions } from '@fibrae/semi-ai-react';
import { IconSearch, IconBriefStroked, IconCodeStroked, IconModalStroked } from '@fibrae/semi-icons-react';

const { FileContent, CodeContent } = Sidebar;
const { AnnotationContent } = Annotation;

const containerStyle: CSSProperties = {
    display: 'flex',
    height: '800px',
    border: '1px solid var(--semi-color-border)',
    borderRadius: 8,
    overflow: 'hidden',
    boxSizing: 'border-box',
};

const optionList = [
    {
        icon: <IconSearch />,
        name: '查看搜索',
        key: 'searchResult',
    },
    {
        icon: <IconBriefStroked />,
        name: '文件预览',
        key: 'filePreview',
    },
    {
        icon: <IconCodeStroked />,
        name: '代码预览',
        key: 'codePreview',
    },
    {
        icon: <IconModalStroked />,
        name: '浏览器',
        key: 'network',
    },
];

const defaultCodes = [
    {
        name: 'Component.js',
        key: 'code1',
        language: 'javascript',
        content: `import React from 'react';
import { AutoComplete } from '@fibrae/semi-ui-react';
import { IconSearch } from '@fibrae/semi-icons-react';

() => {
    const [stringData, setStringData] = useState([]);
    const [value, setValue] = useState('');
    const handleStringSearch = (value) => {
        let result;
        if (value) {
            result = ['gmail.com', '163.com', 'qq.com'].map(domain => value+domain);
        } else {
            result = [];
        }
        setStringData(result);
    };

    const handleChange = (value) => {
        console.log('onChange', value);
        setValue(value);
    };
    return (
        <AutoComplete
            data={stringData}
            value={value}
            showClear
            prefix={<IconSearch />}
            placeholder="搜索... "
            onSearch={handleStringSearch}
            onChange={handleChange}
            style={{ width: 200 }}
        />
    );
};
`,
    },
    {
        name: 'Style.css',
        key: 'code2',
        language: 'css',
        content: `.semi-animation-react-demo-auto {
    button {
        height: 50px;
        border: 0;
        cursor: pointer !important;
        background: #777;
        color: white;
        outline: none;
        -webkit-appearance: none;
    }

    button:hover {
        background: #878787;
    }

    .auto-main {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: auto 1fr;
        background: #575757;
    }

    .content {
        grid-column: span 3;
    }

    .item {
        background: indianred;
        width: 100%;
        overflow: hidden;
        color: white;
    }

    .item p {
        margin: 0;
        padding: 10px;
    }
}
`,
    },
    {
        name: 'Chart.json',
        key: 'code3',
        isJson: true,
        language: 'html',
        content: `{
    "axisX": {
        "title": {
            "visible": false,
            "position": "center"
        },
        "label": {
            "visible": true,
            "style": {
                "fontSize": 12,
                "fontWeight": 400,
                "lineHeight": 16,
                "fontFamily": [
                    "Inter"
                ],
                "fill": "rgba(0, 0, 0, 0.47843137254901963)"
            },
            "space": 12
        },
        "domainLine": {
            "visible": true,
            "style": {
                "lineWidth": 1,
                "stroke": "rgba(0, 0, 0, 0.12156862745098039)",
                "lineDash": []
            }
        },
        "tick": {
            "visible": false,
            "style": {
                "lineWidth": 1,
                "stroke": "rgba(255, 255, 255, 0)"
            }
        },
        "subTick": {
            "visible": false
        },
        "grid": {
            "visible": false
        },
        "subGrid": {
            "visible": false
        }
    }
}`,
    },
];

const defaultFiles = [
    {
        key: 'file1',
        name: 'Semi Design 介绍',
        content: `
<h2>
  Semi Design 介绍
</h2>
<p>
  Semi Design 是由 <strong>抖音前端团队</strong>和MED产品设计团队设计、开发并维护的<em>设计系统</em>。作为一个全面、易用、优质的现代应用UI解决方案，Semi Design从字节跳动各业务线的复杂场景中提炼而来，目前已经支撑了近千个平台产品，服务了内外部超过10万用户，详情见https://semi.design/zh-CN/start/introduction。Semi Design的特点包括：
</p>
<ul>
  <li>
    设计简洁、现代化。
  </li>
  <li>
    提供主题方案，可深度样式定制。
  </li>
</ul>
<p>
  国际化，覆盖了简/繁体中文、英语、日语、韩语、葡萄牙语等20+种语言，日期时间组件提供全球时区支持，全部组件可自动适配阿拉伯文RTL布局。
</p>
<pre><code class="language-css">body {
  display: none;
}</code></pre>
<p>
  采用 Foundation 和 Adapter 跨框架技术方案，方便扩展。
</p>
<blockquote>
  Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统
  <br />
  — Semi Design
</blockquote>
<p>
  Semi Design 是由 <strong>抖音前端团队</strong>和MED产品设计团队设计、开发并维护的<em>设计系统</em>。作为一个全面、易用、优质的现代应用UI解决方案，Semi Design从字节跳动各业务线的复杂场景中提炼而来，目前已经支撑了近千个平台产品，服务了内外部超过10万用户，详情见https://semi.design/zh-CN/start/introduction。Semi Design的特点包括：
</p>
<ul>
  <li>
    设计简洁、现代化。
  </li>
  <li>
    提供主题方案，可深度样式定制。
  </li>
</ul>
<p>
  国际化，覆盖了简/繁体中文、英语、日语、韩语、葡萄牙语等20+种语言，日期时间组件提供全球时区支持，全部组件可自动适配阿拉伯文RTL布局。
</p>
<pre><code class="language-css">body {
  display: none;
}</code></pre>
<p>
  采用 Foundation 和 Adapter 跨框架技术方案，方便扩展。
</p>
<blockquote>
  Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统
  <br />
  — Semi Design
</blockquote>
<p>
  Semi Design 是由 <strong>抖音前端团队</strong>和MED产品设计团队设计、开发并维护的<em>设计系统</em>。作为一个全面、易用、优质的现代应用UI解决方案，Semi Design从字节跳动各业务线的复杂场景中提炼而来，目前已经支撑了近千个平台产品，服务了内外部超过10万用户，详情见https://semi.design/zh-CN/start/introduction。Semi Design的特点包括：
</p>
<ul>
  <li>
    设计简洁、现代化。
  </li>
  <li>
    提供主题方案，可深度样式定制。
  </li>
</ul>
<p>
  国际化，覆盖了简/繁体中文、英语、日语、韩语、葡萄牙语等20+种语言，日期时间组件提供全球时区支持，全部组件可自动适配阿拉伯文RTL布局。
</p>
<pre><code class="language-css">body {
  display: none;
}</code></pre>
<p>
  采用 Foundation 和 Adapter 跨框架技术方案，方便扩展。
</p>
<blockquote>
  Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统
  <br />
  — Semi Design
</blockquote>
`,
    },
    {
        key: 'file2',
        name: 'Semi Design DSM',
        content: `<h2>
  Semi Design DSM
</h2>
<p>Semi DSM is a design system management tool provided by Semi Design. It supports global and component-level style customization and keeps synchronization between Figma and front-end code. Suitable for teams of all sizes. Whether you need to simplify workflow, improve team collaboration, or increase productivity, we have features suitable for you.</p>
`,
    },
    {
        key: 'file3',
        name: 'React v19 Adaptation',
        content: `<h2>
  React v19 Adaptation
</h2>
<p>Since the release of React v19, React has introduced numerous underlying mechanism and API changes, including upgrades and adjustments to the render mechanism, ref, context, TypeScript types, and related deprecated APIs. To ensure that the Semi Design component library is smoothly compatible with both React v19 and lower versions, we provide the original component package @fibrae/semi-ui-react for React versions below v19, as well as a new package @fibrae/semi-ui-19 specifically adapted for React v19, so users can choose as needed. This guide will help you understand how to install, use, and the precautions to take.
Installation & Usage
If your project is using React v19, please use @fibrae/semi-ui-19. For React versions below v19, continue using @fibrae/semi-ui-react as before.</p>
`,
    },
];

const defaultInfoList: ComponentProps<typeof AnnotationContent>['info'] = [
    {
        header: 'Semi design introduction',
        key: '1',
        annotations: [
            {
                order: 1,
                type: 'video',
                duration: 4432,
                title: 'Semi Design is a design system designed',
                url: 'https://semi.design/',
                logo: '/assets/placeholder/avatar-a.svg',
                siteName: 'Semi Design',
                detail: ' As a comprehensive, easy-to-use, and high-quality modern enterprise-level application UI solution',
                img: '/assets/root-web-sites/abstract.jpg',
            },
            {
                order: 2,
                title: 'Quick start',
                type: 'video',
                duration: 56,
                url: 'https://semi.design/',
                detail: ' As a comprehensive, easy-to-use, and high-quality modern enterprise-level application UI solution',
                logo: '/assets/placeholder/avatar-a.svg',
                siteName: 'Semi Design',
                img: '/assets/root-web-sites/abstract.jpg',
            },
            {
                order: 3,
                title: 'Use components in a modular way',
                url: 'https://semi.design/',
                detail: `Semi provides esm format dist, and the css of the component is only imported by the corresponding js.
When used in Webpack, Rspack, create-react-app or Vite projects, there is no need to configure any compilation items.`,
                logo: '/assets/placeholder/avatar-a.svg',
                siteName: 'Semi Design',
                img: '/assets/root-web-sites/abstract.jpg',
            },
        ],
    },
    {
        header: 'Design resource',
        key: '2',
        annotations: [
            {
                order: 2,
                title: 'Semi Design resource',
                url: 'https://semi.design/',
                detail: 'Semi Design provides a wealth of design resources to help designers and developers collaborate efficiently. Whether you are a community user or a ByteDance internal designer, you can find UI Kit resource and Figma plug-ins that suit you here.',
                logo: '/assets/placeholder/avatar-a.svg',
                siteName: 'Semi Design resource',
                img: '/assets/root-web-sites/abstract.jpg',
            },
        ],
    },
];

const imgUploadProps: ImageUploadNodeOptions = {
    action: 'https://api.semi.design/upload',
    getUploadImageSrc: () => {
        // response is the action's result; real code reads the uploaded image URL from it
        return '/assets/placeholder/avatar-a.svg';
    },
};

export default function SidebarDemo() {
    const [mode, setMode] = useState('main');
    const [activeKey, setActiveKey] = useState('codePreview');
    const [activeCodeKey, setActiveCodeKey] = useState<string | string[]>('code1');
    const [activeFileKey, setActiveFileKey] = useState<string | string[]>('file1');
    const [activeReferKey, setActiveReferKey] = useState<string | string[]>('1');
    const [currentDetail, setCurrentDetail] = useState<CodeItemProps | FileItemProps>();

    const onExpand = useCallback((_e: MouseEvent, content: CodeItemProps | FileItemProps, mode: string) => {
        setMode(mode);
        setCurrentDetail(content);
    }, []);

    const onActiveCodeKeyChange = useCallback((codeKey: string | string[]) => {
        setActiveCodeKey(codeKey);
    }, []);

    const onActiveFileKeyChange = useCallback((fileKey: string | string[]) => {
        setActiveFileKey(fileKey);
    }, []);

    const onActiveReferKeyChange = useCallback((referKey: string | string[]) => {
        setActiveReferKey(referKey);
    }, []);

    const renderMainContent = useCallback(
        (activeKey: string) => {
            switch (activeKey) {
                case 'searchResult':
                    return <AnnotationContent activeKey={activeReferKey} info={defaultInfoList} onChange={onActiveReferKeyChange} />;
                case 'filePreview':
                    return <FileContent activeKey={activeFileKey} files={defaultFiles} onExpand={onExpand} onChange={onActiveFileKeyChange} />;
                case 'codePreview':
                    return <CodeContent activeKey={activeCodeKey} codes={defaultCodes} onExpand={onExpand} onChange={onActiveCodeKeyChange} />;
                case 'network':
                    return <img alt="network" src="/assets/root-web-sites/test.jpg" style={{ width: '100%' }} />;
                default:
                    return;
            }
        },
        [activeCodeKey, activeFileKey, activeReferKey, onExpand, onActiveCodeKeyChange, onActiveFileKeyChange, onActiveReferKeyChange]
    );

    const onActiveOptionChange = useCallback((_e: MouseEvent, key: string) => {
        setActiveKey(key);
    }, []);

    const onBackWard = useCallback((_e: MouseEvent, mode: string) => {
        setMode(mode);
    }, []);

    return (
        <div style={containerStyle}>
            <div style={{ flexGrow: 1, flexShrink: 1, padding: 20 }}>工作区占位</div>
            <Sidebar
                showClose={false}
                visible
                motion={false}
                title="Agent 的工作空间"
                mode={mode}
                defaultSize={{ width: '60%' }}
                onActiveOptionChange={onActiveOptionChange}
                activeKey={activeKey}
                options={optionList}
                onBackWard={onBackWard}
                renderMainContent={renderMainContent}
                detailContent={currentDetail}
                imgUploadProps={imgUploadProps}
            />
        </div>
    );
}
