const express = require("express");
const { scheduleInterview } = require("../controllers/interviewController");
const router = express.Router();


router.post("/start", scheduleInterview); 

module.exports = router;
