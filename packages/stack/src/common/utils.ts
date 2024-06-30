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
		console.warn("Non JSON serialisable value was passed as query param.");
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

export function deepEquals<T>(obj1: T, obj2: T): boolean {
	if (obj1 === obj2) {
		return true;
	}

	if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
		return false;
	}

	const keys1 = Object.keys(obj1) as (keyof T)[];
	const keys2 = Object.keys(obj2) as (keyof T)[];

	if (keys1.length !== keys2.length) {
		return false;
	}

	for (let key of keys1) {
		if (!keys2.includes(key) || !deepEquals(obj1[key], obj2[key])) {
			return false;
		}
	}

	return true;
}