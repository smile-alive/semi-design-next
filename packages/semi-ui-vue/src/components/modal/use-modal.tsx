/** @jsxImportSource vue */

import { type Component, shallowRef } from 'vue';
import ConfirmInstance from '@fibrae/semi-foundation/components/modal/confirm-instance';
import { createId } from '@fibrae/semi-foundation/utils';
import { createHolder } from '../../base/index';
import { withConfirm, withError, withInfo, withSuccess, withWarning } from './confirm';
import ConfirmModal from './confirm-modal.vue';
import type { ConfirmProps, ModalConfirmProps, ModalHookApi, ModalHookRef } from './interface';

/**
 * Confirms rendered by the returned Holder, so they inherit the provides, ConfigProvider and locale where it is placed.
 * destroy and update before the Holder mounts change the list it will render, so nothing waits for a mounted handle.
 */
export default function useModal(): [ModalHookApi, Component] {
    const list = shallowRef<Array<{ id: string; props: ConfirmProps; instance: ConfirmInstance<ConfirmProps> }>>([]);

    const Holder = createHolder('ModalHolder', () => list.value.map(({ id, props: { afterClose, ...rest }, instance }) => <ConfirmModal key={id} {...rest} onVnodeMounted={instance.handleMount} onAfterClose={afterClose} />));

    const open =
        (withType: (config: ModalConfirmProps) => ConfirmProps) =>
        (config: ModalConfirmProps): ModalHookRef => {
            const id = createId('modal');
            const instance = new ConfirmInstance(withType(config), {
                render: (props) => {
                    list.value = list.value.map((entry) => (entry.id === id ? { ...entry, props } : entry));
                },
                remove: () => {
                    list.value = list.value.filter((entry) => entry.id !== id);
                },
            });
            list.value = [...list.value, { id, props: instance.props, instance }];
            return instance.handle;
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
