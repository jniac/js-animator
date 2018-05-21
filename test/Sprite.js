class Transform {

    constructor() {

        Object.assign(this, {

            x: 0,
            y:0,
            scale: 1,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,

        })

    }

    toStyle() {

        let { x, y, scale, scaleX, scaleY, rotation } = this

        return `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale * scaleX}, ${scale * scaleY})`

    }

}

export const newSprite = (element, target = {}) => new Proxy(Object.assign(target, {

    transform: new Transform(),
    element,

}), {

    get(target, key) {

        if (key === 'toString')
            return target.toString

        return key in target.transform ? target.transform[key] :
            key in target.element ? target.element[key] :
            target[key]

    },

    set(target, key, value) {

        if (key in target.transform) {

            target.transform[key] = value
            target.element.style.transform = target.transform.toStyle()

        } else if (key in target.element) {

            target.element[key] = value

        } else {

            target[key] = value

        }

        return true

    },

})

export default class Sprite {

    static get(element) {

        if (typeof element === 'string')
            element = document.querySelector(element)

        if (!element)
            return null

        return Sprite.map.get(element) || new Sprite(element)

    }

    constructor(element) {

        this.uid = Sprite.uid++

        let proxy = newSprite(element, this)

        Sprite.map.set(element, proxy)

        return proxy

    }

    toString() {

        let classList = [...this.element.classList].map(c => '.' + c).join('')

        return `Sprite#${this.uid}[${this.element.tagName.toLowerCase()}${classList}]`

    }

    get backgroundColor() { return this.element.style.backgroundColor }
    set backgroundColor(value) { this.element.style.backgroundColor = value }



}

Object.assign(Sprite, {

    uid: 0,
    map: new WeakMap(),

})
