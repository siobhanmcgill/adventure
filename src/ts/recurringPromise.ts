type ReturnType<T> = T|PromiseLike<T>|undefined|void;
type CallbackFn<T> = (value: T) => ReturnType<T>;

Promise.resolve(true).then();

interface RecurringPromise<T> {
  then: (callback: CallbackFn<T>, waitForNextSend: boolean) => Promise<unknown>;
  thenAlways: (callback: CallbackFn<T>, waitForNextSend: boolean) => {
    nevermind: () => void
  };
}

export class RecurringPromiseSource<T> {
  private value?: T;

  private counter = 0;

  private subscribers = new Map<string, CallbackFn<T>>();
  private thenners: Array<CallbackFn<T>> = [];

  constructor(seed?: T) {
    this.value = seed;
  }

  toRecurringPromise(): RecurringPromise<T> {
    return {
      then: (callback: CallbackFn<T>, waitForNextSend = false) =>
          this.then(callback, waitForNextSend),
      thenAlways: (callback: CallbackFn<T>, waitForNextSend = false) => {
        const id = this.thenAlways(callback, waitForNextSend);
        return {
          nevermind: () => {
            this.forget(id);
          }
        }
      }
    };
  }

  getValue() {
    return this.value;
  }

  send(newValue: T) {
    this.value = newValue;
    for (const [id, callback] of this.subscribers) {
      callback(this.value);
    }
    for (const resolve of this.thenners) {
      resolve(this.value);
    }
    this.thenners.length = 0;
  }

  thenAlways(callback: CallbackFn<T>, waitForNextSend = false) {
    const id = this.getId();
    this.subscribers.set(id, callback);
    if (this.value && !waitForNextSend) {
      callback(this.value);
    }
    return id;
  }

  forget(id: string) {
    this.subscribers.delete(id);
  }

  async then(callback: CallbackFn<T>, waitForNextSend = false):
      Promise<unknown> {
    return callback(await new Promise<T>(resolve => {
      if (!waitForNextSend && this.value) {
        callback(this.value);
      } else {
        this.thenners.push(callback);
      }
    }));
  }

  private getId() {
    this.counter++;
    return this.counter + '_' + Date.now();
  }
}

export function whenAll(...of: RecurringPromise<unknown>[]) {
  const internalPromise = new RecurringPromiseSource();
}