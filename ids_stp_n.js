class Ids {
/**
 * 
 * @param {number} stp_n 
 * Rmin, Rmax, Lmin, Lmax
 * @returns {id_rmin: string[][], id_rmax: string[][], 
 * id_lmin: string[][], id_lmax: string[][]}
 */
  static ids_stp_n(stp_n,
         Rmin="Rmin", 
         Rmax="Rmax", 
         Lmin="Lmin", 
         Lmax="Lmax"
         ) {
     const n_l= 2;
      let id_rmin=[];
      let id_rmax=[];
      let id_lmin=[];
      let id_lmax=[];
      let r_min= [];
      let r_max= [];
      let l_min= [];
      let l_max= [];
      // r_min = Array.from({ length: stp_n }, ()=> Array(n_l).fill(0)); 
      // console.log("vswe1_db1js; array r_min:", r_min);
      for (let i= 0; i< stp_n; i++) { 
        id_rmin[i]= [];
        id_rmax[i]= [];
        id_lmin[i]= [];
        id_lmax[i]= [];
        r_min[i]= [];
        r_max[i]= [];
        l_min[i]= [];
        l_max[i]= [];
        for (let j=0; j< 2; j++) {
          id_rmin[i][j]=Rmin+(i+1).toString()+(j+1).toString();
          id_rmax[i][j]=Rmax+(i+1).toString()+(j+1).toString();
          id_lmin[i][j]=Lmin+(i+1).toString()+(j+1).toString();
          id_lmax[i][j]=Lmax+(i+1).toString()+(j+1).toString();
        }
      }//end of for i
      return { id_rmin, id_rmax, id_lmin, id_lmax};    
  }
}
export { Ids };