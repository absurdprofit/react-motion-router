import { AnimationConfig, AnimationKeyframeEffectConfig } from "@react-motion-router/core";
import { iOS, isPWA } from "./utils";

export const STATIC_ANIMATION: AnimationKeyframeEffectConfig | AnimationConfig = {
  keyframes: [],
  options: {
    duration: iOS() && !isPWA() ? 0 : 350
  }
};