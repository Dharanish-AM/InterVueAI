const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const Resume = require("../models/Resume");
const User = require("../models/User");

async function uploadResume(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "User not found." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const resumePath = req.file.path;

    let resume = await Resume.findOne({ userId });

    if (resume) {
      if (resume.resumeUrl && fs.existsSync(resume.resumeUrl)) {
        fs.unlinkSync(resume.resumeUrl);
      }
      resume.resumeUrl = resumePath;
      resume.uploadedAt = new Date();
    } else {
      resume = new Resume({
        userId,
        resumeUrl: resumePath,
        uploadedAt: new Date(),
      });
    }

    await resume.save();

    try {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(resumePath));

      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/api/resume/parse`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      console.log(aiResponse.data.data)

      const parsedData = aiResponse.data?.data || {};

      resume.parsedData = parsedData;
      await resume.save();

      res.status(200).json({
        message: "Resume uploaded and parsed successfully.",
        filePath: resumePath,
        parsedData,
      });
    } catch (aiError) {
      console.error("AI parsing error:", aiError.message);

      if (fs.existsSync(resumePath)) {
        fs.unlinkSync(resumePath);
      }

      return res.status(500).json({
        message: "Resume parsing failed. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error uploading resume:", error);
    res.status(500).json({ message: "Server error during resume upload." });
  }
}

module.exports = { uploadResume };
