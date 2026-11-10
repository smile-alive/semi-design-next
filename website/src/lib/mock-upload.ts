interface MockUploadArgs {
    fileInstance: File;
    onProgress: (e: { total: number; loaded: number }) => unknown;
    onSuccess: (response: unknown) => unknown;
}

// Stands in for an upload endpoint so demos never hit the network
export function mockUpload({ fileInstance, onProgress, onSuccess }: MockUploadArgs) {
    let loaded = 0;
    const timer = setInterval(() => {
        loaded += 25;
        onProgress({ total: 100, loaded });
        if (loaded < 100) {
            return;
        }
        clearInterval(timer);
        onSuccess({ status_code: 200, message: 'success', url: URL.createObjectURL(fileInstance) });
    }, 200);
}
