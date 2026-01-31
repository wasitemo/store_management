function excelDateToJsDate(serial) {
  const excelPoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(excelPoch.getTime() + serial * 86400000);

  return date.toISOString().split("T")[0];
}

export default excelDateToJsDate;
