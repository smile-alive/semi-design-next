import { Typography } from '@fibrae/semi-ui-react';

export default function TypographyDemo() {
    return (
        <div>
            <Typography.Numeral precision={1} component="div">
                <p>点赞量：1.6111e1 K</p>
            </Typography.Numeral>

            <p>
                播放量:
                <Typography.Numeral rule="numbers" precision={1}>
                    2.4444e2
                </Typography.Numeral>
                K
            </p>

            <Typography.Numeral rule="percentages" precision={2} component="div" style={{ marginBlockEnd: 12 }}>
                <p>好评率: 0.915</p>
            </Typography.Numeral>

            <Typography.Numeral rule="percentages" style={{ marginBlockEnd: 12 }}>
                这场比赛我的胜率是0.6，输的概率是0.4
            </Typography.Numeral>

            <Typography.Numeral rule="bytes-decimal" precision={2} truncate="floor" component="div">
                <p>已使用: 1000</p>
                <p>未使用: {1024 * 1000}</p>
            </Typography.Numeral>

            <Typography.Numeral rule="bytes-binary" precision={2} truncate="floor" component="div">
                <p>已使用: 1024</p>
                <p>未使用: {2e12}</p>
            </Typography.Numeral>
        </div>
    );
}
