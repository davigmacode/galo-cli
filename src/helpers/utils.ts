export {
	isEmpty, isArray, isString, isInteger, mapValues,
	get, set, has, findKey, pick, omit, shuffle,
	isNil, isNumber, isFinite, isUndefined, isObject,
	meanBy, ceil, merge, assign, sampleSize
} from "lodash";

export const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);

Object.defineProperty(String.prototype, 'capitalize', {
  value() {
    return capitalize(this);
  },
  enumerable: false
});

export const flattenObject = (object, separator = '.') => {

	const isValidObject = value => {
		if (!value) return false;

		const isArray  = Array.isArray(value)
		const isObject = Object.prototype.toString.call(value) === '[object Object]'
		const hasKeys  = !!Object.keys(value).length

		return !isArray && isObject && hasKeys
	}

	const walker = (child, path = []) => {
		return Object.assign({}, ...Object.keys(child).map(key => isValidObject(child[key])
			? walker(child[key], path.concat([key]))
			: { [path.concat([key]).join(separator)] : child[key] })
		)
	}

	return Object.assign({}, walker(object));
}