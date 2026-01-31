import fs from "fs";

function safeUnlink(path) {
  try {
    if (path && fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export default safeUnlink;
