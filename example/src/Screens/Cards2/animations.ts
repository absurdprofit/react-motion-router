import { matchRoute } from "@react-motion-router/core";
import { STATIC_ANIMATION } from "example/src/common/constants";

export default function Animation(currentPath: string, nextPath: string) {
  if (
    matchRoute(nextPath, '/details')
    || matchRoute(currentPath, '/details')
  ) {
    return STATIC_ANIMATION;
  }
  return {
    type: "slide",
    direction: "right",
    duration: 350,
  } as const;
}