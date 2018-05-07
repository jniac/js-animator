
export default class KeyMap {

    constructor() {

        this.map = new Map()

    }

    get size() { return this.map.size }

    has(target, key) {

        let dict = this.map.get(target)

        return !!(dict && key in dict)

    }

    set(target, key, object) {

        let dict = this.map.get(target)

        if (dict) {

            dict[key] = object

        } else {

            this.map.set(target, { [key]: object })

        }

    }

    assign(target, key, props) {

        let object = this.get(target, key, { create: true })

        Object.assign(object, props)

    }

    get(target, key, { create = false } = {}) {

        let dict = this.map.get(target)

        if (!dict && !create)
            return undefined

        if (!dict) {

            dict = {}
            this.map.set(target, dict)

        }

        let value = dict[key]

        if (!value && !create)
            return undefined

        if (!value) {

            value = {}
            dict[key] = value

        }

        return value

    }

    delete (target, key) {

        let dict = this.map.get(target)

        if (dict) {

            delete dict[key]

            if (Object.keys(dict).length === 0)
                this.map.delete(target)

        }

    }

    *[Symbol.iterator]() {

        for (let [target, dict] of this.map) {

            for (let key in dict)
                yield [target, key, dict[key]]

        }

    }

    entries(target = null, key = null) {

        let entries = []

    	for (let [currentTarget, dict] of this.map) {

    		if (!target || target === currentTarget) {

                for (let currentKey in dict) {

    				if (!key || key === currentKey)
                        entries.push([currentTarget, currentKey, dict[currentKey]])

    			}

    		}

    	}

    	return entries

    }

    values(target = null, key = null) {

        let values = []

        for (let [currentTarget, dict] of this.map) {

            if (!target || target === currentTarget) {

                for (let currentKey in dict) {

                    if (!key || key === currentKey)
                        values.push(dict[currentKey])

                }

            }

        }

        return values

    }

}
