import ErrorMessage from "../error/ErrorMessage.js";
import {
  showSupplier,
  showSupplierById,
  showTotalSupplier,
  newSupplier,
  editSupplier,
} from "../service/supplierService.js";

async function presentSupplier(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 1;
    let offset = (page - 1) * limit;
    let total = await showTotalSupplier();
    const result = await showSupplier(limit, offset);

    console.log(total);
    return res.status(200).json({
      status: 200,
      page,
      limit,
      totalData: parseInt(total.count),
      totalPage: Math.round(total.count / limit),
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function presentSupplierById(req, res, next) {
  try {
    let supplierId = parseInt(req.params.supplier_id);
    const result = await showSupplierById(supplierId);

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function saveSupplier(req, res, next) {
  try {
    let { supplier_name, supplier_contact, supplier_address } = req.body;

    if (!supplier_name) {
      throw new ErrorMessage("Missing required key: supplier_name", 400);
    }

    if (!supplier_contact) {
      throw new ErrorMessage("Missing required key: supplier_contact", 400);
    }

    if (supplier_contact.length > 13) {
      throw new ErrorMessage(
        "Supplier contact cannot exceed 13 characters",
        400
      );
    }

    if (!supplier_address) {
      throw new ErrorMessage("Missing required key: supplier_address", 400);
    }

    supplier_name = supplier_name.trim();
    supplier_contact = supplier_contact.trim();
    supplier_address = supplier_address.trim();

    await newSupplier(supplier_name, supplier_contact, supplier_address);
    return res.status(201).json({
      status: 201,
      message: "Success added supplier data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function changeSupplier(req, res, next) {
  try {
    let supplierId = parseInt(req.params.supplier_id);
    let update = req.body;
    let fields = ["supplier_name", "supplier_contact", "supplier_address"];
    let invalidField = Object.keys(update).filter((k) => !fields.includes(k));

    if (invalidField.length > 0) {
      throw new ErrorMessage(
        `Missing required key: ${invalidField.join(", ")}`
      );
    }

    for (let k in update) {
      if (typeof update[k] === "string") {
        update[k] = update[k].trim();
      }

      if (k === "supplier_contact" && update[k].length > 13) {
        throw new ErrorMessage(
          "Supplier contact cannot exceed 13 characters",
          400
        );
      }
    }

    await editSupplier(update, supplierId);
    return res.status(200).json({
      status: 200,
      message: "Success updated supplier data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export { presentSupplier, presentSupplierById, saveSupplier, changeSupplier };
