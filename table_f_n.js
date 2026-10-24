class table_f_n {
  static addRows(
    id,
    f_n,
    base_id_f,
    base_id_r,
    base_id_x,
  ) {
    console.log("addRows to id=", id, " f_n=", f_n);
    const tbody= document.getElementById(id);
    let id_array_f = [];
    let id_array_r = [];
    let id_array_x = [];
    
    for (let i=0; i< f_n; i++) {
      id_array_f.push(`${base_id_f}${i+1}`);
      id_array_r.push(`${base_id_r}${i+1}`);
      id_array_x.push(`${base_id_x}${i+1}`);
      // console.log(i,id_array_f[i], id_array_r[i], id_array_x[i]);
    // avoid altering number while scrolling
      const rowHTML= `<tr>
        <td><input type="number" onwheel="this.blur()"
          id="${id_array_f[i]}" value="frequence"  step="any"  required />
        </td>
        <td><input type="number" 
          id="${id_array_r[i]}" value="real of ZL"  step="any" required />
        </td>
        <td><input type="number" 
          id="${id_array_x[i]}" value="imag of ZL"  step="any" required />
        </td>
      </tr>`;
      tbody.insertAdjacentHTML('beforeend', rowHTML);
    }
  
    return {
        id_array_f:id_array_f,
        id_array_r:id_array_r,
        id_array_x:id_array_x,
    };
  }
}

export { table_f_n };
