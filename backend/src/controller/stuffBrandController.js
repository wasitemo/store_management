import ErrorMessage from "../error/ErrorMessage.js";
import {
  showStuffBrand,
  showStuffBrandById,
  showTotalStuffBrand,
  newStuffBrand,
  editStuffBrand,
} from "../service/stuffBrandService.js";

async function presentStuffBrand(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalStuffBrand();
    const result = await showStuffBrand(limit, offset);

    return res.status(200).json({
      status: 200,
      page,
      limit,
      total_data: parseInt(total.count),
      total_page: Math.ceil(total.count / limit),
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function presentStuffBrandById(req, res, next) {
  try {
    let stuffBrandId = parseInt(req.params.stuff_brand_id);
    const result = await showStuffBrandById(stuffBrandId);

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function saveStuffBrand(req, res, next) {
  try {
    let stuffBrandName = req.body.stuff_brand_name;
    if (!stuffBrandName) {
      throw new ErrorMessage("Missing required key stuff_brand_name", 400);
    }

    stuffBrandName = stuffBrandName.trim();
    await newStuffBrand(stuffBrandName);
    return res.status(201).json({
      status: 201,
      message: "Success added stuff brand data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function changeStuffBrand(req, res, next) {
  try {
    let stuffBrandId = parseInt(req.params.stuff_brand_id);
    let stuffBrandName = req.body.stuff_brand_name;

    if (!stuffBrandName) {
      throw new ErrorMessage("Missing required key: stuff_brand_name", 400);
    }

    stuffBrandName = stuffBrandName.trim();
    await editStuffBrand(stuffBrandName, stuffBrandId);
    return res.status(200).json({
      status: 200,
      message: "Succes updated stuff brand data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export {
  presentStuffBrand,
  presentStuffBrandById,
  saveStuffBrand,
  changeStuffBrand,
};
