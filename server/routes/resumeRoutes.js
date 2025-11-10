const express = require("express");
const { uploadResume } = require("../controllers/resumeController");
const upload = require("../middleware/upload");
const router = express.Router();

router.post("/upload/:userId", upload.single("resume"), uploadResume);

module.exports = router;
