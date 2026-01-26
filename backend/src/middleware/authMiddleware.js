import ErrorMessage from "../error/ErrorMessage.js";
import { verifyAccessToken } from "../util/handleToken.js";

function authentication(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new ErrorMessage("Authorization header not found", 404);
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new ErrorMessage("Access token required", 401);
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.log(err);
    throw new ErrorMessage("Token no longer valid", 401);
  }
}

export default authentication;
