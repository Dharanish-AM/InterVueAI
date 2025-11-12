const express = require("express");
const { uploadResume ,viewResume} = require("../controllers/resumeController");
const upload = require("../middleware/upload");
const router = express.Router();

router.post("/upload/:userId", upload.single("resume"), uploadResume);
router.get("/", viewResume);

module.exports = router;
