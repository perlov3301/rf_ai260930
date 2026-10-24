import { timenow } from './timenow.js';
import { f1 } from './vswr1_db1.js'
import { table_f_n }   from './table_f_n.js';
import { format1 } from './format1.js';
import { table_stp_n } from './table_stp_n.js';
import { LineLR } from './line_rl.js';
import { Ids } from './ids_stp_n.js';
import { limitStopVswr, rejectionDb, candidateCost } from './cost.js';
document.addEventListener("readystatechange", () => {
    console.log("document.readyState:", document.readyState);
   
    const explanationArea= document.getElementById("explanation");
    explanationArea.value = `Current readyState: ${document.readyState}\n`;
    explanationArea.value += `time: ${timenow()}\n`;
  
    const myForm = document.getElementById("vswrForm");
    window.addEventListener('keydown',function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
      }
    });
    const vf=1; // Eeff =1 
    let targets0= [];
    // number of cycles of random searches per click; taken from the page input
    const cycles_input= document.getElementById("search_cycles");
    const k0_default= 710;
    const k0_max= 100000;
    let k0= k0_default;
    function readCycles() {
      const v= parseInt(cycles_input.value, 10);
      if (!Number.isInteger(v) || v<1 || v>k0_max) {
        throw new Error(`number of cycles must be a whole number from 1 to ${k0_max}.`);
      }
      k0= v;
      return k0;
    }
    cycles_input.addEventListener("input", ()=> {
      const v= parseInt(cycles_input.value, 10);
      if (Number.isInteger(v) && v>=1 && v<=k0_max) { k0= v; }
    });
    
    let inputIds_f= [];
    let inputIds_ZL2_real= [];
    let inputIds_ZL2_imag= [];
 
    
    const result_vswr=  document.getElementById("result_vswr");
    result_vswr.textContent=`collection of results for best solutions from within ${k0}-times searches each \n`;
    
    const form= document.getElementById("vswrForm");
    const generatorR= document.getElementById("generatorR");
    
    const mytable= document.getElementById("mytable");
    const tbody = document.getElementById("frequencyTableBody");
    const frequency_n_input= document.getElementById("frequency_n");
    frequency_n_input.addEventListener("input", ()=>{
      tbody.replaceChildren(""); 
      result_vswr.textContent=`collection of best solution from within ${k0}-times searches each  \n`;
      explanationArea.value = `time: ${timenow()}\n`;

    });
    mytable.addEventListener('input', ()=> {
      result_vswr.textContent=`collection of best solution from within ${k0}-times searches each\n`;
    });
    
    let f_n=1; // number of f
    const button_f_n= document.getElementById("button_f_n_table");
    button_f_n.addEventListener("click", ()=>{
      tbody.replaceChildren(""); 
      f_n= parseInt(frequency_n_input.value,10);
      console.log("button_f was clicked; f_n=", f_n);
// ids frequency table base names
      const frequency= "frequency";
      const load_real= "load_real";
      const load_imag= "load_imag";
      const table_ids=table_f_n.addRows(
          "frequencyTableBody", 
          f_n, 
          frequency, 
          load_real, load_imag);
      inputIds_f= table_ids.id_array_f;
      inputIds_ZL2_real= table_ids.id_array_r;
      inputIds_ZL2_imag= table_ids.id_array_x;
    });//end of frequences table

// ---- stopband: frequencies that must be rejected (high VSWR wanted) ----
// Optional. With 0 stopband frequencies the program works as before.
    let inputIds_sf= [];
    let inputIds_sr= [];
    let inputIds_sx= [];
    const stop_tbody= document.getElementById("stopTableBody");
    const stop_n_input= document.getElementById("stop_frequency_n");
    const stop_target_input= document.getElementById("stop_vswr_target");
    const stop_weight_input= document.getElementById("stop_weight");
    function forgetStopTable() {
      stop_tbody.replaceChildren("");
      inputIds_sf= [];
      inputIds_sr= [];
      inputIds_sx= [];
    }
    stop_n_input.addEventListener("input", forgetStopTable);
    document.getElementById("button_stop_table").addEventListener("click", ()=> {
      forgetStopTable();
      const n= parseInt(stop_n_input.value, 10);
      if (!Number.isInteger(n) || n<1) { return; } // 0: no stopband
      const stop_ids= table_f_n.addRows(
          "stopTableBody",
          n,
          "stop_frequency",
          "stop_load_real", "stop_load_imag");
      inputIds_sf= stop_ids.id_array_f;
      inputIds_sr= stop_ids.id_array_r;
      inputIds_sx= stop_ids.id_array_x;
    });
    /**
     * Reads the stopband table and its two settings from the page.
     * @returns {{freq:number[], real:number[], imag:number[], target:number, weight:number}}
     *          freq is empty when no stopband is wanted
     * @throws {Error} with a message for the person when the input is unusable
     */
    function readStopband() {
      const raw= parseInt(stop_n_input.value, 10);
      const wanted= Number.isNaN(raw) ? 0 : raw;
      if (wanted<0) {
        throw new Error("number of stopband frequencies must be 0 or more.");
      }
      const stop= { freq: [], real: [], imag: [], target: 10, weight: 0 };
      if (wanted===0) { return stop; }
      if (inputIds_sf.length!==wanted) {
        throw new Error("stopband: press 'parse Table of stopband' first.");
      }
      for (let i=0; i<wanted; i++) {
        const f= parseFloat(document.getElementById(inputIds_sf[i]).value);
        const r= parseFloat(document.getElementById(inputIds_sr[i]).value);
        const x= parseFloat(document.getElementById(inputIds_sx[i]).value);
        if (!Number.isFinite(f) || !Number.isFinite(r) || !Number.isFinite(x)) {
          throw new Error(`stopband: row ${i+1} must be filled in with numbers.`);
        }
        stop.freq[i]= f;
        stop.real[i]= r;
        stop.imag[i]= x;
      }
      stop.target= parseFloat(stop_target_input.value);
      if (!(stop.target>1)) {
        throw new Error("wanted VSWR in stopband must be a number above 1.");
      }
      stop.weight= parseFloat(stop_weight_input.value);
      if (!(stop.weight>=0)) {
        throw new Error("stopband weight must be a number, 0 or more.");
      }
      return stop;
    }
    // " stopband: ..." part of a result line; empty when there is no stopband
    function bandText(item) {
      if (item.stop===null || item.stop===undefined) { return ""; }
      return `  stopband: min vswr=${format1.fvswr(item.stop)}`
           + ` (${rejectionDb(item.stop).toFixed(1)} dB rejected)`;
    }

    const stp_tbody= document.getElementById("stpTableBody");
    const stp_n_input= document.getElementById("stp_n_input");
    stp_n_input.addEventListener("input", ()=> {
      stp_tbody.replaceChildren("");
    });
    let stp_n=1;
// ids stp_table base names
    const Rmin= "Rmin";
    const Rmax= "Rmax";
    const Lmin= "Lmin";
    const Lmax= "Lmax";
    const button_stp_n= document.getElementById("table_stp");
    button_stp_n.addEventListener("click", ()=> {
      stp_tbody.replaceChildren("");
      stp_n= parseInt(stp_n_input.value, 10); 
      console.log("button_stp_n was clicked; stp_n=", stp_n); 
      table_stp_n.addRows(
        "stpTableBody",
        stp_n, 
        Rmin, Rmax,
        Lmin, Lmax
      );
    });
    
    function insertItem(arr, newItem, vswr) {
      let low = 0;
      let high = arr.length;
      let mid = 0;
      while (low<high) {
        mid = Math.floor((low+high)/2);
        if (arr[mid][vswr]< newItem[vswr]) {
          low= mid+1;
        } else {
          high=mid;
        }
      }// while
      arr.splice(low, 0, newItem);
      return arr;
    }
   
    
    function formatNumber(value) {
      return Number.isFinite(value) ? 
          +value.toFixed(2): "NaN";
    }
    
    result_vswr.textContent= `collection: for each click 'calculate' is added best solution after ${k0}-times search \n`;
    
    function updateResult() 
    {
      let vconsole=-1;
      try {
        readCycles();
      } catch (error) {
        explanationArea.value= error.message;
        return;
      }
      let stop;
      try {
        stop= readStopband();
      } catch (error) {
        explanationArea.value= error.message;
        return;
      }
      const Z0=  parseFloat(generatorR.value);
      console.log("updateResult; Z0:", Z0, " f_n:", f_n, " stopband frequencies:", stop.freq.length);
      let frequency_array= [];
      let ZL2_real_array= [];
      let ZL2_imag_array= [];
      for (let i=0; i< f_n; i++) {
        const frequencyInput= document.getElementById(inputIds_f[i]);
        const frequency= parseFloat(frequencyInput.value);
        const load_real= document.getElementById(inputIds_ZL2_real[i]);
        const ZL2_real= parseFloat(load_real.value);
        const load_imag= document.getElementById(inputIds_ZL2_imag[i]);
        const ZL2_imag= parseFloat(load_imag.value); 
        frequency_array[i]= frequency;   
        ZL2_real_array[i]= ZL2_real;
        ZL2_imag_array[i]= ZL2_imag;
        let vtext= `updateResult parsing load; i=${i} ; frequency: ${frequency_array[i]} MHz;`
        vtext+= ` ZL2_real: ${ZL2_real_array[i]} Ω; ZL2_imag: ${ZL2_imag_array[i]} Ω`; 
        console.log(vtext);     
      } //end of for loop over f_n
      let vswr_k=[];
      let z01_k=[];
      let z02_k=[];
      let l01_k=[];
      let l02_k=[];
     
      const { id_rmin, id_rmax, id_lmin, id_lmax}= Ids.ids_stp_n(stp_n);
      
      let k=800;
      explanationArea.value= `top 9 sets of lines from ${k0} sets of lines after last calculation \n`;
      let all=[];
      let targetArr = [];
      let failed= 0;       // number of sets of lines skipped because of an error
      let firstError= "";  // message of the first such error
      for (let k=0; k<k0; k++) {
        vconsole=vconsole+1;
        if (vconsole<1) {
          console.log("updateResult; k=", k, " of ", k0," vconsole=", vconsole);
        }
        if (vconsole>k0-2) { // last cycle only
          console.log("updateResult; k=", k, " of ", k0," vconsole=", vconsole);

        }
        let object1= {};
        let Z01_array= [];
        let length1_array=[];
        let Z02_array=[];
        let length2_array=[];
        let Zin_r_array= [];
        let Zin_x_array= [];
        let vswr_array= [];
        let db_array= [];
        let g_array= [];
        let vswr_max=1;
        let vswr_raw_array= []; // passband VSWR without rounding, for the cost

        for (let j=0; j<stp_n;j++) {
          const {Z01, Z02, length1, length2} = LineLR
            .line1_lr(id_rmin, id_rmax, id_lmin, id_lmax,j,vconsole);
          Z01_array[j]= Z01;
          length1_array[j]= length1;
          Z02_array[j]= Z02;
          length2_array[j]= length2;
          
        } // end of for j
        
        try 
        {
          console.log("   ");
          for (let i=0; i< f_n; i++) 
            {
              
              let frequency= frequency_array[i];
              let ZL2_real= ZL2_real_array[i];
              let ZL2_imag= ZL2_imag_array[i];
              let vtext= `updateResult; i=${i} ; frequency: ${frequency} MHz;`;
              vtext+= ` ZL2_real: ${ZL2_real} Ω; ZL2_imag: ${ZL2_imag} Ω`;
              // console.log(vtext);

              const vswrData= f1.vswr1_db1(
                  Z0, 
                  frequency, ZL2_real, ZL2_imag,
                  vf ,
                  stp_n,
                  Z01_array, Z02_array, length1_array, length2_array,
                  vconsole
              );
              if (!vswrData || vswrData.vswr === Infinity || vswrData.vswr<1.0) {
                throw new Error("updateResult;Invalid vswrData returned from vswr1_db1.");
              }
              vswr_raw_array[i]= vswrData.vswr;
              vswr_array[i]=  format1.fvswr(vswrData.vswr);
              db_array[i]=    format1.fdb(vswrData.db);
              g_array[i]=     format1.fg(vswrData.gamma);
              Zin_r_array[i]= format1.fzin_r(vswrData.Zin_parallel.real);
              Zin_x_array[i]= format1.fzin_x(vswrData.Zin_parallel.imag);
              
             if (vconsole<1) {
                console.log("updateResult; vswr:", vswr_array[i]," |Γ|:",g_array[i]," db:", db_array[i]);
                console.log(" ");
              }          
            } //end of for loop over f_n

            vswr_max= Math.max(...vswr_array);

            // stopband: the same set of lines is judged at the stopband
            // frequencies too (there a HIGH vswr is the wanted result)
            const stop_vswr_array= [];
            for (let i=0; i< stop.freq.length; i++) {
              const stopData= f1.vswr1_db1(
                  Z0,
                  stop.freq[i], stop.real[i], stop.imag[i],
                  vf ,
                  stp_n,
                  Z01_array, Z02_array, length1_array, length2_array,
                  vconsole
              );
              if (!stopData) {
                throw new Error("updateResult;Invalid stopband data returned from vswr1_db1.");
              }
              stop_vswr_array[i]= limitStopVswr(stopData.vswr);
            }
            const score= candidateCost(
                vswr_raw_array, stop_vswr_array, stop.target, stop.weight);

            vswr_k[k]=vswr_max;
            z01_k[k]= Z01_array;
            z02_k[k]= Z02_array;
            l01_k[k]= length1_array;
            l02_k[k]= length2_array;

            object1.vswr=vswr_max;     // worst passband vswr
            object1.stop= score.stopMin; // lowest stopband vswr, null without stopband
            object1.cost= score.cost;  // what the sorting is based on
            object1.z01= Z01_array;
            object1.z02= Z02_array;
            object1.l01=length1_array;
            object1.l02=length2_array;
            all.push(object1);
            // a set of lines goes into the sorted list only after it was
            // calculated without error (all[k] is not reliable: a skipped
            // set leaves no entry in all, so the indexes shift)
            insertItem(targetArr, object1, "cost");
        } //end of try
        catch (error) {
          // skip this set of lines and go on with the next one
          failed++;
          if (firstError==="") { firstError= error.message; }
          continue;
        }// end of catch
        
      } //end of k

      if (targetArr.length===0) { // every set of lines failed: nothing to show
        result_vswr.textContent+= `parallel_vswr;Error of calculations .\n`;
        explanationArea.value+= `${firstError}\n`;
        return;
      }
      if (failed>0) {
        explanationArea.value+= `${failed} of ${k0} sets of lines were skipped because of an error: ${firstError}\n`;
      }

      k=0;
      const stopK = 9;
      targetArr.some((array_all, k) => {
        const vswr_p= document.createElement("p");
        explanationArea.value+= `---vswr=${array_all.vswr}${bandText(array_all)}---\n`;

        vswr_p.textContent= `---vswr=${array_all.vswr}---`;
        vswr_p.style.lineHeight=".1rem";
        array_all.z01.forEach((num,n)=> {
          let text_p= `Z01[${n+1}]= ${array_all.z01[n].toFixed(1)} L01[${n+1}]= ${array_all.l01[n].toFixed(1)} `;
            text_p+= ` ZO2[${n+1}]= ${array_all.z02[n].toFixed(1)} L02[${n+1}]= ${array_all.l02[n].toFixed(1)}`;
          explanationArea.value+= `${text_p}\n`; 
          const line_p= document.createElement("p");
          line_p.textContent= text_p;
          line_p.style.lineHeight= ".01"; // Adjust the line height as needed
        });
        return k === stopK; // Stop the loop when k reaches stopK
      });// end of some
     
      const spaces = " ".repeat(3);
      result_vswr.textContent+= `\n`;
      const vswr_p=document.createElement("p");
      vswr_p.textContent= `vswr=${targetArr[0].vswr}${bandText(targetArr[0])}\n`;
      vswr_p.style.lineHeight=".1rem";
      result_vswr.appendChild(vswr_p);
      // result_vswr.textContent+= `vswr=${all[0].vswr}\n`;
      targets0.push(targetArr[0]);
      targetArr[0].z01.forEach((num,n)=> {
        let text_p= `Z01[${n+1}]= ${num.toFixed(1)} L01[${n+1}]= ${targetArr[0].l01[n].toFixed(1)} `;
        text_p+= ` ZO2[${n+1}]= ${targetArr[0].z02[n].toFixed(1)} L02[${n+1}]= ${targetArr[0].l02[n].toFixed(1)}`;
        const line_p= document.createElement("p");
        line_p.textContent= text_p;
        line_p.style.lineHeight= ".01"; // Adjust the line height as needed
        result_vswr.appendChild(line_p);
        result_vswr.textContent+=`\n`;
      });     

    } //end of updateResult
    
    // The search runs synchronously and freezes the page, so the button is
    // switched to its "calculating…" state first and the browser gets one
    // frame to draw it before the search starts.
    const calculateButton= document.getElementById("recalculate");
    const calculateLabel= calculateButton.textContent.trim();
    let calculating= false;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (calculating) { return; }
      calculating= true;
      calculateButton.disabled= true;
      calculateButton.classList.add("is-calculating");
      calculateButton.textContent= "calculating…";
      await new Promise((resolve)=> requestAnimationFrame(()=> setTimeout(resolve, 0)));
      try {
        updateResult();
      } finally {
        calculateButton.textContent= calculateLabel;
        calculateButton.classList.remove("is-calculating");
        calculateButton.disabled= false;
        calculating= false;
      }
    });

});