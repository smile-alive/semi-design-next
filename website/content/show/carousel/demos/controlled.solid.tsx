import { createSignal, For, type JSX } from 'solid-js';
import { Carousel, Space, Typography } from '@fibrae/semi-ui-solid';

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
        lines: ['高效的 Design2Code 设计稿转代码', '海量 Figma 设计模板一键转为真实前端代码'],
    },
];

const titleStyle: JSX.CSSProperties = { position: 'absolute', top: '100px', left: '100px' };
const colorStyle: JSX.CSSProperties = { color: '#1C1F23' };

export default function CarouselDemo() {
    const [activeIndex, setActiveIndex] = createSignal(0);

    return (
        <div>
            <Carousel style={{ width: '100%', height: '400px' }} activeIndex={activeIndex()} autoPlay={false} theme="dark" onChange={(index) => setActiveIndex(index)}>
                <For each={slides}>
                    {(slide) => (
                        <div style={{ 'background-size': 'cover', 'background-image': `url('${slide.src}')` }}>
                            <Space vertical align="start" spacing="medium" style={titleStyle}>
                                <img src={logo} alt="semi_logo" style={{ width: '87px', height: '31px' }} />
                                <Typography.Title heading={2} style={colorStyle}>
                                    {slide.title}
                                </Typography.Title>
                                <Space vertical align="start">
                                    <Typography.Paragraph style={colorStyle}>{slide.lines[0]}</Typography.Paragraph>
                                    <Typography.Paragraph style={colorStyle}>{slide.lines[1]}</Typography.Paragraph>
                                </Space>
                            </Space>
                        </div>
                    )}
                </For>
            </Carousel>
        </div>
    );
}
