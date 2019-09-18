export type Middleware<T> = (context: T, next: () => Promise<any>) => any;
export type ComposedMiddleware<T> = (context: T, next?: () => Promise<any>) => Promise<void>;

export function compose<T>(middlewares: Array<Middleware<T>>): ComposedMiddleware<T> {
  if (!Array.isArray(middlewares)) {
    throw new TypeError('Middleware stack must be an array!');
  }
  for (const fn of middlewares) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be composed of functions!');
    }
  }
  return (context: T, next?: Middleware<T>): Promise<void> => {
    let index = -1;
    function dispatch(i: number): Promise<any> {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;
      let fn: Middleware<T> | undefined = middlewares[i];
      if (i === middlewares.length) {
        fn = next;
      }
      if (!fn) {
        return Promise.resolve();
      }
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return dispatch(0);
  };
}
