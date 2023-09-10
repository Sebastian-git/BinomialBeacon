let wasm;

/**
* @param {number} stock_price
* @param {number} strike_price
* @param {number} tte
* @param {number} rfr
* @param {number} div_yield
* @param {number} volatility
* @returns {number}
*/
export function d_one(stock_price, strike_price, tte, rfr, div_yield, volatility) {
    const ret = wasm.d_one(stock_price, strike_price, tte, rfr, div_yield, volatility);
    return ret;
}

/**
* @param {number} d_one
* @param {number} volatility
* @param {number} tte
* @returns {number}
*/
export function d_two(d_one, volatility, tte) {
    const ret = wasm.d_two(d_one, volatility, tte);
    return ret;
}

/**
* @param {number} z
* @param {number} steps
* @returns {number}
*/
export function peizer_pratt_inversion(z, steps) {
    const ret = wasm.peizer_pratt_inversion(z, steps);
    return ret;
}

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
export function get_up_move_probability(stock_price, strike_price, tte, rfr, div_yield, volatility, steps) {
    const ret = wasm.get_up_move_probability(stock_price, strike_price, tte, rfr, div_yield, volatility, steps);
    return ret;
}

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
export function get_up_move_probability_prime(stock_price, strike_price, tte, rfr, div_yield, volatility, steps) {
    const ret = wasm.get_up_move_probability_prime(stock_price, strike_price, tte, rfr, div_yield, volatility, steps);
    return ret;
}

/**
* @param {number} up_move_probability
* @returns {number}
*/
export function get_down_move_probability(up_move_probability) {
    const ret = wasm.get_down_move_probability(up_move_probability);
    return ret;
}

/**
* @param {number} up_move_probability_prime
* @returns {number}
*/
export function get_down_move_probability_prime(up_move_probability_prime) {
    const ret = wasm.get_down_move_probability(up_move_probability_prime);
    return ret;
}

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
export function get_up_move_size(stock_price, strike_price, tte, rfr, div_yield, volatility, steps) {
    const ret = wasm.get_up_move_size(stock_price, strike_price, tte, rfr, div_yield, volatility, steps);
    return ret;
}

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
export function get_down_move_size(stock_price, strike_price, tte, rfr, div_yield, volatility, steps) {
    const ret = wasm.get_down_move_size(stock_price, strike_price, tte, rfr, div_yield, volatility, steps);
    return ret;
}

/**
* @param {number} x
* @returns {number}
*/
export function get_phi(x) {
    const ret = wasm.get_phi(x);
    return ret;
}

/**
* @param {number} stock_price
* @param {number} tte
* @param {number} div_yield
* @param {number} d_one
* @returns {number}
*/
export function get_vega(stock_price, tte, div_yield, d_one) {
    const ret = wasm.get_vega(stock_price, tte, div_yield, d_one);
    return ret;
}

/**
* @param {number} std_dev
* @param {number} delta_t
* @returns {number}
*/
export function up_size(std_dev, delta_t) {
    const ret = wasm.up_size(std_dev, delta_t);
    return ret;
}

/**
* @param {number} std_dev
* @param {number} delta_t
* @returns {number}
*/
export function down_size(std_dev, delta_t) {
    const ret = wasm.down_size(std_dev, delta_t);
    return ret;
}

/**
* @param {number} underlying_price
* @param {number} strike_price
* @returns {number}
*/
export function call_buy_payoff(underlying_price, strike_price) {
    const ret = wasm.call_buy_payoff(underlying_price, strike_price);
    return ret;
}

/**
* @param {number} underlying_price
* @param {number} strike_price
* @returns {number}
*/
export function put_buy_payoff(underlying_price, strike_price) {
    const ret = wasm.put_buy_payoff(underlying_price, strike_price);
    return ret;
}

/**
* @param {number} rfr
* @param {number} delta_t
* @param {number} up_move
* @param {number} down_move
* @returns {number}
*/
export function get_rnp(rfr, delta_t, up_move, down_move) {
    const ret = wasm.get_rnp(rfr, delta_t, up_move, down_move);
    return ret;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};

    return imports;
}

function __wbg_init_memory(imports, maybe_memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;


    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(input) {
    if (wasm !== undefined) return wasm;

    if (typeof input === 'undefined') {
        input = new URL('wasm_lib_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await input, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync }
export default __wbg_init;
