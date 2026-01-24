function convertionToDecimal(value) {
  if (value.includes(",")) {
    let newValue = value.replace(",", ".");
    let parsed = parseFloat(newValue);

    if (!isNaN(parsed)) {
      return (value = parsed);
    }
  } else {
    return parseFloat(value);
  }
}

export default convertionToDecimal;
