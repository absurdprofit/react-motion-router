export function searchParamsToObject(searchParams: URLSearchParams) {
	return Object.fromEntries(searchParams.entries());
}

export function searchParamsFromObject(params: { [key: string]: any }) {
	return new URLSearchParams(params).toString();
}

export function isGesture(info?: unknown) {
	if (info && typeof info === 'object' && 'gesture' in info)
		return Boolean(info.gesture);
	return false;
}

export function isRollback(info?: unknown) {
	if (info && typeof info === 'object' && 'rollback' in info)
		return Boolean(info.rollback);
	return false;
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