class table_stp_n {
    static addRows(
      id="stpTableBody",
      stp_n,
      base_rmin,
      base_rmax,
      base_lmin,
      base_lmax
    ) {
        const tbody= document.getElementById(id);
        let rowHTML= "";
        for (let i=1; i<=stp_n; i++) {
          rowHTML+=`
            <tr>
              <td rowspan="2">${i}</td>
          `;
          for (let j=1; j<=2; j++) {
            rowHTML+=`
              <td>${j}</td>
              <td><input type="number" onwheel="this.blur()"
                id="${base_rmin}${i}${j}" value="20.0" step="any" required> </td>
              <td><input type="number"  onwheel="this.blur()"
                id="${base_rmax}${i}${j}" value="100.0" step="any" required> </td>
              <td><input type="number" onwheel="this.blur()"
                id="${base_lmin}${i}${j}" value="40.0" step="any" required> </td>
              <td><input type="number" onwheel="this.blur()"
                id="${base_lmax}${i}${j}" value="80.0" step="any" required> </td>
            </tr>
            `;
          }
        }
        
        tbody.insertAdjacentHTML('beforeend', rowHTML);
          return { };
      }

}
    
  export { table_stp_n };
  
  