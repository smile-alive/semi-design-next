/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive, type VNode } from 'vue';
import { checkboxSpec, type CheckboxGroupSpecProps, type CheckboxSpecProps } from '@test/specs/checkbox';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { render } from '@test/utils/vue';
import Checkbox from '..';

function createMount<P extends object>(Fixture: (props: P) => VNode): SpecMount<P> {
    return (initial) => {
        const state = shallowReactive({ ...initial });
        const view = render(defineComponent(() => () => Fixture(state as P)));
        return {
            container: view.container as HTMLElement,
            update: async (next) => {
                Object.assign(state, next);
                await nextTick();
            },
            unmount: () => view.unmount(),
        };
    };
}

const fixture = ({ checked, label, extra, tabIndex, ...props }: CheckboxSpecProps) => (
    <Checkbox {...props} modelValue={checked} tabindex={tabIndex}>
        {{
            default: label === undefined ? undefined : () => label,
            extra: extra === undefined ? undefined : () => extra,
        }}
    </Checkbox>
);

const groupFixture = ({ options, asChildren, value, ...props }: CheckboxGroupSpecProps) => (
    <Checkbox.Group {...props} modelValue={value} options={asChildren ? undefined : options}>
        {asChildren
            ? () =>
                  options.map((option) => {
                      const { value: itemValue, label, disabled } = typeof option === 'string' ? { value: option, label: option, disabled: undefined } : option;
                      return (
                          <Checkbox key={String(itemValue)} value={itemValue} disabled={disabled}>
                              {() => label}
                          </Checkbox>
                      );
                  })
            : undefined}
    </Checkbox.Group>
);

checkboxSpec(createMount(fixture), createMount(groupFixture));
