export function cssNumberishToNumber(value: CSSNumberish, unit: string) {
	if (value instanceof CSSNumericValue)
			return value.to(unit).value;
	return value;
}