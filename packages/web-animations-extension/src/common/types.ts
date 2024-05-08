enum EasingFunctionKeywordEnum {
	"ease",
	"ease-in",
	"ease-in-out",
	"ease-out",
	"linear"
}

export type EasingFunctionKeyword = keyof typeof EasingFunctionKeywordEnum;
export type EasingFunction = EasingFunctionKeyword | `cubic-bezier(${number},${' ' | ''}${number},${' ' | ''}${number},${' ' | ''}${number})`;

export type NativeAnimation = globalThis.Animation;
export const NativeAnimation = window.Animation;