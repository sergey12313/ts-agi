import { debug as debuger } from 'debug';
import { createServer, Server, Socket} from 'net';

import { Duplex } from 'stream';
import { compose } from './compose';
import { Context } from './context';

const debug = debuger('app');

type Middleware<T> = (context: T, next: () => Promise<any>) => any;
type ComposedMiddleware<T> = (context: T, next?: () => Promise<any>) => Promise<void>;
type ContextType = Context<Socket>

export class Agi  {
  private middlewares: Array<Middleware<ContextType>> = [];
  private silent: boolean = false;

  public use(fn: Middleware<ContextType>): this {
    if (typeof fn !== 'function'){
      throw new TypeError('middleware must be a function!');
    } 
    debug('use %s',  fn.name || '-');
    this.middlewares.push(fn);
    return this;
  }
  public listen(...args: any) {
    debug("listen", ...args);
    const server = createServer(this.callback());
    return server.listen(...args);
  }

  
  private callback() {
    const functions: ComposedMiddleware<ContextType> = compose(this.middlewares);
    const handle = (socket: Socket) => {
      const ctx: ContextType = new Context(socket);
      this.handle(ctx, functions);
    };
    return handle;
  }
  private handle(ctx: ContextType, fnMiddelware: ComposedMiddleware<ContextType>): void {
    ctx
      .onVariables()
      .then(async () => await fnMiddelware(ctx))
      .then(async () => await ctx.end())
      .catch(async (err)=>{
        this.onError(err)
        await ctx.end();
      });
  }
  private onError(err: Error){
    if (this.silent) {
      return;
    }
    const msg = err.stack || err.toString();
    global.console.error();
    global.console.error(msg.replace(/^/gm, '  '));
    global.console.error();
  }
}
