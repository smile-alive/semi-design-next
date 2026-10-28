import { useState, useCallback, type ComponentProps, type CSSProperties, type MouseEvent } from 'react';
import { Annotation, type AnnotationItem } from '@fibrae/semi-ai-react';
import { Button } from '@fibrae/semi-ui-react';

const containerStyle: CSSProperties = {
    display: 'flex',
    height: '500px',
    border: '1px solid var(--semi-color-border)',
    borderRadius: 8,
    overflow: 'hidden',
    boxSizing: 'border-box',
};

const defaultInfoList: ComponentProps<typeof Annotation>['info'] = [
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

export default function SidebarDemo() {
    const [visible, setVisible] = useState(true);
    const [activeKey, setActiveKey] = useState<string | string[]>('1');

    const toggleVisible = useCallback(() => {
        setVisible((visible) => !visible);
    }, []);

    const onChange = useCallback((key: string | string[]) => {
        console.log('onChange', key);
        setActiveKey(key);
    }, []);

    const onClick = useCallback((e: MouseEvent, item: AnnotationItem) => {
        console.log('onClick', e, item);
    }, []);

    return (
        <div style={containerStyle}>
            <div style={{ flexGrow: 1, flexShrink: 1, padding: 20 }}>
                <Button aria-pressed={visible} onClick={toggleVisible}>
                    参考来源
                </Button>
            </div>
            <Annotation defaultSize={{ width: 420 }} visible={visible} onCancel={toggleVisible} activeKey={activeKey} info={defaultInfoList} onChange={onChange} onClick={onClick} />
        </div>
    );
}
