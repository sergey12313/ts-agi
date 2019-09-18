import MemoryStream from 'memorystream';
import {  Socket, Server } from 'net';
import { Duplex } from 'stream';
import { Agi } from '../agi';
import { State as state } from '../base-context';
import { Context } from '../context';
import { Callback, IResponse } from '../interfaces';

function writeVars<T extends Duplex>(stream: T) {
  stream.write('agi_network: yes\n');
  stream.write('agi_uniqueid: 13507138.14\n');
  stream.write('agi_arg_1: test\n');
  stream.write('\n\n');
}

class TestContext extends Context<MemoryStream> {
  public sent: string[] = [];
  public pending: Callback | null = null;
  public send(msg: string, callback: Callback) {
    this.pending = callback;
    this.sent.push(msg);
  }
  public get _stream() {
    return this.stream;
  }
  public get _state() {
    return this.state;
  }
}


const context = (): Promise<TestContext> => {
  return new Promise(resolve => {
    const stream = new MemoryStream();
    const ctx = new TestContext(stream);
    writeVars(stream);
    ctx.onVariables().then(vars => resolve(ctx));
  });
};

describe('Context', () => {
  let ctx: TestContext;
  beforeEach(async () => {
    ctx = await context();
  });

  describe('parsing variables', () => {
    test('works', done => {
      const vars = ctx.variables;
      expect(vars.network).toBeDefined();
      expect(vars.network).toBe('yes');
      expect(vars.uniqueid).toBe('13507138.14');
      expect(vars.arg_1).not.toBe('test1');
      expect(vars.arg_1).toBe('test');

      done();
    });

    test('puts context into waiting state', () => {
      expect(ctx._state).toBe(state.waiting);
    });

    describe('sending command', () => {
      test('writes out', () => {
        ctx.send('EXEC test', () => '');
        expect(ctx.sent.length).toEqual(1);
        expect(ctx.sent.join('')).toEqual('EXEC test');
      });
    });
    describe('context.exec', () => {
      test('sends exec command', () => {
        ctx.exec('test', 'bang', 'another');
        expect(ctx.sent.join('')).toEqual('EXEC test bang,another\n');
      });
    });
  });
  describe('command flow', () => {
    describe('success', () => {
      test('emits proper repsonse', done => {
        process.nextTick(() => {
          ctx.exec('test', 'bang', 'another');
          ctx._stream.write('200');
          ctx._stream.write(' result=0\n\n');
        });

        ctx.on('response', (msg: IResponse) => {
          expect(msg.code).toEqual(200);
          expect(msg.result).toEqual('0');
          done();
        });
      });

      test('invokes callback with response', done => {
        process.nextTick(() => {
          ctx._stream.write('200 result=0');
          ctx._stream.write('\n');
          ctx._stream.write('200 result=0');
          ctx._stream.write('\n');
        });

        ctx.exec('test', 'boom').then(() => {
          done();
        });
      });

      test('includes the response value', done => {
        process.nextTick(() => {
          ctx.exec('test', 'bang', 'another');
          ctx._stream.write('200');
          ctx._stream.write(' result=0 (a value)\n\n');
        });

        ctx.on('response', msg => {
          expect(msg.code).toEqual(200);
          expect(msg.result).toEqual('0');
          expect(msg.value).toEqual('a value');
          done();
        });
      });
    });
    describe('two commands', () => {
      test('invokes two callbacks', done => {
        process.nextTick(() => {
          ctx._stream.write('200 result=0\n');
        });

        ctx
          .exec('test')
          .then(res => {
            expect(res.result).toEqual('0');
            process.nextTick(() => {
              ctx._stream.write('200 result=1\n');
            });
            return ctx.exec('test 2');
          })
          .then(res => {
            expect(res.result).toEqual('1');
            done();
          });
      });
    });
  });
  describe('hangup', () => {
    test('raises hangup on context', (done) => {
      ctx.on('hangup', done);
      ctx._stream.write('HANGUP\n');
    });

    describe('in command response', () => {
      test('is passed to callback', (done) => {
        ctx.exec('whatever', "qwer", "123");
        ctx.on('hangup', done);
        process.nextTick(() => {
          ctx._stream.write('200 result=-1\nHANGUP\n');
        });
      });
    });
  });
  describe("databaseDel", () => {
    test("sends correct command", () => {
      ctx.databaseDel("family", "test");
      expect(ctx.sent.join("")).toEqual("DATABASE DEL family test\n");
    });
  });

  describe("databaseDelTree", () => {
    test("sends correct command", () => {
      ctx.databaseDelTree("family", "test");
      expect(ctx.sent.join("")).toEqual(
        "DATABASE DELTREE family test\n"
      );
    });
  });

  describe("databaseGet", () => {
    test("sends correct command", () => {
      ctx.databaseGet("family", "test");
      expect(ctx.sent.join("")).toEqual("DATABASE GET family test\n");
    });
  });

  describe("databasePut", () => {
    test("sends correct command", () => {
      ctx.databasePut("family", "test", "value");
      expect(ctx.sent.join("")).toEqual(
        "DATABASE PUT family test value\n"
      );
    });
  });

  describe("setVariable", () => {
    test("sends correct command", () => {
      ctx.setVariable("test", "test test test");
      expect(ctx.sent.join("")).toEqual(
        'SET VARIABLE test "test test test"\n'
      );
    });
  });

  describe("setAutoHangup", () => {
    test("sends correct command", () => {
      ctx.setAutoHangup(10);
      expect(ctx.sent.join("")).toEqual("SET AUTOHANGUP 10\n");
    });
  });

  describe("setCallerID", () => {
    test("sends correct command", () => {
      ctx.setCallerID("246");
      expect(ctx.sent.join("")).toEqual("SET CALLERID 246\n");
    });
  });

  describe("setContext", () => {
    test("sends correct command", () => {
      ctx.setContext("outbound");
      expect(ctx.sent.join("")).toEqual("SET CONTEXT outbound\n");
    });
  });

  describe("setExtension", () => {
    test("sends correct command", () => {
      ctx.setExtension("245");
      expect(ctx.sent.join("")).toEqual("SET EXTENSION 245\n");
    });
  });

  describe("setPriority", () => {
    test("sends correct command", () => {
      ctx.setPriority("2");
      expect(ctx.sent.join("")).toEqual("SET PRIORITY 2\n");
    });
  });

  describe("setMusic", () => {
    test("sends correct command", () => {
      ctx.setMusic("on");
      expect(ctx.sent.join("")).toEqual("SET MUSIC on default\n");
    });
  });

  describe("channelStatus", () => {
    test("sends correct command", () => {
      ctx.channelStatus("test");
      expect(ctx.sent.join("")).toEqual("CHANNEL STATUS test\n");
    });
  });

  describe("getFullVariable", () => {
    test("sends correct command", () => {
      ctx.getFullVariable("test", "test");
      expect(ctx.sent.join("")).toEqual(
        "GET FULL VARIABLE test test\n"
      );
    });
  });

  describe("getData", () => {
    test("sends correct command", () => {
      ctx.getData("test", 10, 5);
      expect(ctx.sent.join("")).toEqual("GET DATA test 10 5\n");
    });
  });

  describe("getOption", () => {
    test("sends correct command", () => {
      ctx.getOption("test", ["#"], 5);
      expect(ctx.sent.join("")).toEqual('GET OPTION test "#" 5\n');
    });
  });

  describe("getVariable", () => {
    test("sends correct command", () => {
      ctx.getVariable("test");
      expect(ctx.sent.join("")).toEqual("GET VARIABLE test\n");
    });
  });

  describe("receiveChar", () => {
    test("sends correct command", () => {
      ctx.receiveChar(5);
      expect(ctx.sent.join("")).toEqual("RECEIVE CHAR 5\n");
    });
  });

  describe("receiveText", () => {
    test("sends correct command", () => {
      ctx.receiveText(5);
      expect(ctx.sent.join("")).toEqual("RECEIVE TEXT 5\n");
    });
  });

  describe("stream file", () => {
    test("sends", () => {
      ctx.streamFile("test", [1,2,3,4,5,6,7,8,9,0,"#","*"], 1000,);
      expect(ctx.sent.join("")).toEqual(
        'STREAM FILE "test" "1,2,3,4,5,6,7,8,9,0,#,*" 1000\n'
      );
    });
  });
  describe("record file", () => {
    test("record", () => {
      ctx.recordFile(
        "test",
        "wav",
        ["#"],
        10000,
        0,
        true,
        2,
      );
      expect(ctx.sent.join("")).toEqual(
        'RECORD FILE "test" wav "#" 10000 0 1 s=2\n'
      );
    });
  });

  describe("say number", () => {
    test("say number", () => {
      ctx.sayNumber(1234, ["#"], "a",);
      expect(ctx.sent.join("")).toEqual('SAY NUMBER 1234 "#" a\n');
    });
  });

  describe("say alpha", () => {
    test("say alpha", () => {
      ctx.sayAlpha("1234", ["#"],);
      expect(ctx.sent.join("")).toEqual('SAY ALPHA 1234 "#"\n');
    });
  });

  describe("say date", () => {
    test("say date", () => {
      const date = new Date();
      ctx.sayDate(date, ["#"], );
      expect(ctx.sent.join("")).toEqual(
        `SAY DATE ${(date.getTime() / 1000).toFixed()} "#"\n`
      );
    });
  });

  describe("say time", () => {
    test("say time", () => {
      const date = new Date();
      ctx.sayTime(date, ["#"],);
      expect(ctx.sent.join("")).toEqual(
        `SAY TIME ${(date.getTime() / 1000).toFixed()} "#"\n`
      );
    });
  });

  describe("say datetime", () => {
    test("say datetime", () => {
      const date = new Date();
      ctx.sayDateTime(date, ["#"], "Y", "DST",);
      expect(ctx.sent.join("")).toEqual(
        `SAY DATETIME ${(date.getTime() / 1000).toFixed()} "#" Y DST\n`
      );
    });
  });

  describe("say phonetic", () => {
    test("say phonetic", () => {
      ctx.sayPhonetic("1234ABCD", ["#"]);
      expect(ctx.sent.join("")).toEqual('SAY PHONETIC "1234ABCD" "#"\n');
    });
  });

  describe("context dial", () => {
    test("context dial", () => {
      ctx.dial("123", 10, "A",);
      expect(ctx.sent.join("")).toEqual("EXEC Dial 123,10,A\n");
    });
  });

  describe("say digits", () => {
    test("say digits", () => {
      ctx.sayDigits(1234, ["#"],);
      expect(ctx.sent.join("")).toEqual('SAY DIGITS 1234 "#"\n');
    });
  });

  describe("send image", () => {
    test("send image", () => {
      ctx.sendImage("1234",);
      expect(ctx.sent.join("")).toEqual("SEND IMAGE 1234\n");
    });
  });

  describe("send text", () => {
    test("send text", () => {
      ctx.sendText("1234");
      expect(ctx.sent.join("")).toEqual('SEND TEXT "1234"\n');
    });
  });

  describe("waitForDigit", () => {
    test("sends with default timeout", () => {
      ctx.waitForDigit(5000);
      expect(ctx.sent.join("")).toEqual("WAIT FOR DIGIT 5000\n");
    });

    test("sends with specified timeout", () => {
      ctx.waitForDigit(-1,);
      expect(ctx.sent.join("")).toEqual("WAIT FOR DIGIT -1\n");
    });
  });

  describe("hangup", () => {
    test('sends "HANGUP\\n"', () => {
      ctx.hangup();
      expect(ctx.sent.join("")).toEqual("HANGUP\n");
    });
  });

  describe("asyncAGIBreak", () => {
    test('sends "ASYNCAGI BREAK\\n"', () => {
      ctx.asyncAGIBreak();
      expect(ctx.sent.join("")).toEqual("ASYNCAGI BREAK\n");
    });
  });

  describe("answer", () => {
    test('sends "ANSWER\\n"', () => {
      ctx.answer();
      expect(ctx.sent.join("")).toEqual("ANSWER\n");
    });
  });

  describe("verbose", () => {
    test("sends correct command", () => {
      ctx.verbose("good", 2);
      expect(ctx.sent.join("")).toEqual('VERBOSE "good" 2\n');
    });
  });



  describe("noop", () => {
    test("sends correct command", () => {
      ctx.noop();
      expect(ctx.sent.join("")).toEqual("NOOP\n");
    });
  });



  describe("events", () => {
    describe("error", () => {
      test("is emitted when socket emits error", (done) => {
        ctx.on("error", (err) => {
          expect(err).toBeInstanceOf(Error)
          done();
        });
        ctx._stream.emit("error", new Error("test"));
      });
    });

    describe("close", () => {
      test("is emitted when socket emits close", (done) => {
        ctx.on("close", () => {
          done();
        });

        ctx._stream.emit("close", true);
      });
    });
  });

});
describe("agi#createServer", () => {
  test("returns instance of net.Server", (done) => {
    const server = new Agi().listen(3003);
    expect(server).toBeInstanceOf(Server)
    server.unref()
    done();
  });

  test("invokes callback when a new connection is established", (done) => {
    const port = 3034;
    const agi = new Agi();
    agi.use((ctx)=>{
      expect(ctx).toBeInstanceOf(Context);
      ctx.end();
      done();
    })
    agi.listen(port,()=>{
      const client = new Socket();
      client.connect({host: "localhost", port},()=>{
        writeVars(client)
        client.end();
      })
      
    }).unref();
    
  });
});
