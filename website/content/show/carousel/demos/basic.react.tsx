import type { CSSProperties } from 'react';
import { Carousel, Typography, Space } from '@fibrae/semi-ui-react';

export default function CarouselDemo() {
    const { Title, Paragraph } = Typography;

    const style = {
        width: '100%',
        height: '400px',
    };

    const titleStyle: CSSProperties = {
        position: 'absolute',
        top: '100px',
        left: '100px',
        color: '#1C1F23',
    };

    const colorStyle = {
        color: '#1C1F23',
    };

    const renderLogo = () => {
        return <img src="/assets/placeholder/logo.svg" alt="semi_logo" style={{ width: 87, height: 31 }} />;
    };

    const imgList = ['/assets/carousel/bg-1.png', '/assets/carousel/bg-2.png', '/assets/carousel/bg-3.png'];

    const textList = [
        ['Semi 设计管理系统', '从 Semi Design，到 Any Design', '快速定制你的设计系统，并应用在设计稿和代码中'],
        ['Semi 物料市场', '面向业务场景的定制化组件，支持线上预览和调试', '内容由 Semi Design 用户共建'],
        ['Semi Template', '高效的 Design2Code 设计稿转代码', '海量 Figma 设计模板一键转为真实前端代码'],
    ];

    return (
        <Carousel style={style} theme="dark">
            {imgList.map((src, index) => {
                return (
                    <div key={index} style={{ backgroundSize: 'cover', backgroundImage: `url('${src}')` }}>
                        <Space vertical align="start" spacing="medium" style={titleStyle}>
                            {renderLogo()}
                            <Title heading={2} style={colorStyle}>
                                {textList[index][0]}
                            </Title>
                            <Space vertical align="start">
                                <Paragraph style={colorStyle}>{textList[index][1]}</Paragraph>
                                <Paragraph style={colorStyle}>{textList[index][2]}</Paragraph>
                            </Space>
                        </Space>
                    </div>
                );
            })}
        </Carousel>
    );
}
