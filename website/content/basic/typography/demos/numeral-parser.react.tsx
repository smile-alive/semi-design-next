import { Typography } from '@fibrae/semi-ui-react';

export default function TypographyDemo() {
    const { Numeral } = Typography;

    const parserTCH = (oldVal: string) => {
        return oldVal
            .split(' ')
            .map((item) => (Number(item) ? `${item.replace(/(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1,')}+` : item))
            .join(' ');
    };

    const infos = [
        { type: 'Stars', min: '7100' },
        { type: 'Fork', min: '560' },
        { type: 'Downloads', min: '5000000' },
        { type: 'Contributors', min: '100' },
    ].map((item) => (
        <p key={item.min}>
            {item.type}：<b style={{ color: 'var(--semi-violet-5)' }}>{item.min}</b>
        </p>
    ));

    return (
        <div>
            <Numeral parser={parserTCH} component="div">
                Semi Design 重视我们的用户，加入并助力我们不断完善
                {infos}
            </Numeral>
            <br />
            <Numeral link={{ href: 'https://semi.design', target: '_blank' }} parser={parserTCH}>
                现已服务 {1e5} 用户，前往官网 &gt;&gt;
            </Numeral>
        </div>
    );
}
