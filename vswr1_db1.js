import { inputZ } from './parallel_zin.js';
import { calculate } from './calculateVSWR.js';
import { LineLR } from './line_rl.js';
import { Ids } from './ids_stp_n.js';


class f1
{
/** 
 *   @param {number} Z0
   * @param {number} frequency - Frequency (MHz)
 *   @param {number} ZL2_real - real part of Load impedance  of branch 2 (ohms)
   * @param {number} ZL2_imag - imag part of Load impedance  of branch 2 (ohms)
     @param {number} Z01 - Characteristic impedance of transmission line 1 (ohms)
   * @param {number} Z02 - Characteristic impedance of transmission line 2 (ohms)
   * @param {number} length1(m) - Length of branch 1 (short circuit branch) (meters)
   * @param {number} length2(m) - Length of branch 2 (complex load branch) (meters)
   * @param {number} vf =1
   * @returns {object} vswr and db for one frequency point
 * @returns 
 */
    static vswr1_db1(
      Z0, 
      frequency, 
      Load_real, Load_imag, // load for strip 2
      vf = 1.0,
      stp_n,
      Z01_array, Z02_array, length1_array, length2_array,
      vconsole
    ) 
    {
      // const { id_rmin, id_rmax, id_lmin, id_lmax}= Ids.ids_stp_n(stp_n);
       let ZL2_real=0;
       let ZL2_imag=0;
       let data={};
       let Z01=0, Z02=0, length1=0, length2=0;
       if (vconsole<1) {
        console.log("vswr1;f=", frequency," Load real:", Load_real, " imag:", Load_imag);
       }
       for (let j=0; j<stp_n;j++) {
        if (vconsole<1) {
          console.log("vswr1_db1.js; section=", j+1, " of ", stp_n);
        }
        
        Z01= Z01_array[j];
        Z02= Z02_array[j];
        length1= length1_array[j];
        length2= length2_array[j];
        if (j==0) {
        // console.log("vswr1;for section ", j+1);
            ZL2_real= Load_real;
            ZL2_imag= Load_imag;
        } else {   
        //  console.log("vswr1; else; j=", j);
          ZL2_real=data.Zin_parallel.real;
          ZL2_imag=data.Zin_parallel.imag;
        }
        data = inputZ.parallelBranchesImpedance( // mm, MHz, load
          Z01,Z02, //ro of lines
          length1, length2, //mm length of lines
          ZL2_real, ZL2_imag, // Load for branch 2
          frequency, vf,vconsole
        );      
       }// end of for
      // console.log("vswr1;after for");
      const vswrData= calculate.calculateVSWR( // not dependent on frequency and Load
        Z0, 
        data.Zin_parallel.real, 
        data.Zin_parallel.imag);
        return {
            Zin1: { real: 0, imag: data.Zin1.imag},
            Zin2: { real: data.Zin2.real, imag: data.Zin2.imag },
            Zin_parallel: {
              real: data.Zin_parallel.real,
              imag: data.Zin_parallel.imag,
            },
            gamma: vswrData.gamma,
            vswr: vswrData.vswr,
            db: vswrData.reflection_losses,
        }
    }
}
export {f1};
