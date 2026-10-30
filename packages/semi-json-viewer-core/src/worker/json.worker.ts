import type { FormattingOptions } from 'jsonc-parser';
import type { IModelContentChangeEvent } from '../common/emitter-events';
import { JsonWorker } from './json-worker';

let jsonWorker: JsonWorker | null = null;

interface WorkerRequest {
    method: string;
    messageId: number | string;
    params: { value: string; op: IModelContentChangeEvent | IModelContentChangeEvent[]; options: FormattingOptions };
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
    const { method, params, messageId } = e.data;

    let result;
    // Errors are posted back too, or the main-thread promise never settles.
    try {
        if (method === 'init') {
            jsonWorker = new JsonWorker(params.value);
            self.postMessage({ messageId, result: 'Worker initialized' });
            return;
        }

        if (!jsonWorker) {
            self.postMessage({ messageId, error: 'Worker not initialized' });
            return;
        }

        switch (method) {
            case 'updateModel':
                jsonWorker.updateModel(params.op);
                break;
            case 'undo':
                jsonWorker.undo();
                break;
            case 'redo':
                jsonWorker.redo();
                break;
            case 'format':
                result = jsonWorker.format(params.options);
                break;
            case 'foldRange':
                result = jsonWorker.foldRange();
                break;
            case 'validate':
                result = jsonWorker.validate();
                break;
            default:
                self.postMessage({ messageId, error: `Unknown method ${method}` });
                return;
        }
    } catch (error) {
        self.postMessage({ messageId, error: error instanceof Error ? error.message : String(error) });
        return;
    }

    self.postMessage({ messageId, result });
};
