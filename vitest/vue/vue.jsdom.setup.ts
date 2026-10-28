// Vue skips listeners attached no earlier than the event's Date.now() stamp (`e._vts <= invoker.attached`); under the
// frozen Date only the first listener would run, so stamp one millisecond later.
Object.defineProperty(Event.prototype, '_vts', {
    configurable: true,
    get: () => undefined,
    set(this: Event, stamp: number) {
        Object.defineProperty(this, '_vts', { value: stamp + 1, writable: true, configurable: true });
    },
});
