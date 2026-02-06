function convertionToNumber(value) {
  let strValue = String(value);

  if (strValue.includes(".") || strValue.includes(",")) {
    let newValue = strValue.replaceAll(".", "").replaceAll(",", "");
    let parsed = parseFloat(newValue);

    if (!isNaN(parsed)) {
      return (value = parsed);
    }
  } else {
    return parseFloat(strValue);
  }
}

export default convertionToNumber;
