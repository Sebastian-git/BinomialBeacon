/* tslint:disable */
/* eslint-disable */
/**
* @param {number} stock_price
* @param {number} strike_price
* @param {number} tte
* @param {number} rfr
* @param {number} div_yield
* @param {number} volatility
* @returns {number}
*/
export function d_one(stock_price: number, strike_price: number, tte: number, rfr: number, div_yield: number, volatility: number): number;
/**
* @param {number} d_one
* @param {number} volatility
* @param {number} tte
* @returns {number}
*/
export function d_two(d_one: number, volatility: number, tte: number): number;
/**
* @param {number} z
* @param {number} steps
* @returns {number}
*/
export function peizer_pratt_inversion(z: number, steps: number): number;
/**
* @param {number} stock_price
* @param {number} strike_price
* @param {number} tte
* @param {number} rfr
* @param {number} div_yield
* @param {number} volatility
* @param {number} steps
* @returns {number}
*/
export function get_up_move_probability(stock_price: number, strike_price: number, tte: number, rfr: number, div_yield: number, volatility: number, steps: number): number;
/**
* @param {number} stock_price
* @param {number} strike_price
* @param {number} tte
* @param {number} rfr
* @param {number} div_yield
* @param {number} volatility
* @param {number} steps
* @returns {number}
*/
export function get_up_move_probability_prime(stock_price: number, strike_price: number, tte: number, rfr: number, div_yield: number, volatility: number, steps: number): number;
/**
* @param {number} up_move_probability
* @returns {number}
*/
export function get_down_move_probability(up_move_probability: number): number;
/**
* @param {number} up_move_probability_prime
* @returns {number}
*/
export function get_down_move_probability_prime(up_move_probability_prime: number): number;
/**
* @param {number} stock_price
* @param {number} strike_price
* @param {number} tte
* @param {number} rfr
* @param {number} div_yield
* @param {number} volatility
* @param {number} steps
* @returns {number}
*/
export function get_up_move_size(stock_price: number, strike_price: number, tte: number, rfr: number, div_yield: number, volatility: number, steps: number): number;
/**
* @param {number} stock_price
* @param {number} strike_price
* @param {number} tte
* @param {number} rfr
* @param {number} div_yield
* @param {number} volatility
* @param {number} steps
* @returns {number}
*/
export function get_down_move_size(stock_price: number, strike_price: number, tte: number, rfr: number, div_yield: number, volatility: number, steps: number): number;
/**
* @param {number} x
* @returns {number}
*/
export function get_phi(x: number): number;
/**
* @param {number} stock_price
* @param {number} tte
* @param {number} div_yield
* @param {number} d_one
* @returns {number}
*/
export function get_vega(stock_price: number, tte: number, div_yield: number, d_one: number): number;
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
* @param {number} underlying_price
* @param {number} strike_price
* @returns {number}
*/
export function call_buy_payoff(underlying_price: number, strike_price: number): number;
/**
* @param {number} underlying_price
* @param {number} strike_price
* @returns {number}
*/
export function put_buy_payoff(underlying_price: number, strike_price: number): number;
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
  readonly d_one: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly d_two: (a: number, b: number, c: number) => number;
  readonly peizer_pratt_inversion: (a: number, b: number) => number;
  readonly get_up_move_probability: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly get_up_move_probability_prime: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly get_down_move_probability: (a: number) => number;
  readonly get_up_move_size: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly get_down_move_size: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly get_phi: (a: number) => number;
  readonly get_vega: (a: number, b: number, c: number, d: number) => number;
  readonly up_size: (a: number, b: number) => number;
  readonly down_size: (a: number, b: number) => number;
  readonly call_buy_payoff: (a: number, b: number) => number;
  readonly put_buy_payoff: (a: number, b: number) => number;
  readonly get_rnp: (a: number, b: number, c: number, d: number) => number;
  readonly get_down_move_probability_prime: (a: number) => number;
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
