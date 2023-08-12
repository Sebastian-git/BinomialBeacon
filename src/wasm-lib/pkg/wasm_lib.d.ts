/* tslint:disable */
/* eslint-disable */
/**
* @param {number} std_dev
* @param {number} delta_t
* @returns {number}
*/
export function up_size(std_dev: number, delta_t: number): number;
/**
* @param {number} std_dev
* @param {number} delta_t
* @returns {number}
*/
export function down_size(std_dev: number, delta_t: number): number;
/**
* @param {number} cur_price
* @param {number} strike_price
* @returns {number}
*/
export function call_buy_payoff(cur_price: number, strike_price: number): number;
/**
* @param {number} cur_price
* @param {number} strike_price
* @returns {number}
*/
export function put_buy_payoff(cur_price: number, strike_price: number): number;
/**
* @param {number} rfr
* @param {number} delta_t
* @param {number} up_move
* @param {number} down_move
* @returns {number}
*/
export function get_rnp(rfr: number, delta_t: number, up_move: number, down_move: number): number;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly up_size: (a: number, b: number) => number;
  readonly down_size: (a: number, b: number) => number;
  readonly call_buy_payoff: (a: number, b: number) => number;
  readonly put_buy_payoff: (a: number, b: number) => number;
  readonly get_rnp: (a: number, b: number, c: number, d: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
