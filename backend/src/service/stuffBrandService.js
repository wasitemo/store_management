import ErrorMessage from "../error/ErrorMessage.js";
import {
  getStuffBrand,
  getStuffBrandById,
  getTotalStuffBrand,
  addStuffBrand,
  updateStuffBrand,
} from "../model/stuffBrandModel.js";

async function showStuffBrand(limit, offset) {
  const result = await getStuffBrand(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Stuff brand not found", 404);
  }

  return result;
}

async function showStuffBrandById(stuffBrandId) {
  const result = await getStuffBrandById(stuffBrandId);
  if (!result) {
    throw new ErrorMessage("Stuff brand not found", 404);
  }

  return result;
}

async function showTotalStuffBrand() {
  const result = await getTotalStuffBrand();
  if (!result) {
    throw new ErrorMessage("Stuff brand not found", 404);
  }

  return result;
}

async function newStuffBrand(stuffBrandName) {
  await addStuffBrand(stuffBrandName);
}

async function editStuffBrand(stuffBrandName, stuffBrandId) {
  const existingStuffBrand = await getStuffBrandById(stuffBrandId);
  if (!existingStuffBrand) {
    throw new ErrorMessage("Stuff brand data not found", 404);
  }

  await updateStuffBrand(stuffBrandName, stuffBrandId);
}

export {
  showStuffBrand,
  showStuffBrandById,
  showTotalStuffBrand,
  newStuffBrand,
  editStuffBrand,
};
