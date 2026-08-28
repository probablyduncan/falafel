const MAP_EVENTS = {
    ON_CLICK_MAP_FALAFEL: "on-click-map-falafel",
    ON_FOCUS_MAP_FALAFEL: "on-focus-map-falafel",
} as const;

export function focusMapFalafel(id: string) {
    window.dispatchEvent(
        new CustomEvent(MAP_EVENTS.ON_FOCUS_MAP_FALAFEL, {
            detail: id,
        }),
    );
}

export function addMapFalafelFocusListener(callback: (id: string) => void) {
    window.addEventListener(
        MAP_EVENTS.ON_FOCUS_MAP_FALAFEL,
        (e: CustomEventInit<string>) => callback(e.detail ?? ""),
    );
}

export function onClickMapFalafel(id: string) {
    window.dispatchEvent(
        new CustomEvent(MAP_EVENTS.ON_CLICK_MAP_FALAFEL, {
            detail: id,
        }),
    );
}

export function addMapFalafelClickListener(callback: (id: string) => void) {
    window.addEventListener(
        MAP_EVENTS.ON_CLICK_MAP_FALAFEL,
        (e: CustomEventInit<string>) => callback(e.detail ?? ""),
    );
}