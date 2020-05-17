const identity = x => x

export function parseNumber(s) {

    if (s.includes('/')) {

        let [a, b] = s.split('/')

        return parseFloat(a) / parseFloat(b)

    }

    return parseFloat(s)

}

/**
 * Examples:
 * 'inout,5' 'in,2' 'out,4'
 */
export function resolveEase(ease) {

	if (typeof ease === 'string') {

		let [fn, ...params] = ease.split(',')

		params = params.map(parseNumber)

		if (/gain|inout/.test(fn))
			return gainBind(...params)

		if (fn === 'in') {

			let pow = params[0] || 2

			return x => x ** pow

		}

		if (fn === 'out') {

			let pow = params[0] || 2

			return x => 1 - (1 - x) ** pow

		}

	}

	if (typeof ease === 'function')
		return ease

	return identity

}

export function resolveRelativeValue(value, currentValue) {

	if (typeof value === 'number')
		return value

	if (typeof value === 'string') {

		if (value.substring(0, 2) === '+=')
			return currentValue + parseFloat(value.substring(2))

		if (value.substring(0, 2) === '-=')
			return currentValue - parseFloat(value.substring(2))

		if (value.substring(0, 2) === '*=')
			return currentValue * parseFloat(value.substring(2))

		if (value.substring(0, 2) === '/=')
			return currentValue / parseFloat(value.substring(2))

	}

	return NaN

}

function resolveType(value) {

	const type = typeof value

	if (type === 'number')
		return 'number'

	if (type === 'string') {

		if (/^[\+\-\*\/]=/.test(value))
			return 'number'

		if (/^#?[\da-f]{6}$/i.test(value))
			return 'hexColor'
	}

	throw new Error(`oups type is not supported ${type}:${value && value.constructor.name}`)
}

function interpolateRRGGBB(color1, color2, x, { prependHash = true} = {}) {

	if (color1[0] === '#')
		color1 = color1.substring(1)

	if (color2[0] === '#')
		color2 = color2.substring(1)

	const r1 = parseInt(color1.substring(0, 2), 16) || 0
	const g1 = parseInt(color1.substring(2, 4), 16) || 0
	const b1 = parseInt(color1.substring(4, 6), 16) || 0

	const r2 = parseInt(color2.substring(0, 2), 16) || 0
	const g2 = parseInt(color2.substring(2, 4), 16) || 0
	const b2 = parseInt(color2.substring(4, 6), 16) || 0

	const x2 = 1 - x
	const r = Math.round(r1 * x2 + r2 * x)
	const g = Math.round(g1 * x2 + g2 * x)
	const b = Math.round(b1 * x2 + b2 * x)

	return ((prependHash ? '#' : '')
		+ r.toString(16).padStart(2, '0')
		+ g.toString(16).padStart(2, '0')
		+ b.toString(16).padStart(2, '0'))
}

export function resolveBundleEntry(target, key, from, to, ease, override) {

    let type = null

    if (to !== undefined && from === undefined) {

		type = resolveType(to)
        from = target[key]

		if (type === 'number')
        	to = resolveRelativeValue(to, from)

    } else if (to === undefined && from !== undefined) {

		type = resolveType(from)
        to = target[key]

		if (type === 'number')
        	from = resolveRelativeValue(from, to)

    } else {

		type = resolveType(from)
	}

	console.log(from, to)

    let fx = override ||
		type === 'number' ? (x => from + (to - from) * ease(x)) :
		type === 'hexColor' ? (x => interpolateRRGGBB(from, to, ease(x))) :
		() => {}

    return [target, key, fx]

}


/**
 * returns [target, key, fx] or an array of [target, key, fx], eg:
 * => [{}, 'x', 100, 200]
 * => [[{}, 'x', 100, 200], [{}, 'rotation', 0, 90]]
 */
export function resolveBundle(target, key, from, to, ease, override) {

    let bundle, keys = key.includes(',') && key.split(',').map(s => s.trim())

    if (!keys) {

        bundle = resolveBundleEntry(target, key, from, to, ease, override)

    } else {

        bundle = keys.map((key, index) => {

            let fromValue = Array.isArray(from) ? from[index] : from
            let toValue = Array.isArray(to) ? to[index] : to

            return resolveBundleEntry(target, key, fromValue, toValue, ease, override)

        })

    }

    return { isMultiple: !!keys, bundle }

}









/**
 * https://jsfiddle.net/jniac/1qpum68z/
 * @param x the value
 * @param p the power
 * @param m the middle of the ease
 */
export function gain(x, p = 3, i = .5, clamp = true) {

	if (clamp)
		x = x < 0 ? 0 : x > 1 ? 1 : x

	return x === i
		? x
		: x < i
		? 1 / Math.pow(i, p - 1) * Math.pow(x, p)
		: 1 - 1 / Math.pow(1 - i, p - 1) * Math.pow(1 - x, p)

}

/**
 * binded version of gain(), usage:
 * f = Mth.gainBind(3, 1/3)
 * y = f(x)
 */
export function gainBind(p = 3, i = .5, clamp = true) {

	return x => {

		if (clamp)
			x = x < 0 ? 0 : x > 1 ? 1 : x

		return x === i
			? x
			: x < i
			? 1 / Math.pow(i, p - 1) * Math.pow(x, p)
			: 1 - 1 / Math.pow(1 - i, p - 1) * Math.pow(1 - x, p)

	}

}
