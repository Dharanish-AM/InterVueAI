const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/resume", require("./routes/resumeRoutes"));
app.use("/api/interview", require("./routes/interviewRoutes"));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
