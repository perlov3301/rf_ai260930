class inputZ { mm
  /**Calculate input impedance for parallel branches:
   * - Branch 1: Transmission line with short circuit (ZL = 0)
   * - Branch 2: Transmission line with complex load (ZL_real + j*ZL_imag)
   * Velocity Factor (VF) = 1 / √(εr)=1
   * @param {number} Z01 - Characteristic impedance of transmission line 1 (ohms)
   * @param {number} Z02 - Characteristic impedance of transmission line 2 (ohms)
   * @param {number} length1(m) - Length of branch 1 (short circuit branch) (meters)
   * @param {number} length2(m) - Length of branch 2 (complex load branch) (meters)
   * @param {number} ZL2_real - real part of Load impedance  of branch 2 (ohms)
   * @param {number} ZL2_imag - imag part of Load impedance  of branch 2 (ohms)
   * @param {number} frequency - Frequency (Hz)
   * @param {number} vf - Velocity factor (default 1.0- free space like)
   * @returns {object} Input impedance {real, imag, magnitude, phase}
   */
  static parallelBranchesImpedance(
      Z01,Z02, 
      length1, length2, //mm
      ZL2_real, ZL2_imag, // Load for branch 2
      frequency,
      vf = 1.0,vconsole) 
      {
        frequency= frequency*1.0e6;
        length1= length1/1000; // convert mm to m
        length2= length2/1000; // convert mm to m
        const c = 3e8; // Speed of light (m/s)
        const wavelength = (c * vf) / frequency;
        const beta= (2*Math.PI*frequency)/(c*vf);//vf=1
        // ===== BRANCH 1: Short circuit (ZL = 0) =====
        const electricalLength1 = beta * length1;
        let tanBL1 = Math.tan(electricalLength1);
        const Zin1_real = 0;
        let Zin1_imag=100000;
        if (Math.abs(tanBL1) < 1e-2) { tanBL1 = 0.01 ; } 
        if (Z01>=10000) { Z01=1e9; }
        Zin1_imag = Z01 * tanBL1;
        if (vconsole<1) {
          console.log(` Z01: ${Z01.toFixed(2)} Ω; tanBL1: ${tanBL1.toFixed(2)} `);
        }

        // ===== BRANCH 2: Complex load =====
        const electricalLength2 = beta * length2;
        const tanBL2 = Math.tan(electricalLength2);

        // Zin2 = Z02 * (ZL2 + j*Z02*tan(beta*l)) / (Z02 + j*ZL2*tan(beta*l))
        // Numerator: Z02(ZL2_real+jZL2_imag) + j*Z02*Z02*tanBL2
        const num2_real = ZL2_real;// follow will be *Z02
        const num2_imag = ZL2_imag + Z02 * tanBL2;//*Z02

        // Denominator: Z02 + j*ZL2*tan(beta*l)=Z02+j(ZL2_real+jZL2_img)tan(beta*l)=
        // Z02+jZL2_real*tan(beta*l)-ZL2_img*tan(beta*l)
        const den2_real = Z02 - ZL2_imag * tanBL2; 
        const den2_imag = ZL2_real * tanBL2; 

        // Complex division:Zin2= Z02*(num2_real + j*num2_imag) / (den2_real + j*den2_imag)
        const den2_mag_sq = den2_real ** 2 + den2_imag ** 2;
        //Zin2=(num2_real+jnum2_imag)*(den2_real-jden2_imag)/den2_mag_sq
        const div2_real = (num2_real * den2_real + num2_imag * den2_imag) / den2_mag_sq;
        const div2_imag = (num2_imag * den2_real - num2_real * den2_imag) / den2_mag_sq;

        // Multiply by Z02: characteristic R of line2
        const Zin2_real = Z02 * div2_real;
        const Zin2_imag = Z02 * div2_imag;

    // ===== PARALLEL COMBINATION =====
    // Numerator: Z1 * Z2
    const num_parallel_real = Zin1_real * Zin2_real - Zin1_imag * Zin2_imag;
    const num_parallel_imag = Zin1_real * Zin2_imag + Zin1_imag * Zin2_real;

    // Denominator: Z1 + Z2
    const den_parallel_real = Zin1_real + Zin2_real;
    const den_parallel_imag = Zin1_imag + Zin2_imag;

    // Complex division
    const den_parallel_mag_sq = den_parallel_real ** 2 + den_parallel_imag ** 2;
    const Zin_real = (num_parallel_real * den_parallel_real + num_parallel_imag * den_parallel_imag) / den_parallel_mag_sq;
    const Zin_imag = (num_parallel_imag * den_parallel_real - num_parallel_real * den_parallel_imag) / den_parallel_mag_sq;

// console.log(` Frequency: ${(frequency / 1e6).toFixed(2)} MHz`);
if (vconsole<1) {
  console.log(` Zin1 =  j${Zin1_imag.toFixed(2)} Ω`);
  console.log(` Zin2 = ${Zin2_real.toFixed(3)} + j${Zin2_imag.toFixed(2)} Ω\n`);
  console.log(` Zin (parallel) = ${Zin_real.toFixed(3)} + j${Zin_imag.toFixed(3)} Ω`);
}

    return {
      Zin1: { real: 0, imag: Zin1_imag },
      Zin2: { real: Zin2_real, imag: Zin2_imag },
      Zin_parallel: {
        real: Zin_real,
        imag: Zin_imag,
      }
    };
  }
}
export { inputZ };