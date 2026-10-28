import { Typography } from '@fibrae/semi-ui-solid';

export default function TypographyDemo() {
    const { Numeral } = Typography;
    return (
        <div>
            <Numeral precision={1} component="p">
                点赞量：1.6111e1 K
            </Numeral>

            <p>
                播放量:
                <Numeral rule="numbers" precision={1}>
                    2.4444e2
                </Numeral>
                K
            </p>

            <Numeral rule="percentages" precision={2} component="p" style={{ 'margin-bottom': '12px' }}>
                好评率: 0.915
            </Numeral>

            <Numeral rule="percentages" style={{ 'margin-bottom': '12px' }}>
                这场比赛我的胜率是0.6，输的概率是0.4
            </Numeral>

            <Numeral rule="bytes-decimal" precision={2} truncate="floor" component="p">
                已使用: 1000
            </Numeral>
            <Numeral rule="bytes-decimal" precision={2} truncate="floor" component="p">
                未使用: {1024 * 1000}
            </Numeral>

            <Numeral rule="bytes-binary" precision={2} truncate="floor" component="p">
                已使用: 1024
            </Numeral>
            <Numeral rule="bytes-binary" precision={2} truncate="floor" component="p">
                未使用: {2e12}
            </Numeral>
        </div>
    );
}
