import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function parseResume(file) {
  try {
    let text = "";

    if (file.type === "application/pdf") {
      text = await parsePDF(file);
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      text = await parseDocx(file);
    } else {
      throw new Error(
        "Unsupported file type. Please upload PDF or DOCX files only."
      );
    }

    return extractResumeData(text);
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
}

async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    text += textContent.items.map((item) => item.str).join(" ") + "\n";
  }

  return text;
}

async function parseDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

function extractResumeData(text) {
  const cleanText = text.replace(/\s+/g, " ").trim();

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatches = cleanText.match(emailRegex);
  const email = emailMatches ? emailMatches[0] : "";

  const phoneRegex =
    /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phoneMatches = cleanText.match(phoneRegex);
  const phone = phoneMatches ? phoneMatches[0].replace(/\D/g, "") : "";

  const lines = text.split("\n").filter((line) => line.trim());
  const excludeKeywords = [
    "resume",
    "cv",
    "curriculum vitae",
    "email",
    "phone",
    "address",
    "@",
  ];
  let name = "";

  for (const line of lines.slice(0, 5)) {
    const trimmedLine = line.trim();
    if (
      trimmedLine &&
      trimmedLine.length > 2 &&
      trimmedLine.length < 50 &&
      !excludeKeywords.some((keyword) =>
        trimmedLine.toLowerCase().includes(keyword)
      ) &&
      !/^\d+/.test(trimmedLine) &&
      /^[A-Za-z\s.'-]+$/.test(trimmedLine)
    ) {
      name = trimmedLine;
      break;
    }
  }

  const skillsSections = [
    "skills",
    "technical skills",
    "technologies",
    "programming languages",
  ];
  let skills = [];

  for (const section of skillsSections) {
    const regex = new RegExp(
      `${section}[:\\s]*([^\\n]*(?:\\n[^\\n]*){0,5})`,
      "gi"
    );
    const match = cleanText.match(regex);
    if (match && match[0]) {
      const skillText = match[0]
        .replace(new RegExp(section, "gi"), "")
        .replace(/[:]/g, "");
      skills = skillText
        .split(/[,\n•·]/)
        .map((s) => s.trim())
        .filter((s) => s && s.length > 1);
      break;
    }
  }

  const experienceKeywords = ["years", "experience", "year"];
  let experience = "";

  for (const keyword of experienceKeywords) {
    const regex = new RegExp(`(\\d+)\\+?\\s*${keyword}`, "gi");
    const match = cleanText.match(regex);
    if (match && match[0]) {
      experience = match[0];
      break;
    }
  }

  return {
    name: name || "",
    email: email || "",
    phone: phone || "",
    skills: skills.slice(0, 10),
    experience: experience || "",
    rawText: text.slice(0, 2000),
    parsedAt: new Date().toISOString(),
  };
}

export function validateResumeData(data) {
  const errors = [];

  if (!data.name || data.name.length < 2) {
    errors.push("Name is required and must be at least 2 characters long");
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push("Valid email address is required");
  }

  if (!data.phone || data.phone.length < 10) {
    errors.push("Valid phone number is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
