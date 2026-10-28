import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import semiGlobal, { type OverrideDefaultProps } from '../../_utils/semi-global';
import useDefaultProps from '../use-default-props';

interface ProbeProps {
    size?: string | null;
    onClick?: () => void;
    defaultChecked?: boolean;
}

// No component is registered yet; the probe stands in for one
declare module '../../_utils/semi-global' {
    interface OverrideDefaultProps {
        Probe?: Omit<ProbeProps, 'onClick'>;
    }
}

describe('useDefaultProps', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    const mergedOf = (props: ProbeProps) => {
        let merged: ProbeProps = {};
        render(() => {
            merged = useDefaultProps('Probe', props, { size: 'default', onClick: undefined });
            return null;
        });
        return merged;
    };

    it('填充 undefined 的属性，保留显式传入的值（包括 null）', () => {
        expect(mergedOf({}).size).toBe('default');
        expect(mergedOf({ size: undefined }).size).toBe('default');
        expect(mergedOf({ size: 'small' }).size).toBe('small');
        expect(mergedOf({ size: null }).size).toBe(null);
    });

    it('优先使用全局覆盖值，包括组件没有默认值的键', () => {
        semiGlobal.config.overrideDefaultProps = { Probe: { size: 'large', defaultChecked: true } };
        const merged = mergedOf({});
        expect(merged.size).toBe('large');
        expect(merged.defaultChecked).toBe(true);
        expect(mergedOf({ size: 'small' }).size).toBe('small');
    });

    it('全局值为 undefined 时回退组件默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Probe: { size: undefined } };
        expect(mergedOf({}).size).toBe('default');
    });

    it('默认值里的键都出现在合并结果中', () => {
        expect('onClick' in mergedOf({})).toBe(true);
    });

    it('忽略全局默认值里的 DOM 节点并告警，其余键照常填充', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        // the cast stands for a JSX prop, whose type admits nodes
        semiGlobal.config.overrideDefaultProps = { Probe: { size: 'large', defaultChecked: [document.createElement('i')] } } as unknown as OverrideDefaultProps;
        const merged = mergedOf({});
        expect(merged.size).toBe('large');
        expect(merged.defaultChecked).toBeUndefined();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("[Semi Probe] The global default 'defaultChecked' is a DOM node"));
    });

    it('忽略全局默认值里的 id 类属性，其余键照常填充', () => {
        // the cast stands for an untyped app that sets per-instance ids anyway
        semiGlobal.config.overrideDefaultProps = { Probe: { size: 'large', id: 'g', insetLabelId: 'g', wrapperId: 'g', addonId: 'g', extraId: 'g' } } as OverrideDefaultProps;
        const merged = mergedOf({});
        expect(merged.size).toBe('large');
        for (const key of ['id', 'insetLabelId', 'wrapperId', 'addonId', 'extraId']) {
            expect(merged).not.toHaveProperty(key);
        }
    });

    it('合并结果随传入属性变化，变回 undefined 时回到默认值', () => {
        const [size, setSize] = createSignal<string | undefined>('small');
        const merged = mergedOf({
            get size() {
                return size();
            },
        });
        expect(merged.size).toBe('small');
        setSize('large');
        expect(merged.size).toBe('large');
        setSize(undefined);
        expect(merged.size).toBe('default');
    });
});
