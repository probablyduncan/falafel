import type { HTMLAttributes } from "astro/types";
import path from "path";

export interface StampProps {
    y?: number | string;
    x?: number | string;
    r?: number | string;
}

export function getStampStyle(props?: StampProps, additionalStyle?: string): string {
    return `--yi: ${props?.y ?? 0}; --xi: ${props?.x ?? 0}; --r: ${props?.r ?? "0"}deg; ${additionalStyle ?? ""}`.trim();
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

export function getStandardImgAttributes(): HTMLAttributes<"img"> {
    return {
        draggable: false,
        fetchpriority: "low",
    }
}