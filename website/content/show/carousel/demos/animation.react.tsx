import type { CSSProperties } from 'react';
import { Carousel, Space, Typography } from '@fibrae/semi-ui-react';

const logo = '/assets/placeholder/logo.svg';
const slides = [
    {
        src: '/assets/carousel/bg-1.png',
        title: 'Semi 设计管理系统',
        lines: ['从 Semi Design，到 Any Design', '快速定制你的设计系统，并应用在设计稿和代码中'],
    },
    {
        src: '/assets/carousel/bg-2.png',
        title: 'Semi 物料市场',
        lines: ['面向业务场景的定制化组件，支持线上预览和调试', '内容由 Semi Design 用户共建'],
    },
    {
        src: '/assets/carousel/bg-3.png',
        title: 'Semi 设计/代码模板',
        lines: ['一套组件，四个框架原生可用', '在 React、Vue、Solid、Svelte 中共用同一套设计'],
    },
];

const titleStyle: CSSProperties = { position: 'absolute', top: '100px', left: '100px' };
const colorStyle: CSSProperties = { color: '#1C1F23' };

export default function CarouselDemo() {
    return (
        <div>
            <Carousel style={{ width: '100%', height: '400px' }} speed={1000} animation="fade" theme="dark" autoPlay={false}>
                {slides.map((slide) => (
                    <div key={slide.src} style={{ height: '100%', backgroundSize: 'cover', backgroundImage: `url('${slide.src}')` }}>
                        <Space vertical align="start" spacing="medium" style={titleStyle}>
                            <img src={logo} alt="semi_logo" style={{ width: 87, height: 31 }} />
                            <Typography.Title heading={2} style={colorStyle}>
                                {slide.title}
                            </Typography.Title>
                            <Space vertical align="start">
                                <Typography.Paragraph style={colorStyle}>{slide.lines[0]}</Typography.Paragraph>
                                <Typography.Paragraph style={colorStyle}>{slide.lines[1]}</Typography.Paragraph>
                            </Space>
                        </Space>
                    </div>
                ))}
            </Carousel>
        </div>
    );
}
