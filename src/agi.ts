import { debug as debuger } from 'debug';
import { createServer, Socket } from 'net';

import { compose } from './compose';
import { Context } from './context';
import { Callback,ChanelStatus, IResponse, IVariables,   phoneKeys } from './interfaces';

export { IResponse, IVariables, ChanelStatus, Callback, phoneKeys, Context };

const debug = debuger('app');

export type Middleware<T> = (context: T, next: () => Promise<any>) => any;
export type ComposedMiddleware<T> = (context: T, next?: () => Promise<any>) => Promise<void>;

export class Agi {
  private middlewares: Array<Middleware<Context>> = [];
  private silent: boolean = false;

  public use(fn: Middleware<Context>): this {
    if (typeof fn !== 'function') {
      throw new TypeError('middleware must be a function!');
    }
    debug('use %s', fn.name || '-');
    this.middlewares.push(fn);
    return this;
  }
  public listen(...args: any) {
    debug('listen', ...args);
    const server = createServer(this.callback());
    return server.listen(...args);
  }

  private callback() {
    const functions: ComposedMiddleware<Context> = compose(this.middlewares);
    const handle = (socket: Socket) => {
      const ctx = new Context(socket);
      this.handle(ctx, functions);
    };
    return handle;
  }
  private handle(ctx: Context, fnMiddelware: ComposedMiddleware<Context>): void {
    ctx
      .onVariables()
      .then(async () => await fnMiddelware(ctx))
      .then(async () => await ctx.end())
      .catch(async err => {
        this.onError(err);
        await ctx.end();
      });
  }
  private onError(err: Error) {
    if (this.silent) {
      return;
    }
    const msg = err.stack || err.toString();
    global.console.error();
    global.console.error(msg.replace(/^/gm, '  '));
    global.console.error();
  }
}
