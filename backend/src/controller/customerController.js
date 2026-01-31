import ErrorMessage from "../error/ErrorMessage.js";
import {
  showCustomer,
  showCustomerById,
  showTotalCustomer,
  newCustomer,
  editCustomer,
} from "../service/customerSevice.js";

async function presentCustomer(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalCustomer();
    const result = await showCustomer(limit, offset);

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

async function presentCustomerById(req, res, next) {
  try {
    let customerId = parseInt(req.params.customer_id);
    const result = await showCustomerById(customerId);

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function saveCustomer(req, res, next) {
  try {
    let { customer_name, customer_contact, customer_address } = req.body;

    if (!customer_name) {
      throw new ErrorMessage(`Missing required key: ${customer_name}`);
    }

    if (!customer_contact) {
      throw new ErrorMessage(`Missing required key: ${customer_contact}`);
    }

    if (!customer_address) {
      throw new ErrorMessage(`Missing required key: ${customer_address}`);
    }

    customer_name = customer_name.trim();
    customer_contact = customer_contact.trim();
    customer_address = customer_address.trim();

    await newCustomer(customer_name, customer_contact, customer_address);
    return res.status(201).json({
      status: 201,
      message: "Success added customer data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function changeCustomer(req, res, next) {
  try {
    let customerId = parseInt(req.params.customer_id);
    let update = req.body;
    const fields = ["customer_name", "customer_contact", "customer_address"];
    const invalidField = Object.keys(update).filter((k) => !fields.includes(k));

    if (invalidField.length > 0) {
      throw new ErrorMessage(
        `Missing required key: ${invalidField.join(", ")}`,
        400,
      );
    }

    for (let v in update) {
      if (typeof update[v] === "string") {
        update[v] === update[v].trim();
      }

      if (v === "customer_contact" && update[v].length > 13) {
        throw new ErrorMessage(
          "Customer contact cannot exceed 13 characters",
          400,
        );
      }
    }

    await editCustomer(update, customerId);
    return res.status(200).json({
      status: 200,
      message: "Success updated customer data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export { presentCustomer, presentCustomerById, saveCustomer, changeCustomer };
