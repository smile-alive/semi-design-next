import { createSignal, For, type JSX } from 'solid-js';
import { Carousel, Radio, RadioGroup, Space, Typography, type CarouselProps } from '@fibrae/semi-ui-solid';

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
    const [arrowType, setArrowType] = createSignal<CarouselProps['arrowType']>('always');
    const [show, setShow] = createSignal(true);

    return (
        <div>
            <Carousel style={{ width: '100%', height: '400px' }} showArrow={show()} arrowType={arrowType()} theme="dark" autoPlay={false}>
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
            <br />
            <Space vertical align="start">
                <Space>
                    <div>展示箭头</div>
                    <RadioGroup onChange={(e) => setShow(e.target.value)} value={show()} type="button">
                        <Radio value>show</Radio>
                        <Radio value={false}>hide</Radio>
                    </RadioGroup>
                </Space>
                <Space>
                    <div>展示时机</div>
                    <RadioGroup onChange={(e) => setArrowType(e.target.value)} value={arrowType()} type="button">
                        <Radio value="always">always</Radio>
                        <Radio value="hover">hover</Radio>
                    </RadioGroup>
                </Space>
            </Space>
        </div>
    );
}
