import { matchRoute } from "@react-motion-router/core";

export default function Animation(currentPath: string, nextPath: string) {
    if (matchRoute(currentPath, "/slides") && matchRoute(nextPath, "/")) {
        return {
            type: "slide",
            direction: "right",
            duration: 350,
        } as const;
    }
    return {
        type: "fade",
        duration: 350
    } as const;
}