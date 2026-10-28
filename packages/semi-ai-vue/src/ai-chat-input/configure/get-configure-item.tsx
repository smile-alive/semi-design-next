/** @jsxImportSource vue */
// JSX, not a template: the wrapped component and its value and listener keys are runtime values.
import { type Component, type DefineComponent, defineComponent, onBeforeUnmount, onMounted } from 'vue';
import { useConfigureContext } from './context';
import type { ConfigureItemOpts, ConfigureItemProps, PropsOf } from './interface';

type ItemEmits = { change: [value: unknown] };

/**
 * Turns a component into a Configure item: the item declares only `field` and `initValue`, binds the field's value to
 * `valueKey` and listens on `onKeyChangeFnName`; every other prop, listener and slot is passed on to the component.
 */
export default function getConfigureItem<C extends Component, VK extends keyof PropsOf<C> = 'modelValue' & keyof PropsOf<C>, CK extends keyof PropsOf<C> = 'onUpdate:modelValue' & keyof PropsOf<C>>(component: C, opts: ConfigureItemOpts<PropsOf<C>, VK, CK> = {}) {
    const { valueKey = 'modelValue', onKeyChangeFnName = 'onUpdate:modelValue', className, defaultProps } = opts as ConfigureItemOpts<Record<string, unknown>, string, string>;
    const Wrapped = component as DefineComponent;
    return defineComponent<ConfigureItemProps<PropsOf<C>, VK, CK>, ItemEmits>(
        (props, { attrs, emit, slots }) => {
            const context = useConfigureContext();

            // registers once: initValue only seeds the field at mount, and unmount removes it
            let registered = props.field;

            const onItemChange = (value: unknown) => {
                context?.onChange({ [props.field]: value });
                emit('change', value);
            };

            onMounted(() => {
                registered = props.field;
                if (props.initValue !== undefined) {
                    context?.onChange({ [registered]: props.initValue }, true);
                }
            });

            onBeforeUnmount(() => context?.onRemove(registered));

            return () => {
                const bindings = {
                    ...defaultProps,
                    ...attrs,
                    class: [className, attrs.class],
                    [valueKey]: context?.view.value[props.field],
                    [onKeyChangeFnName]: onItemChange,
                };
                return <Wrapped {...bindings}>{slots}</Wrapped>;
            };
        },
        { name: 'ConfigureItem', props: ['field', 'initValue'], inheritAttrs: false, emits: ['change'] }
    );
}
