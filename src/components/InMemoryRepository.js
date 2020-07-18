export class InMemoryRepository {

    static builder() {
        return new Builder()
    }


    constructor() {
        this.subscribers = [];
        this.storage = {};
    }

    getLatest() {
        return this.storage[this.name] || (this.nullObjectSupplier
            ? this.nullObjectSupplier()
            : this.nullObject);
    }

    save(data) {
        this.storage[this.name] = data;
        this.subscribers.forEach(subscriber => subscriber(data))
    }

    subscribeOnChange(consumer) {
        if (this.subscribers.indexOf(consumer) === -1) {
            this.subscribers.push(consumer)
        }
    }
}

class Builder {
    name(name) {
        this._name = name;
        return this
    }

    nullObject(nullObject) {
        this._nullObject = nullObject;
        return this
    }

    nullObjectSupplier(nullObjectSupplier) {
        this._nullObjectSupplier = nullObjectSupplier;
        return this
    }

    subscribers(subscribers) {
        this._subscribers = subscribers;
        return this
    }

    build() {
        const repo = new InMemoryRepository();
        repo.name = this._name;
        repo.nullObject = this._nullObject;
        repo.nullObjectSupplier = this._nullObjectSupplier;
        repo.subscribers.concat(this._subscribers);
        return repo
    }
}
