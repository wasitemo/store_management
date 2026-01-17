import ErrorMessage from "../error/ErrorMessage.js";
import {
  getStuffCategory,
  getStuffCategoryById,
  getTotalStuffCategory,
  addStuffCategory,
  updateStuffCategory,
} from "../model/stuffCategoryModel.js";

async function showStuffCategory(limit, offset) {
  const result = await getStuffCategory(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Stuff category data not found", 404);
  }

  return result;
}

async function showStuffCategoryById(stuffCategoryId) {
  const result = await getStuffCategoryById(stuffCategoryId);
  if (!result) {
    throw new ErrorMessage("Stuff category data not found", 404);
  }

  return result;
}

async function showTotalStuffCategory() {
  const result = await getTotalStuffCategory();
  if (!result) {
    throw new ErrorMessage("Stuff category data not found", 404);
  }

  return result;
}

async function newStuffCategory(stuffCategoryName) {
  await addStuffCategory(stuffCategoryName);
}

async function editStuffCategory(stuffCategoryName, stuffCategoryId) {
  const existingStuffCategory = await getStuffCategoryById(stuffCategoryId);
  if (!existingStuffCategory) {
    throw new ErrorMessage("Stuff category data not found", 404);
  }

  await updateStuffCategory(stuffCategoryName, stuffCategoryId);
}

export {
  showStuffCategory,
  showStuffCategoryById,
  showTotalStuffCategory,
  newStuffCategory,
  editStuffCategory,
};
