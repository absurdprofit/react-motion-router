import { PlainObject } from "@react-motion-router/core";

export function searchParamsToObject(searchPart: string) {
	const entries = new URLSearchParams(decodeURI(searchPart)).entries();
	const result: PlainObject<string> = {};

	for (const [key, value] of entries) { // each 'entry' is a [key, value] tuple
		let parsedValue = '';
		try {
			parsedValue = JSON.parse(value);
		} catch (e) {
			console.warn("Non JSON serialisable value was passed as URL route param.");
			parsedValue = value;
		}
		result[key] = parsedValue;
	}
	return Object.keys(result).length ? result : undefined;
}

export function searchParamsFromObject(params: { [key: string]: any }) {
	try {
		return new URLSearchParams(params).toString();
	} catch (e) {
		console.error(e);
		console.warn("Non JSON serialisable value was passed as route param.");
	}
	return '';
}

export function isRollback(info?: unknown) {
	if (info && typeof info === 'object' && 'rollback' in info)
		return Boolean(info.rollback);
	return false;
}

export function nextAnimationFrame() {
	return new Promise<DOMHighResTimeStamp>(resolve => {
		return requestAnimationFrame(resolve);
	});
}