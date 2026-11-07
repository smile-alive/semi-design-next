import { describe, expect, it, vi } from 'vite-plus/test';
import ReleaseHolder from '../release-holder';

describe('ReleaseHolder', () => {
    it('重复持有时先释放上一次，且只持有最新的一份', () => {
        const releases = [vi.fn<() => void>(), vi.fn<() => void>()];
        const holder = new ReleaseHolder();
        holder.hold(() => releases[0]);
        holder.hold(() => releases[1]);
        expect(releases[0]).toHaveBeenCalledTimes(1);
        expect(releases[1]).not.toHaveBeenCalled();
        holder.release();
        expect(releases[1]).toHaveBeenCalledTimes(1);
    });

    it('新的获取发生在上一次释放之后', () => {
        const order: string[] = [];
        const holder = new ReleaseHolder();
        holder.hold(() => () => order.push('release first'));
        holder.hold(() => {
            order.push('acquire second');
            return () => {};
        });
        expect(order).toEqual(['release first', 'acquire second']);
    });

    it('释放是幂等的，未持有时释放无效果', () => {
        const release = vi.fn<() => void>();
        const holder = new ReleaseHolder();
        holder.release();
        holder.hold(() => release);
        holder.release();
        holder.release();
        expect(release).toHaveBeenCalledTimes(1);
    });
});
