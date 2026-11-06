import { Typography } from '@fibrae/semi-ui-solid';

export default function TypographyDemo() {
    return (
        <div>
            <Typography.Numeral precision={1} component="p">
                点赞量：1.6111e1 K
            </Typography.Numeral>

            <p>
                播放量:
                <Typography.Numeral rule="numbers" precision={1}>
                    2.4444e2
                </Typography.Numeral>
                K
            </p>

            <Typography.Numeral rule="percentages" precision={2} component="p" style={{ 'margin-block-end': '12px' }}>
                好评率: 0.915
            </Typography.Numeral>

            <Typography.Numeral rule="percentages" style={{ 'margin-block-end': '12px' }}>
                这场比赛我的胜率是0.6，输的概率是0.4
            </Typography.Numeral>

            <Typography.Numeral rule="bytes-decimal" precision={2} truncate="floor" component="p">
                已使用: 1000
            </Typography.Numeral>
            <Typography.Numeral rule="bytes-decimal" precision={2} truncate="floor" component="p">
                未使用: {1024 * 1000}
            </Typography.Numeral>

            <Typography.Numeral rule="bytes-binary" precision={2} truncate="floor" component="p">
                已使用: 1024
            </Typography.Numeral>
            <Typography.Numeral rule="bytes-binary" precision={2} truncate="floor" component="p">
                未使用: {2e12}
            </Typography.Numeral>
        </div>
    );
}
