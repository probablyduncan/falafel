export interface StampProps {
    top?: number | string;
    left?: number | string;
    rotate?: number | string;
}

export function getStampStyle(props?: StampProps, additionalStyle?: string): string {
    return `--yi: ${props?.top ?? 0}%; --xi: ${props?.left ?? 0}%; --ri: ${props?.rotate ?? "0"}deg; ${additionalStyle ?? ""}`.trim();
}

export function getStampComponents() {
    const stampModules = import.meta.glob("../components/stamps/*.astro", { eager: true });
    const stamps = Object.values(stampModules).map((mod: any) => mod.default);
    return stamps;
}