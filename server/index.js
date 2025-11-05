const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/user", require("./routes/userRoutes"));
app.use("/resume", require("./routes/resumeRoutes"));
app.use("/interview", require("./routes/interviewRoutes"));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
