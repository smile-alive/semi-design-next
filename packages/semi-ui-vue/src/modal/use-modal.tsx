/** @jsxImportSource vue */

import { type Component, shallowRef } from 'vue';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import { createHolder } from '../_base/holder';
import { withConfirm, withError, withInfo, withSuccess, withWarning } from './confirm';
import ConfirmModal from './confirm-modal.vue';
import type { ConfirmProps, ModalConfirmProps, ModalHookApi, ModalHookRef } from './interface';

/**
 * Confirms rendered by the returned Holder, so they inherit the provides, ConfigProvider and locale where it is placed.
 * destroy and update before the Holder mounts change the list it will render, so nothing waits for a mounted handle.
 */
export default function useModal(): [ModalHookApi, Component] {
    const list = shallowRef<Array<{ id: string; config: ConfirmProps }>>([]);
    const mounted = new Set<string>();

    const remove = (id: string) => {
        mounted.delete(id);
        list.value = list.value.filter((entry) => entry.id !== id);
    };

    const Holder = createHolder('ModalHolder', () =>
        list.value.map(({ id, config: { afterClose, ...rest } }) => {
            return (
                <ConfirmModal
                    key={id}
                    {...rest}
                    onVnodeMounted={() => mounted.add(id)}
                    onAfterClose={() => {
                        afterClose?.();
                        remove(id);
                    }}
                />
            );
        })
    );

    const patch = (id: string, change: ModalConfirmProps) => {
        list.value = list.value.map((entry) => (entry.id === id ? { id, config: { ...entry.config, ...change } } : entry));
    };

    const destroy = (id: string) => {
        const entry = list.value.find((item) => item.id === id);
        if (entry && !mounted.has(id)) {
            // never rendered, so no dialog will report its close; report it here
            remove(id);
            entry.config.afterClose?.();
        } else {
            patch(id, { visible: false });
        }
    };

    const open =
        (withType: (config: ModalConfirmProps) => ConfirmProps) =>
        (config: ModalConfirmProps): ModalHookRef => {
            const id = createId('modal');
            list.value = [...list.value, { id, config: withType(config) }];
            return {
                destroy: () => destroy(id),
                update: (change) => patch(id, change),
            };
        };

    return [
        {
            info: open(withInfo),
            success: open(withSuccess),
            error: open(withError),
            warning: open(withWarning),
            confirm: open(withConfirm),
        },
        Holder,
    ];
}
