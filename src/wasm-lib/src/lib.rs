use wasm_bindgen::prelude::*;

// Leisen-Reimer Model Formulas

#[wasm_bindgen]
pub fn d_one(stock_price: f64, strike_price: f64, tte: f64, rfr: f64, div_yield: f64, volatility: f64) -> f64 {
    ((stock_price / strike_price).ln() + (tte * (rfr - div_yield + volatility.powf(2.0) / 2.0))) / (volatility * tte.sqrt())
}

#[wasm_bindgen]
pub fn d_two(d_one: f64, volatility: f64, tte: f64) -> f64 {
    d_one - volatility * tte.sqrt()
}

#[wasm_bindgen]
pub fn peizer_pratt_inversion(z: f64, steps: f64) -> f64 {
    1.0/2.0 + z.signum()/2.0 * ( 1.0 - (-1.0 * ( z / (steps + 1.0/3.0 + 0.1/(steps+1.0)) ).powf(2.0) * (steps + 1.0/6.0)).exp() ).sqrt()
}

// h^-1( d2 )
#[wasm_bindgen]
pub fn get_up_move_probability(stock_price: f64, strike_price: f64, tte: f64, rfr: f64, div_yield: f64, volatility: f64, steps: f64) -> f64 {
    peizer_pratt_inversion(d_two(d_one(stock_price, strike_price, tte, rfr, div_yield, volatility), volatility, tte), steps)
}

// h^-1( d1 )
#[wasm_bindgen]
pub fn get_up_move_probability_prime(stock_price: f64, strike_price: f64, tte: f64, rfr: f64, div_yield: f64, volatility: f64, steps: f64) -> f64 {
    peizer_pratt_inversion(d_one(stock_price, strike_price, tte, rfr, div_yield, volatility), steps)
}

#[wasm_bindgen]
pub fn get_down_move_probability(up_move_probability: f64) -> f64 {
    1.0 - up_move_probability
}

#[wasm_bindgen]
pub fn get_down_move_probability_prime(up_move_probability_prime: f64) -> f64 {
    1.0 - up_move_probability_prime
}

#[wasm_bindgen]
pub fn get_up_move_size(stock_price: f64, strike_price: f64, tte: f64, rfr: f64, div_yield: f64, volatility: f64, steps: f64) -> f64 {
   ( (rfr - div_yield) * (tte / steps) ).exp() * get_up_move_probability_prime(stock_price, strike_price, tte, rfr, div_yield, volatility, steps) / get_up_move_probability(stock_price, strike_price, tte, rfr, div_yield, volatility, steps)
}

#[wasm_bindgen]
pub fn get_down_move_size(stock_price: f64, strike_price: f64, tte: f64, rfr: f64, div_yield: f64, volatility: f64, steps: f64) -> f64 {
    ( (rfr - div_yield) * (tte / steps) ).exp() * get_down_move_probability_prime(get_up_move_probability_prime(stock_price, strike_price, tte, rfr, div_yield, volatility, steps)) /  get_down_move_probability(get_up_move_probability(stock_price, strike_price, tte, rfr, div_yield, volatility, steps))
}



/* 
Vega measures options contract premium sensitivity

"How much does a 1% change in the implied volatility affect an option’s market price?"
https://www.quora.com/What-is-formula-to-calculate-implied-volatility
*/

#[wasm_bindgen]
pub fn get_phi(x: f64) -> f64 {
    1.0 / (x.powf(2.0) / 2.0).exp() / (2.0 * std::f64::consts::PI).sqrt()
}

#[wasm_bindgen]
pub fn get_vega(stock_price: f64, tte: f64, div_yield: f64, d_one: f64) -> f64 {
    stock_price * ( 1.0 / (tte * div_yield).exp() ) * get_phi(d_one) * tte.sqrt()
}



// Cox-Ross-Rubinstein Model Formulas

#[wasm_bindgen]
pub fn up_size(std_dev: f64, delta_t: f64) -> f64 {
    (std_dev * delta_t.sqrt()).exp()
}

#[wasm_bindgen]
pub fn down_size(std_dev: f64, delta_t: f64) -> f64 {
    1.0 / (std_dev * delta_t.sqrt()).exp()
}

#[wasm_bindgen]
pub fn call_buy_payoff(underlying_price: f64, strike_price: f64) -> f64 {
    f64::max(underlying_price - strike_price, 0.0)
}

#[wasm_bindgen]
pub fn put_buy_payoff(underlying_price: f64, strike_price: f64) -> f64 {
    f64::max(strike_price - underlying_price, 0.0)
}

#[wasm_bindgen]
pub fn get_rnp(rfr: f64, delta_t: f64, up_move: f64, down_move: f64) -> f64 {
    ((rfr * delta_t).exp() - down_move) / (up_move - down_move)
}
