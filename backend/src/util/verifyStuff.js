import ErrorMessage from "../error/ErrorMessage.js";
import { findStuffInfo } from "../model/stuffInfoModel.js";

async function verifyStuff(warehouseId, item) {
  let identifiers = [
    { key: "imei_1", value: item.imei_1 },
    { key: "imei_2", value: item.imei_2 },
    { key: "sn", value: item.sn },
    { key: "barcode", value: item.barcode },
  ].filter((i) => i.value);

  if (!identifiers.length)
    throw new Error("No validated imei/sn provided for item");

  let stuffInfoId = null;
  let errors = [];

  for (let id of identifiers) {
    if (typeof id.value === "string") {
      id.value = id.value.trim();
    }

    let result = await findStuffInfo(warehouseId, id.value);

    if (!result) {
      errors.push(`${id.key}: "${id.value}" not registered`);
      continue;
    }

    if (result.stock_status !== "ready") {
      errors.push(`${id.key}: "${id.value}" already "${result.stock_status}"`);
      continue;
    }

    if (stuffInfoId && stuffInfoId !== result.stuff_information_id) {
      errors.push("Inconsistent identifiers detected");
    }

    stuffInfoId = result.stuff_information_id;
  }

  if (errors.length) {
    throw new ErrorMessage(errors.join(" | "), 409);
  }

  return { stuff_information_id: stuffInfoId };
}

export default verifyStuff;
