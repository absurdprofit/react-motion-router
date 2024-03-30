import { AnimationConfig } from "@react-motion-router/core";
import { iOS, isPWA } from "./utils";

export const STATIC_ANIMATION: AnimationConfig = {
  in: new Animation(new KeyframeEffect(null, [], { duration: iOS() && !isPWA() ? 0 : 350 })),
  out: new Animation(new KeyframeEffect(null, [], { duration: iOS() && !isPWA() ? 0 : 350 }))
};