import ErrorMessage from "../error/ErrorMessage.js";
import {
  showStuffCategory,
  showStuffCategoryById,
  showTotalStuffCategory,
  newStuffCategory,
  editStuffCategory,
} from "../service/stuffCategoryService.js";

async function presentStuffCategory(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalStuffCategory();
    const result = await showStuffCategory(limit, offset);

    return res.status(200).json({
      status: 200,
      page,
      limit,
      total_data: parseInt(total.count),
      total_page: Math.round(total.count / limit),
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function presentStuffCategoryById(req, res, next) {
  try {
    let stuffCategoryId = parseInt(req.params.stuff_category_id);
    const result = await showStuffCategoryById(stuffCategoryId);

    res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function saveStuffCategory(req, res, next) {
  try {
    let stuffCategoryName = req.body.stuff_category_name;
    if (!stuffCategoryName) {
      throw new ErrorMessage("Missing required key: stuff_category_name");
    }

    stuffCategoryName = stuffCategoryName.trim();
    await newStuffCategory(stuffCategoryName);
    return res.status(201).json({
      status: 201,
      message: "Success added stuff category data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function changeStuffCategory(req, res, next) {
  try {
    let stuffCategoryId = parseInt(req.params.stuff_category_id);
    let stuffCategoryName = req.body.stuff_category_name;

    if (!stuffCategoryName) {
      throw new ErrorMessage("Missing required key: stuff_category_name");
    }

    stuffCategoryName = stuffCategoryName?.trim();

    await editStuffCategory(stuffCategoryName, stuffCategoryId);
    return res.status(200).json({
      status: 200,
      message: "Success updated stuff category data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export {
  presentStuffCategory,
  presentStuffCategoryById,
  saveStuffCategory,
  changeStuffCategory,
};
