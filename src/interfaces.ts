export interface IVariables {
  /**
   *  The filename of your script
   */
  request?: string;
  /**
   *   The originating channel (your phone)
   */
  channel?: string;
  /**
   *   The language code (e.g. “en”)
   */
  language?: string;
  /**
   *   The originating channel type (e.g. “SIP” or “ZAP”)
   */
  type?: string;
  /**
   *    A unique ID for the call
   */
  uniqueid?: string;
  /**
   *   The version of Asterisk (since Asterisk 1.6)
   */
  version?: string;
  /**
   *   The caller ID number (or “unknown”)
   */
  callerid?: string;
  /**
   *    The caller ID name (or “unknown”)
   */
  calleridname?: string;
  /**
   *   The presentation for the callerid in a ZAP channel
   */
  callingpres?: string;
  /**
   *    The number which is defined in ANI2 (only for PRI Channels)
   */
  callingani2?: string;
  /**
   *   The type of number used in PRI Channels
   */
  callington?: string;
  /**
   *    An optional 4 digit number (Transit Network Selector) used in PRI Channels
   */
  callingtns?: string;
  /**
   *   The dialed number id (or “unknown”)
   */
  dnid?: string;
  /**
   *    The referring DNIS number (or “unknown”)
   */
  rdnis?: string;
  /**
   *   Origin context in extensions.conf
   */
  context?: string;
  /**
   *   The called number
   */
  extension?: string;
  /**
   *   The priority it was executed as in the dial plan
   */
  priority?: string;
  /**
   *    The flag value is 1.0 if started as an EAGI script, 0.0 otherwise
   */
  enhanced?: string;
  /**
   *    Account code of the origin channel
   */
  accountcode?: string;
  /**
   *   Thread ID of the AGI script (since Asterisk 1.6)
   */
  threadid?: string;
  /**
   *   arg_1
   */
  arg_1?: string;
  /**
   *   arg_2
   */
  arg_2?: string;
  /**
   *   arg_3
   */
  arg3?: string;
  [key: string]: any;
}
// export  type Variables = Partial<IVariables>;

export interface IResponse {
  code: number;
  result: string;
  value?: string;
}

/**
 *
 * 0 - Channel is down and available.
 * 1 - Channel is down, but reserved.
 * 2 - Channel is off hook.
 * 3 - Digits (or equivalent) have been dialed.
 * 4 - Line is ringing.
 * 5 - Remote end is ringing.
 * 6 - Line is up.
 * 7 - Line is busy.
 * https://wiki.asterisk.org/wiki/display/AST/Asterisk+17+AGICommand_channel+status
 */
export type ChanelStatus = '1' | '2' | '3' | '4' | '5' | '6' | '7';

export type Callback = (error: Error | null, arg1: IResponse) => void;

export type phoneKeys = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0 | '*' | '#';
