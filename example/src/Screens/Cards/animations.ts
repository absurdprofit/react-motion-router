import { ConfigFactoryProps, matchRoute } from "@react-motion-router/core";
import { STATIC_ANIMATION } from "../../common/constants";

export default function Animation({current, next}: ConfigFactoryProps) {
  if (
    matchRoute(next.path, '/details')
    || matchRoute(current.path, '/details')
  ) {
    return STATIC_ANIMATION;
  }
  return {
    type: "slide",
    direction: "right",
    duration: 350,
  } as const;
}