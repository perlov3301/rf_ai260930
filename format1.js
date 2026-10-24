class format1 {
/**
 @param {a} a 
 @returns vswr || db || zin_r || zin_x.toFixed() 
 */
    static fvswr(a) {
        let vswr;
        if (a < 1.7)               { vswr= +a.toFixed(3); } 
          else if (a>=1.7 && a<6)  { vswr= +a.toFixed(2); }
          else if (a>=6 && a<24) { vswr= +a.toFixed(1); }
          else                   { vswr= +a.toFixed(0); }  
        return vswr;       
      }

    static fdb(a) {
        let db;
        if (a > -1.)               { db= +a.toFixed(3); } 
        else if (a<=-1. && a>-5.)  { db= +a.toFixed(2); }
        else if (a<=-5. && a>-21.) { db= +a.toFixed(1); }
        else                       { db= +a.toFixed(0); }    
        return db;     
      }
    
    static fzin_r(a) {
        let zin_r;
        if      (a<1.7)            { zin_r= +a.toFixed(3); } 
        else if (a>=1.7 && a<12.)  { zin_r= +a.toFixed(2); } 
        else if (a>=12 && a<70.)   { zin_r= +a.toFixed(1); } 
        else                       { zin_r= +a.toFixed(0); }
        return zin_r;
      }
    
    static f_l(a) {
        let l;
        l= +a.toFixed(2);
        return l;
    }
    
    static fzin_x(a) {
        let zin_x;
        const abs_a= Math.abs(a);
        if      (abs_a<1)                { zin_x= +a.toFixed(3); } 
        else if (abs_a>=1 && abs_a<20)   { zin_x= +a.toFixed(2); } 
        else if (abs_a>=20 && abs_a<100) { zin_x= +a.toFixed(1); } 
        else                             { zin_x= +a.toFixed(0); }
        return zin_x;
      }
    
    static fg(a) {
        let g;
        if      (a<0.20)                 { g= +a.toFixed(2); } 
        else if (a>=0.200 && a<0.900)    { g= +a.toFixed(3); } 
        else if (a>=0.9000 && a<0.9980)  { g= +a.toFixed(4); } 
        else                             { g= +a.toFixed(5); }
        return g;
    }
        
}
export { format1 };