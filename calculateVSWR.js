class calculate { // not dependent on ro1 or ro2, or length1 or length2
  /**
   @param {number} Z0: Generator's characteristic Impedance
   @param {number} Zin_real: Real part of Impedance at input 
   @param {number} Zin_imag: Imag part of Impedance at input
   @returns {object} {gamma, vswr }
   */
  static calculateVSWR(Z0, Zin_real, Zin_imag) {
    if (!Z0 || Number.isNaN(Z0) 
        || Number.isNaN(Zin_real) 
        || Number.isNaN(Zin_imag)) {
    throw new Error(
    "calculateVSWR;one or more values of impedance or load  are invalid.");
  }
 
    const numeratorReal =  Zin_real - Z0;
    const numeratorImag = Zin_imag;
    const denominatorReal =  Zin_real + Z0;
    const denominatorImag = Zin_imag;
 
    const numeratorMag = Math.hypot(numeratorReal, numeratorImag);
    const denominatorMag = Math.hypot(denominatorReal, denominatorImag);
    const gamma = numeratorMag / denominatorMag;
    const vswr = (1 + gamma) / (1 - gamma);
    const db= 10*Math.log10(1-gamma*gamma)
  return {
    gamma: gamma,
    vswr: vswr,
    reflection_module: gamma,
    reflection_losses: db,
  };
}
}
export {calculate}; 