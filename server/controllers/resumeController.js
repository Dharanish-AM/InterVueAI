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
    const resumeFileName = path.basename(resumePath);

    let resume = await Resume.findOne({ userId });

    if (resume) {
      if (
        resume.resumeUrl &&
        fs.existsSync(path.join(path.dirname(resumePath), resume.resumeUrl))
      ) {
        try {
          fs.unlinkSync(path.join(path.dirname(resumePath), resume.resumeUrl));
          console.log(`🗑️ Deleted old resume: ${resume.resumeUrl}`);
        } catch (err) {
          console.error(`⚠️ Failed to delete old resume: ${err.message}`);
        }
      }

      resume.resumeUrl = path
        .relative(path.join(__dirname, "../uploads"), resumePath)
        .replace(/\\/g, "/");
      resume.resumeUrl = `uploads/${resume.resumeUrl}`;
      resume.uploadedAt = new Date();
      resume.parsedData = {};
    } else {
      resume = new Resume({
        userId,
        resumeUrl: path
          .relative(path.join(__dirname, "../uploads"), resumePath)
          .replace(/\\/g, "/"),
        uploadedAt: new Date(),
      });
      resume.resumeUrl = `uploads/${resume.resumeUrl}`;
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

      console.log(aiResponse.data.data);

      const parsedData = aiResponse.data?.data || {};

      resume.parsedData = parsedData;
      await resume.save();

      res.status(200).json({
        message: "Resume uploaded and parsed successfully.",
        filePath: resume.resumeUrl,
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

async function viewResume(req, res) {
  try {
    const { resumeId } = req.query;
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found." });
    }
    const filePath = path.join(__dirname, "../", resume.resumeUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found." });
    }
    return res.sendFile(filePath);
  } catch (error) {
    console.error("Error viewing resume:", error);
    return res
      .status(500)
      .json({ message: "Server error during resume retrieval." });
  }
}

module.exports = { uploadResume, viewResume };
