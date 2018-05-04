function numberToString(n, toFixed = 1) {

	if (n % 1)
		return n.toFixed(toFixed)

	return n.toString()

}

function ots_ifstring(object, options) {

	let { stringPattern = '"' } = options

	return typeof object === 'string'

		? stringPattern + object + stringPattern

		: ots(object, options)

}

function functionSignature(fn) {

	let str = fn.toString()
	let start = str.indexOf('(') +1
	let current = start
	let count = 1
	let len = str.length

	while(++current < len) {

		let char = str.charAt(current)

		if (char === '(')
			count++

		if (char === ')')
			count--

		if (count === 0)
			return str.slice(start, current)

    }

	return ''

}

export default function ots(object, options = {}) {

	let { depth = 2, dispKey = true, arrayMax = 100, toFixed, printFunction = false, joinPattern = ', ' } = options

	options = { depth: depth - 1, dispKey, arrayMax, toFixed, printFunction, joinPattern }

	if (object === undefined)
		return 'undefined'

	if (object === null)
		return 'null'

	let type = typeof object

	if (type === 'string')
		return object

	if (type === 'boolean' ||
		type === 'symbol')
		return object.toString()

	if (type === 'function')
		return printFunction
			? object.toString()
			: `${object.name || 'f'}(${functionSignature(object)})`

	if (type === 'number')
		return numberToString(object, toFixed)

	if (object instanceof Error)
		return `${object.constructor.name}: ${object.message}`

	if (Array.isArray(object)) {

		if (depth)
			return object.length < arrayMax
				? `[${object.map(v => ots_ifstring(v, options)).join(joinPattern)}]`
				: `[${object.slice(0, arrayMax).map(v => ots_ifstring(v, options)).join(joinPattern)}, ... (+${object.length - arrayMax})]`

		return `[(${object.length})]`

	}

	let prefix = object.constructor.name

	prefix = prefix === 'Object' ? '' : prefix + ' '

	let keys = Object.keys(object)

	let body = !depth
		? (keys.length ? (dispKey ? keys.join(joinPattern) : `... (${keys.length})`) : '')
		: keys.map(key => key + ': ' + ots_ifstring(object[key], options)).join(joinPattern)

	return prefix + (body ? `{ ${body} }` : '{}')

}
