import { ConfigFactoryProps, matchRoute } from "@react-motion-router/core";

export default function Animation({current, next}: ConfigFactoryProps) {
    if (matchRoute(current.path, "/slides") && matchRoute(next.path, "/")) {
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