import { describe, expect, it } from 'vite-plus/test';
import { isAlertType, pickFreshAnnouncements, readNoticeText } from '../announcer';

describe('isAlertType', () => {
    it('warning 与 error 是 alert', () => {
        expect(isAlertType('warning')).toBe(true);
        expect(isAlertType('error')).toBe(true);
        expect(isAlertType('info')).toBe(false);
        expect(isAlertType(undefined)).toBe(false);
    });
});

describe('pickFreshAnnouncements', () => {
    it('取新增项与原地更新项，排除已显示项和 alert', () => {
        const items = [{ id: 'shown', type: 'info' }, { id: 'updated', type: 'success' }, { id: 'new' }, { id: 'new-warning', type: 'warning' }, { id: 'updated-error', type: 'error' }];
        const shownIds = new Set(['shown', 'updated', 'updated-error']);
        const fresh = pickFreshAnnouncements(items, shownIds, [{ id: 'updated' }, { id: 'updated-error' }]);
        expect(fresh.map((item) => item.id)).toEqual(['updated', 'new']);
    });
});

describe('readNoticeText', () => {
    it('拼接标题与内容，跳过空节点和其余文本', () => {
        const notice = document.createElement('div');
        notice.innerHTML = '<span>icon</span><div class="semi-notification-notice-title">标题</div><div class="semi-notification-notice-content"></div><button>关闭</button>';
        expect(readNoticeText(notice, 'semi-notification-notice')).toBe('标题');
        notice.querySelector('.semi-notification-notice-content').textContent = '内容';
        expect(readNoticeText(notice, 'semi-notification-notice')).toBe('标题 内容');
        expect(readNoticeText(null, 'semi-notification-notice')).toBe('');
    });
});
