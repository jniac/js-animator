export default class Stack {

    constructor() {

        this.array = []
        this.frame = 0

    }

    update() {

        let { array, frame } = this

        let tmp = this.array
    	this.array = []
    	this.array = tmp.filter(({ callback, thisArg, args, skip }) => {

    		if (frame % (1 + skip))
    			return true

    		return callback.apply(thisArg, args) !== false

    	}).concat(this.array)

        frame++

        Object.assign(this, { frame })

    }

    add(callback, { thisArg = null, args = null, skip = 0 } = {}) {

    	if (!callback)
    		return

    	let listener = {

    		callback,
    		thisArg,
            args,
    		skip,

    	}

    	this.array.push(listener)

    	return listener

    }

}
