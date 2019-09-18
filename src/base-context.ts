import { debug as debuger } from 'debug';
import { EventEmitter } from 'events';
import { Duplex } from 'stream';
import { Callback, IResponse, IVariables } from './interfaces';

const debug = debuger('context');

export enum State {
  init,
  waiting,
}
const send = (data: string) => `---> ${data}`;
const received = (data: string) => `<--- ${data}`;
const error = (data: string) => `!!!!! ${data}`;

export class BaseContext <C extends Duplex> extends EventEmitter{
  public readonly variables: IVariables = {};
  protected state: State = State.init;
  protected buffer: string = '';
  protected pending: null | Callback = null;

  constructor(protected stream: C ) {
    super();
    this.stream.on('data', data => {
      this.read(data.toString());
    });
    this.stream.on('error', (...arg) => this.emit('error', ...arg));
    this.stream.on('close', (...arg) => this.emit('close', ...arg));
  }
  public on(event: 'error', listener: (err: Error) => void): this;
  public on(event: 'response', listener: (variables: IResponse) => void): this;
  public on(event: 'variables', listener: (variables: IVariables) => void): this;
  public on(event:  'hangup' | 'close' | 'response', listener: () => void): this;

  public on(event: any, listener: (...args: any[]) => void): this {
    debug(`emitted: ${event}`)
    return super.on(event, listener);
  }

  public sendCommand(command: string): Promise<IResponse> {
    debug(send(command));
    return new Promise((resolve, reject) => {
      this.send(`${command}\n`, (err, result) => {
        if (err) {
          debug(error(err.message));
          reject(err);
        } else {
          debug(received(JSON.stringify(result)));
          resolve(result);
        }
      });
    });
  }
  public onVariables(): Promise<IVariables> {
    return new Promise(resolve => {
      this.on('variables', data => {
        resolve(data);
      });
    });
  }
  public end(): Promise<void> {
    return new Promise(resolve => {
      this.stream.end(() => {
        resolve();
      });
    });
  }
  protected send(msg: string, callback: Callback): void {
    this.pending = callback;
    this.stream.write(msg);
  }

  private read(data: string) {
    this.buffer += data;
    switch (this.state) {
      case State.init:
        if (!this.buffer.includes('\n\n')) {
          return;
        } else {
          this.readVariables(this.buffer);
        }
      case State.waiting:
        if (!this.buffer.includes('\n')) {
          return;
        } else {
          this.readResponse(this.buffer);
        }
    }
    this.buffer = '';
  }

  private readVariables(data: string) {
    debug(received(data));
    const dataArr = data.split('\n').slice(0, -2);
    dataArr.forEach(el => {
      const [name, value = ''] = el.split(':');
      this.variables[name.slice(4)] = value.trim();
    });
    this.emit('variables', this.variables);
    this.state = State.waiting;
  }

  private readResponse(data: string): void {
    const lines = data.split('\n');
    lines.forEach(line => {
      this.readResponseLine(line);
    });
  }

  private readResponseLine(line: string): void {
    if (line === '') {
      return;
    }
    const parsed = /^(\d{3})(?: result=)([^(]*)(?:\((.*)\))?/.exec(line);
    if (parsed === null) {
      this.emit('hangup');
      return;
    }
    const [, code, result, value] = parsed;
    const response: IResponse = {
      code: parseInt(code, 10),
      result: result.trim(),
    };
    if (value) {
      response.value = value;
    }
    if (this.pending !== null) {
      const pending = this.pending;
      this.pending = null;
      pending(null, response);
    }
    this.emit('response', response);
  }
}
