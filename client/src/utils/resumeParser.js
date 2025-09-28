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
  const textPromises = Array.from({ length: pdf.numPages }, (_, i) =>
    pdf.getPage(i + 1).then((page) => page.getTextContent())
  );

  const pages = await Promise.all(textPromises);
  return pages
    .map((page) => page.items.map((item) => item.str).join(" "))
    .join("\n");
}

async function parseDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

function extractResumeData(text) {
  const cleanText = text.replace(/\s+/g, " ").trim();

  // Extract email
  const emailMatch = cleanText.match(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  );
  const email = emailMatch ? emailMatch[0] : "";

  // Extract phone and keep only last 10 digits
  const phoneMatch = cleanText.match(
    /(\+?\d{1,3}[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/
  );
  let phone = phoneMatch ? phoneMatch[0].replace(/\D/g, "") : "";
  if (phone.length > 10) {
    phone = phone.slice(-10);
  }

  // Extract name efficiently from first 10 lines
  const lines = text
    .split("\n")
    .slice(0, 10)
    .map((line) => line.trim())
    .filter(Boolean);
  const excludeKeywords = [
    "resume",
    "cv",
    "curriculum vitae",
    "email",
    "phone",
    "address",
    "@",
  ];
  const name =
    lines.find(
      (line) =>
        line.length > 2 &&
        line.length < 50 &&
        !excludeKeywords.some((kw) => line.toLowerCase().includes(kw)) &&
        !/^\d+/.test(line) &&
        /^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/.test(line)
    ) || "";

  // Extract skills
  const skillsSections = [
    "skills",
    "technical skills",
    "technologies",
    "programming languages",
  ];
  let skills = [];
  const lowerText = cleanText.toLowerCase();
  for (const section of skillsSections) {
    const idx = lowerText.indexOf(section);
    if (idx !== -1) {
      const snippet = cleanText.slice(
        idx + section.length,
        idx + section.length + 200
      );
      skills = snippet
        .split(/[,\n•·]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1);
      break;
    }
  }

  // Extract experience
  const experienceMatch = cleanText.match(
    /(\d+)\+?\s*(years|year|experience)/i
  );
  const experience = experienceMatch ? experienceMatch[0] : "";

  return {
    name,
    email,
    phone,
    skills: skills,
    experience,
    rawText: text,
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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
