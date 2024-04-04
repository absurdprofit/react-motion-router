import { iOS, isPWA } from "./utils";

export const STATIC_ANIMATION = {
  in: () => new Animation(new KeyframeEffect(null, [], { duration: iOS() && !isPWA() ? 0 : 350 })),
  out: () => new Animation(new KeyframeEffect(null, [], { duration: iOS() && !isPWA() ? 0 : 350 }))
};