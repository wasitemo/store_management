function convertionToNumber(value) {
  if (value.includes(".") || value.includes(",")) {
    let newValue = value.replaceAll(".", "").replaceAll(",", "");
    let parsed = parseFloat(newValue);

    if (!isNaN(parsed)) {
      return (value = parsed);
    }
  } else {
    return parseFloat(value);
  }
}

export default convertionToNumber;
