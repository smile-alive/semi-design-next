/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import { selectSpec, type SelectSpecProps } from '@test/specs/select';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { render } from '@test/utils/vue';
import Select, { SelectOptGroup, SelectOption } from '..';

const mount: SpecMount<SelectSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { options, value, bottomButton, ...props } = state;
            const groups = [...new Set(options.map((option) => option.group))];
            return (
                <>
                    <Select aria-label="Fruit" modelValue={value} motion={false} {...props}>
                        {{
                            default: () =>
                                groups.map((group) => {
                                    const items = options.filter((option) => option.group === group).map((option) => <SelectOption key={option.value} disabled={option.disabled} label={option.label} value={option.value} />);
                                    return group ? <SelectOptGroup label={group}>{() => items}</SelectOptGroup> : items;
                                }),
                            innerBottomSlot: bottomButton ? () => <button type="button">slot button</button> : undefined,
                        }}
                    </Select>
                    <button type="button">after</button>
                </>
            );
        })
    );
    return {
        container: view.container as HTMLElement,
        update: async (next) => {
            Object.assign(state, next);
            await nextTick();
        },
        unmount: () => view.unmount(),
    };
};

selectSpec(mount);
