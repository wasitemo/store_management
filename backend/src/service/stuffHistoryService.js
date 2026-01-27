import ErrorMessage from "../error/ErrorMessage.js";
import {
  getStuffHistory,
  getTotalStuffHistory,
} from "../model/stuffHistoryModel.js";

async function showStuffHistory(limit, offer) {
  const result = await getStuffHistory(limit, offer);
  if (result.length === 0) {
    throw new ErrorMessage("Stuff history data not found", 404);
  }

  return result;
}

async function showTotalStuffHistory(limit, offer) {
  const result = await getTotalStuffHistory();
  if (!result) {
    throw new ErrorMessage("Stuff history data not found", 404);
  }

  return result;
}

export { showStuffHistory, showTotalStuffHistory };
