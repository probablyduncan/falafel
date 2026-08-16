import path from "path";

export interface StampProps {
    top?: number | string;
    left?: number | string;
    rotate?: number | string;
}

export function getStampStyle(props?: StampProps, additionalStyle?: string): string {
    return `--yi: ${props?.top ?? 0}; --xi: ${props?.left ?? 0}; --r: ${props?.rotate ?? "0"}deg; ${additionalStyle ?? ""}`.trim();
}

export function getStampComponents(): {
    component: any;
    name: string;
}[] {
    const stampModules = import.meta.glob("../components/stamps/*.astro", { eager: true });
    const stamps = Object.values(stampModules).map((mod: any) => ({
        component: mod.default,
        name: path.parse(mod.file).name,
    }));
    return stamps;
}