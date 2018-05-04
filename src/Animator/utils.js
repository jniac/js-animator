const identity = x => x

export function parseNumber(s) {

    if (s.includes('/')) {

        let [a, b] = s.split('/')

        return parseFloat(a) / parseFloat(b)

    }

    return parseFloat(s)

}

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

export function resolveValue(value, currentValue) {

	if (typeof value === 'number')
		return value

	if (typeof value === 'string') {

		if (value.slice(0, 2) === '+=')
			return currentValue + parseFloat(value.slice(2))

		if (value.slice(0, 2) === '-=')
			return currentValue - parseFloat(value.slice(2))

		if (value.slice(0, 2) === '*=')
			return currentValue * parseFloat(value.slice(2))

		if (value.slice(0, 2) === '/=')
			return currentValue / parseFloat(value.slice(2))

	}

	return NaN

}

export function resolveBundleEntry(target, key, from, to, ease, override) {

    if (to !== undefined && from === undefined) {

        from = target[key]
        to = resolveValue(to, from)

    }

    if (to === undefined && from !== undefined) {

        to = target[key]
        from = resolveValue(from, to)

    }

    let fx = override || (x => from + (to - from) * ease(x))

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
