import { renderToString } from 'react-dom/server';
import { expect, it } from 'vite-plus/test';
import DatePicker from '..';

it('设置 timeZone 时字符串值按该时区的钟点显示，与运行环境的时区无关', () => {
    const html = renderToString(<DatePicker type="dateTime" value="2024-05-06 10:00:00" timeZone="America/New_York" />);
    expect(html).toContain('value="2024-05-06 10:00:00"');
});
