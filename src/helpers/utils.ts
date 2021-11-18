import debug from "debug";

export {
	isEmpty, isArray, isString, isInteger, mapValues,
	get, set, has, findKey, pick, omit, sampleSize,
	isNil, isNumber, isFinite, merge, isUndefined
} from "lodash";

const log = debug("utils");

export const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);

Object.defineProperty(String.prototype, 'capitalize', {
  value() {
    return capitalize(this);
  },
  enumerable: false
});

export const shuffle = (array: any[], round: number = 1) : any[] => {
  log(`shuffle #${round}`);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return round > 1 ? shuffle(array, round-1) : array;
}

export const flattenObject = (object, separator = '.') => {

	const isValidObject = value => {
		if (!value) {
			return false
		}

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