import { Duplex } from 'stream';
import { BaseContext } from './base-context';
import { IResponse, phoneKeys } from './interfaces';

export class Context<C extends Duplex> extends BaseContext<C> {
  /**
   *  response.result = "-1" | "0"
   *
   * -1. channel failure
   *
   *  0 successful
   * https://wiki.asterisk.org/wiki/display/AST/Asterisk+17+AGICommand_answer
   */
  public answer(): Promise<IResponse> {
    return this.sendCommand('ANSWER');
  }

  /**
   * Interrupts expected flow of Async AGI commands and
   * returns control to previous source (typically, the PBX dialplan).
   *
   * https://wiki.asterisk.org/wiki/display/AST/Asterisk+17+AGICommand_asyncagi+break
   */
  public asyncAGIBreak(): Promise<IResponse> {
    return this.sendCommand('ASYNCAGI BREAK');
  }

  /**
   * response.result = "1" | "2" | "3" | "4" | "5" | "6" | "7" \
   *
   * 0  Channel is down and available.
   *
   * 1  Channel is down, but reserved.
   *
   * 2  Channel is off hook.
   *
   * 3  Digits (or equivalent) have been dialed.
   *
   * 4  Line is ringing.
   *
   * 5  Remote end is ringing.
   *
   * 6  Line is up.
   *
   * 7  Line is busy.
   * https://wiki.asterisk.org/wiki/display/AST/Asterisk+17+AGICommand_channel+status
   */
  public channelStatus(chanelname: string): Promise<IResponse> {
    return this.sendCommand(`CHANNEL STATUS ${chanelname}`);
  }

  /**
   * Playback specified file with ability to be controlled by user
   *
   * filename -- filename to play (on the asterisk server)
   *  (don't use file-type extension!)
   *
   * escapeDigits -- if provided,
   *
   * skipMS -- number of milliseconds to skip on FF/REW
   *
   * ffChar -- if provided, the set of chars that fast-forward
   *
   * rewChar -- if provided, the set of chars that rewind
   *
   * pauseChar -- if provided, the set of chars that pause playback
   * https://wiki.asterisk.org/wiki/display/AST/Asterisk+17+AGICommand_control+stream+file
   */
  public controlStreamFile(
    filename: string,
    escapeDigits: phoneKeys[] = [1, 2, 3, 4, 5, 6, 7, 8, 0],
    skipMS: number = 3000,
    ffChar: phoneKeys = '#',
    rewChar: phoneKeys = '*',
    pauseChar?: phoneKeys,
    offsetms?: number,
  ): Promise<IResponse> {
    let command = `CONTROL STREAM FILE ${filename}` + ` "${escapeDigits}" ${skipMS} ${ffChar} ${rewChar}`;
    if (pauseChar) {
      command += ` ${pauseChar}`;
    }
    if (offsetms) {
      command += ` ${offsetms}`;
    }
    return this.sendCommand(command);
  }

  /**
   * Deletes an entry in the Asterisk database for a given family and key.
   * response.result = "0" | "1"
   *
   * 0  successful
   *
   * 1  otherwise.
   *
   * https://wiki.asterisk.org/wiki/display/AST/Asterisk+17+AGICommand_database+del
   */
  public databaseDel(family: string, key: string) {
    return this.sendCommand(`DATABASE DEL ${family} ${key}`);
  }

  /**
   * Deletes a family or specific keytree within a family in the Asterisk database.
   * response.result = "0" | "1"
   *
   * 0   if successful
   *
   * 1  otherwise.
   *
   * https://wiki.asterisk.org/wiki/display/AST/Asterisk+17+AGICommand_database+deltree
   */
  public databaseDelTree(family: string, keyTree: string) {
    return this.sendCommand(`DATABASE DELTREE ${family} ${keyTree}`);
  }

  /**
   * Retrieves an entry in the Asterisk database for a given family and key.
   * response.result = "0" | "1"
   *
   * 0  key is not set
   *
   * 1  key is set and returns the variable in response.value
   *
   * https://wiki.asterisk.org/wiki/display/AST/Asterisk+17+AGICommand_database+get
   */
  public databaseGet(family: string, key: string) {
    return this.sendCommand(`DATABASE GET ${family} ${key}`);
  }

  /**
   * Adds or updates an entry in the Asterisk database for a given family, key, and value.
   * response.result = "0" | "1"
   *
   * 0 successful
   *
   * 1  otherwise.
   *
   * https://wiki.asterisk.org/wiki/display/AST/Asterisk+17+AGICommand_database+put
   */
  public databasePut(family: string, key: string, value: string) {
    return this.sendCommand(`DATABASE PUT ${family} ${key} ${value}`);
  }

  /**
   * Executes application with given options.
   * Returns whatever the application returns, or -2 on failure to find application.
   */
  public exec(command: string, ...options: string[]) {
    return this.sendCommand(`EXEC ${command} ${options}`);
  }
  /**
   * Prompts for DTMF on a channel
   * Stream the given file, and receive DTMF data.
   * Returns the digits received from the channel at the other end.
   * https://wiki.asterisk.org/wiki/display/AST/Asterisk+17+AGICommand_get+data
   */
  public getData(file: string, timeout: number, maxDigits: number) {
    return this.sendCommand(`GET DATA ${file} ${timeout} ${maxDigits}`);
  }
  public getFullVariable(name: string, channelName: string = '') {
    return this.sendCommand(`GET FULL VARIABLE ${name} ${channelName}`);
  }
  public getOption(filename: string, escapeDigits: phoneKeys[] = [], timeout: number = 5000) {
    return this.sendCommand(`GET OPTION ${filename} "${escapeDigits}" ${timeout}`);
  }
  public getVariable(name: string) {
    return this.sendCommand(`GET VARIABLE ${name}`);
  }
  public goSub(context: string, extension: string, priority: string, optArg: string = '') {
    return this.sendCommand(`GOSUB ${context} ${extension} ${priority} ${optArg}`);
  }
  public hangup(chanelname?: string) {
    return this.sendCommand(`HANGUP${chanelname ? ` ${chanelname}` : ''}`);
  }
  public noop() {
    return this.sendCommand(`NOOP`);
  }
  public receiveChar(timeout: number) {
    return this.sendCommand(`RECEIVE CHAR ${timeout}`);
  }
  public receiveText(timeout: number) {
    return this.sendCommand(`RECEIVE TEXT ${timeout}`);
  }
  public recordFile(
    file: string,
    format: string = 'wav',
    escapeDigits: phoneKeys[] = [],
    timeout: number = -1,
    offsetSamples: number = 0,
    beep?: boolean,
    silence?: number,
  ) {
    let command = `RECORD FILE "${file}" ${format} "${escapeDigits}" ${timeout} ${offsetSamples}`;
    if (beep) {
      command += ' 1';
    }
    if (silence) {
      command += ` s=${silence}`;
    }

    return this.sendCommand(command);
  }
  public sayAlpha(data: string, escapeDigits: phoneKeys[] = []) {
    return this.sendCommand(`SAY ALPHA ${data} "${escapeDigits}"`);
  }
  public sayDate(date: Date, escapeDigits: phoneKeys[] = []) {
    return this.sendCommand(`SAY DATE ${(date.getTime() / 1000).toFixed()} "${escapeDigits}"`);
  }
  public sayDateTime(date: Date, escapeDigits: phoneKeys[] = [], format?: string, timezone?: string) {
    let command = `SAY DATETIME ${(date.getTime() / 1000).toFixed()} "${escapeDigits}"`;
    if (format) {
      command += ` ${format}`;
    }
    if (timezone) {
      command += ` ${timezone}`;
    }
    return this.sendCommand(command);
  }
  public sayDigits(data: number, escapeDigits: phoneKeys[] = []) {
    return this.sendCommand(`SAY DIGITS ${data} "${escapeDigits}"`);
  }
  public sayNumber(data: number, escapeDigits: phoneKeys[] = [], gender?: string) {
    let command = `SAY NUMBER ${data} "${escapeDigits}"`;
    if (gender) {
      command += ` ${gender}`;
    }
    return this.sendCommand(command);
  }
  public sayPhonetic(data: string, escapeDigits: phoneKeys[] = []) {
    return this.sendCommand(`SAY PHONETIC "${data}" "${escapeDigits}"`);
  }
  public sayTime(date: Date, escapeDigits: phoneKeys[] = []) {
    return this.sendCommand(`SAY TIME ${(date.getTime() / 1000).toFixed()} "${escapeDigits}"`);
  }
  public sendImage(name: string) {
    return this.sendCommand(`SEND IMAGE ${name}`);
  }
  public sendText(text: string) {
    return this.sendCommand(`SEND TEXT "${text}"`);
  }

  public setAutoHangup(time: number) {
    return this.sendCommand(`SET AUTOHANGUP ${time}`);
  }
  public setCallerID(callerrid: string) {
    return this.sendCommand(`SET CALLERID ${callerrid}`);
  }
  public setContext(context: string) {
    return this.sendCommand(`SET CONTEXT ${context}`);
  }
  public setExtension(extension: string) {
    return this.sendCommand(`SET EXTENSION ${extension}`);
  }
  public setMusic(mode: 'on' | 'off', className: string = 'default') {
    return this.sendCommand(`SET MUSIC ${mode} ${className}`);
  }
  public setPriority(priority: string) {
    return this.sendCommand(`SET PRIORITY ${priority}`);
  }
  public setVariable(name: string, value: string) {
    return this.sendCommand(`SET VARIABLE ${name} "${value}"`);
  }
  public streamFile(filename: string, escapeDigits: phoneKeys[] = [], offsetms?: number) {
    let command = `STREAM FILE "${filename}" "${escapeDigits}"`;
    if (offsetms) {
      command += ` ${offsetms}`;
    }
    return this.sendCommand(command);
  }

  public verbose(message: string, level?: 1 | 2 | 3 | 4) {
    let command = `VERBOSE "${message}"`;
    if (level) {
      command += ` ${level}`;
    }
    return this.sendCommand(command);
  }

  public waitForDigit(timeout: number = 10000) {
    return this.sendCommand(`WAIT FOR DIGIT ${timeout}`);
  }

  public dial(target: string, timeout: number, params: string) {
    return this.exec('Dial', `${target},${timeout}`, params);
  }
}
