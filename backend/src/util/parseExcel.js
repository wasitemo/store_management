import XLSX from "xlsx";
import excelDateToJsDate from "./excelDateToJsDate.js";
import ErrorMessage from "../error/ErrorMessage.js";

async function parseExcel(filePath) {
  try {
    const workBook = XLSX.readFile(filePath);
    const sheet = workBook.SheetNames[0];
    if (!sheet) {
      throw new ErrorMessage("No sheets found in excel file", 404);
    }
    const workSheet = workBook.Sheets[sheet];
    const jsonData = XLSX.utils.sheet_to_json(workSheet);

    const formattedData = jsonData.map((row, index) => {
      const formattedRow = {};

      for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.toLowerCase();
        if (typeof value === "number" && lowerKey.includes("date")) {
          formattedRow[key] = excelDateToJsDate(value);
        } else {
          formattedRow[key] = value;
        }
      }

      return formattedRow;
    });

    return formattedData;
  } catch (err) {
    console.log(err);
    throw new ErrorMessage(err.message, 400);
  }
}

export default parseExcel;
