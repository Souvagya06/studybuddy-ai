import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";
import pptx2json from "pptx2json";
import multer from "multer";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require2 = createRequire(import.meta.url);
const { CloudinaryStorage } = require2("multer-storage-cloudinary");

// ===============================
// Cloudinary Setup
// ===============================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
import { createClient } from "@libsql/client";
import session from "express-session";
import { google } from "googleapis";

// ===============================
// Fix for __dirname in ES modules
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// Initialize app
// ===============================
const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// Session Setup
// ===============================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "studybuddy-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// ===============================
// Middleware
// ===============================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "../public")));

// serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ===============================
// Database Setup
// ===============================

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_TOKEN
});

console.log("✅ Connected to Turso database");

await db.execute(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

await db.execute(`
CREATE TABLE IF NOT EXISTS uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  filename TEXT,
  filepath TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
)
`);

console.log("✅ Users & Uploads tables ready");
// ===============================
// Doubts - Create DB Tables
// ===============================
await db.execute(`
CREATE TABLE IF NOT EXISTS doubt_chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
)
`);

await db.execute(`
CREATE TABLE IF NOT EXISTS doubt_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(chat_id) REFERENCES doubt_chats(id)
)
`);

console.log("✅ Doubt chat tables ready");



// ===============================
// Multer + Cloudinary Storage
// ===============================
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const userId = req.session.user?.id || "unknown";
    return {
      folder: `studybuddy/${userId}`,
      resource_type: "auto",
      public_id: Date.now() + "-" + file.originalname.replace(/\s+/g, "_"),
    };
  },
});

const upload = multer({ storage });

//================================
// Helper function to extract text
//================================
async function extractTextFromFile(buffer, filename) {

  try {

    let text = "";

    // =============================
    // PDF FILE
    // =============================
    if (filename.toLowerCase().endsWith(".pdf")) {

      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;

      for (let i = 1; i <= pdf.numPages; i++) {

        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        const strings = content.items.map(item => item.str);

        text += strings.join(" ") + "\n";
      }

      return text;
    }

    // =============================
    // PPTX FILE
    // =============================
    else if (filename.toLowerCase().endsWith(".pptx")) {

      const slides = await pptx2json(buffer);

      if (!slides || !slides.slides) {
        return "No text found in PPTX";
      }

      slides.slides.forEach(slide => {

        if (slide.shapes) {

          slide.shapes.forEach(shape => {

            if (shape.text) {
              text += shape.text + "\n";
            }

          });

        }

      });

      return text;
    }

    // =============================
    // UNSUPPORTED FILE
    // =============================
    else {

      return "Unsupported file type";

    }

  } catch (err) {

    console.error("File text extraction error:", err);
    return "Failed to extract text from file";

  }

}

// ===============================
// Google OAuth Setup
// ===============================
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// ===============================
// Test Route
// ===============================
app.get("/api/test", (req, res) => {
  res.json({ message: "Server and Turso DB working perfectly 🚀" });
});

// ===============================
// Signup Route
// ===============================
app.post("/api/signup", async (req, res) => {

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.send("All fields are required.");
  }

  try {

    const result = await db.execute({
      sql: "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      args: [name, email, password]
    });

    req.session.user = {
      id: Number(result.lastInsertRowid),
      name,
      email
    };

    req.session.save((err) => {
      if (err) console.error("Session save error:", err);
      res.redirect("/home.html");
    });

  } catch (error) {

    res.redirect("/login.html?error=userexists&tab=signup");

  }

});

// ===============================
// Login Route
// ===============================
app.post("/api/login", async (req, res) => {

  const { email, password } = req.body;

  const result = await db.execute({
    sql: "SELECT * FROM users WHERE email = ? AND password = ?",
    args: [email, password]
  });

  const user = result.rows[0];

  if (user) {

    req.session.user = {
      id: Number(user.id),
      name: user.name,
      email: user.email
    };

    req.session.save((err) => {
      if (err) console.error("Session save error:", err);
      res.redirect("/home.html");
    });

  } else {

    res.redirect("/login.html?error=nouser&tab=login");

  }

});

// ===============================
// Google Login Route
// ===============================
app.get("/auth/google", (req, res) => {

  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
    "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
    "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
    "https://www.googleapis.com/auth/classroom.announcements.readonly"
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "select_account"
  });

  res.redirect(url);

});

// ===============================
// Google Callback Route
// ===============================
app.get("/auth/google/callback", async (req, res) => {

  try {

    const code = req.query.code;

    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      version: "v2",
      auth: oauth2Client
    });

    const { data } = await oauth2.userinfo.get();

    console.log("Google login:", data.email);

    // check if user already exists
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [data.email]
    });

    let user = result.rows[0];

    if (!user) {

      const insert = await db.execute({
        sql: "INSERT INTO users (name,email,password) VALUES (?,?,?)",
        args: [data.name, data.email, "google"]
      });

      user = {
        id: Number(insert.lastInsertRowid),
        name: data.name,
        email: data.email
      };

    }

    req.session.user = user;
    req.session.tokens = tokens;

    res.redirect("/dashboard");

  } catch (err) {

    console.error("OAuth Error:", err);
    res.send("Google authentication failed");

  }

});

// ===============================
// Protected Dashboard Route
// ===============================
app.get("/dashboard", (req, res) => {

  if (!req.session.user) {
    return res.redirect("/auth/google");
  }

  res.sendFile(path.join(__dirname, "../public/dashboard.html"));

});

// ===============================
// Logout
// ===============================
app.get("/logout", async (req, res) => {

  try {

    if (req.session.tokens?.access_token) {
      await oauth2Client.revokeToken(req.session.tokens.access_token);
    }

  } catch (err) {

    console.log("Token revoke error:", err.message);

  }

  req.session.destroy(() => {

    res.clearCookie("connect.sid");

    res.redirect(
      `https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=${process.env.APP_URL || "http://localhost:5000"}/about.html`
    );

  });

});

// ===============================
// Get Logged-in User
// ===============================
app.get("/api/user", (req, res) => {

  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  res.json({
    name: req.session.user.name,
    email: req.session.user.email
  });

});

// ===============================
// AI Difficulty Detection
// ===============================
async function getDifficulty(assignmentData) {

  try {

    // Build rich context from full assignment data
    const title       = assignmentData.title       || "Untitled";
    const description = assignmentData.description || "No description provided.";
    const maxPoints   = assignmentData.maxPoints   ? `${assignmentData.maxPoints} points` : "Not specified";
    const workType    = assignmentData.workType    || "ASSIGNMENT";

    // List material names
    let materialsList = "None";
    if (assignmentData.materials && assignmentData.materials.length > 0) {
      materialsList = assignmentData.materials.map(m => {
        if (m.driveFile)    return m.driveFile.driveFile.title;
        if (m.youtubeVideo) return m.youtubeVideo.title;
        if (m.link)         return m.link.title || m.link.url;
        if (m.form)         return m.form.title;
        return "Unknown";
      }).join(", ");
    }

    const context = `Title: ${title}
Type: ${workType}
Max Points: ${maxPoints}
Description: ${description}
Attached Materials: ${materialsList}`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are an academic difficulty classifier. Always respond with ONLY a valid JSON object, no extra text, no markdown."
          },
          {
            role: "user",
            content: `Based on the full assignment details below, classify the difficulty as Easy, Medium, or Hard. Give a one-sentence reason based on the actual content, description, and requirements — not just the title.

Respond ONLY with this exact JSON format:
{"level":"Medium","reason":"One sentence explaining why based on the content."}

Assignment Details:
${context}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        }
      }
    );

    const raw = response.data.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      level: parsed.level || "Medium",
      reason: parsed.reason || "Moderate complexity."
    };

  } catch (err) {

    console.log("AI difficulty error:", err.message);

    return { level: "Medium", reason: "Could not assess difficulty." };

  }

}

// ===============================
// Google Classroom Data
// ===============================
app.get("/api/classes", async (req, res) => {

  if (!req.session.tokens) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {

    const oauthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauthClient.setCredentials(req.session.tokens);

    const classroom = google.classroom({
      version: "v1",
      auth: oauthClient
    });

    const courses = await classroom.courses.list();

    if (!courses.data.courses) {
      return res.json([]);
    }

    const result = [];

    for (const course of courses.data.courses) {

      // Fetch courseWork, courseWorkMaterials, and announcements
      const [workRes, matRes, annRes] = await Promise.allSettled([
        classroom.courses.courseWork.list({
          courseId: course.id,
          pageSize: 10,
          orderBy: "updateTime desc"
        }),
        classroom.courses.courseWorkMaterials.list({
          courseId: course.id,
          pageSize: 10,
          orderBy: "updateTime desc"
        }),
        classroom.courses.announcements.list({
          courseId: course.id,
          pageSize: 10,
          orderBy: "updateTime desc"
        })
      ]);

      const cwItems = (workRes.status === "fulfilled" && workRes.value.data.courseWork) ? workRes.value.data.courseWork : [];
      const matItems = (matRes.status === "fulfilled" && matRes.value.data.courseWorkMaterial) ? matRes.value.data.courseWorkMaterial : [];
      const annItems = (annRes.status === "fulfilled" && annRes.value.data.announcements) ? annRes.value.data.announcements : [];

      matItems.forEach(m => { if (!m.workType) m.workType = "MATERIAL"; });
      annItems.forEach(a => {
        if (!a.workType) a.workType = "ANNOUNCEMENT";
        if (!a.title) a.title = a.text ? a.text.slice(0, 60) : "Announcement";
      });

      // Merge all and sort by updateTime desc
      const allItems = [...cwItems, ...matItems, ...annItems].sort((a, b) =>
        new Date(b.updateTime) - new Date(a.updateTime)
      );

      if (allItems.length === 0) {
        result.push({
          subject: course.name,
          title: "No assignments yet",
          difficulty: { level: "NA", reason: "No assignment has been posted for this class yet." },
          countdown: "_"
        });
        continue;
      }

      // Find most recent item WITH materials/files; fallback to most recent anything
      const latest = allItems.find(w =>
        w.materials && w.materials.length > 0
      ) || allItems[0];

      let countdown = "_";

      if (latest.dueDate) {

        const due = new Date(
          latest.dueDate.year,
          latest.dueDate.month - 1,
          latest.dueDate.day
        );

        const diff = Math.ceil(
          (due - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (diff < 0) {
          countdown = `Overdue by ${Math.abs(diff)} days`;
        } 
        else if (diff === 0) {
          countdown = "Due Today";
        } 
        else {
          countdown = `${diff} days remaining`;
        }

      }

      const difficulty = await getDifficulty(latest); // pass full assignment object for richer context

      result.push({
        subject: course.name,
        title: latest.title,
        difficulty,
        countdown
      });

    }

    res.json(result);

  } catch (err) {

    console.error(err);

    res.status(500).send("Failed to fetch classroom data");

  }

});

// ===============================
// Google Classroom Data (Assignments Page)
// ===============================
app.get("/api/assignments", async (req, res) => {

  if (!req.session.tokens) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {

    const oauthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauthClient.setCredentials(req.session.tokens);

    const classroom = google.classroom({
      version: "v1",
      auth: oauthClient
    });

    const courses = await classroom.courses.list();

    if (!courses.data.courses) return res.json([]);

    const result = [];

    for (const course of courses.data.courses) {

      // Fetch courseWork, courseWorkMaterials, and announcements
      const [workRes2, matRes2, annRes2] = await Promise.allSettled([
        classroom.courses.courseWork.list({
          courseId: course.id,
          pageSize: 10,
          orderBy: "updateTime desc"
        }),
        classroom.courses.courseWorkMaterials.list({
          courseId: course.id,
          pageSize: 10,
          orderBy: "updateTime desc"
        }),
        classroom.courses.announcements.list({
          courseId: course.id,
          pageSize: 10,
          orderBy: "updateTime desc"
        })
      ]);

      const cwItems2 = (workRes2.status === "fulfilled" && workRes2.value.data.courseWork) ? workRes2.value.data.courseWork : [];
      const matItems2 = (matRes2.status === "fulfilled" && matRes2.value.data.courseWorkMaterial) ? matRes2.value.data.courseWorkMaterial : [];
      const annItems2 = (annRes2.status === "fulfilled" && annRes2.value.data.announcements) ? annRes2.value.data.announcements : [];

      matItems2.forEach(m => { if (!m.workType) m.workType = "MATERIAL"; });
      annItems2.forEach(a => {
        if (!a.workType) a.workType = "ANNOUNCEMENT";
        if (!a.title) a.title = a.text ? a.text.slice(0, 60) : "Announcement";
      });

      const allItems2 = [...cwItems2, ...matItems2, ...annItems2].sort((a, b) =>
        new Date(b.updateTime) - new Date(a.updateTime)
      );

      if (allItems2.length === 0) continue;

      // Find most recent item WITH materials/files; fallback to most recent anything
      const latest = allItems2.find(w =>
        w.materials && w.materials.length > 0
      ) || allItems2[0];

      let status = "No Submission";
      let dueDate = "-";

      // Assignment vs Study Material
      if (latest.workType === "ASSIGNMENT") {
        status = "Pending";
      }

      // Due date calculation
      if (latest.dueDate) {

        const due = new Date(
          latest.dueDate.year,
          latest.dueDate.month - 1,
          latest.dueDate.day
        );

        const diff = Math.ceil(
          (due - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (diff < 0) {
          dueDate = `Overdue by ${Math.abs(diff)} days`;
        } 
        else if (diff === 0) {
          dueDate = "Due Today";
        } 
        else {
          dueDate = `${diff} days remaining`;
        }[]

      }

      const link = latest.alternateLink || "#";

      // IMPORTANT: include IDs for AI analysis
      result.push({
        className: course.name,
        title: latest.title,
        status,
        dueDate,
        link,

        courseId: course.id,
        courseWorkId: latest.id,
        workType: latest.workType || "ASSIGNMENT"
      });

    }

    res.json(result);

  } catch (err) {

    console.error("Assignments API error:", err);
    res.status(500).send("Failed to fetch assignments");

  }

});

//================================
// API AI-Feedback Route
// Uses only Classroom API metadata (title, description, due date, materials list)
// No Drive file download needed — works for all students always
//================================

app.post("/api/ai-feedback", async (req, res) => {

  if (!req.session.tokens) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {

    // Accept both naming styles safely
    const { courseId, courseWorkId, courseworkId } = req.body;
    const workId = courseWorkId || courseworkId;

    console.log("AI request body:", req.body);

    if (!courseId || !workId || courseId === "undefined" || workId === "undefined") {
      return res.json({
        feedback: "Assignment IDs missing from frontend."
      });
    }

    console.log("Fetch coursework:", courseId, workId);

    const oauthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauthClient.setCredentials(req.session.tokens);

    const classroom = google.classroom({
      version: "v1",
      auth: oauthClient
    });

    //==============================
    // Get item details — handle courseWork, material, or announcement
    //==============================

    const { workType } = req.body;
    let data;

    if (workType === "MATERIAL") {
      const matResult = await classroom.courses.courseWorkMaterials.get({
        courseId: courseId,
        id: workId
      });
      data = matResult.data;
      data.workType = "MATERIAL";
    } else if (workType === "ANNOUNCEMENT") {
      const annResult = await classroom.courses.announcements.get({
        courseId: courseId,
        id: workId
      });
      data = annResult.data;
      // announcements use 'text' not 'description'
      data.title = data.text ? data.text.slice(0, 80) : "Announcement";
      data.description = data.text || "No description provided.";
      data.workType = "ANNOUNCEMENT";
    } else {
      const cwResult = await classroom.courses.courseWork.get({
        courseId: courseId,
        id: workId
      });
      data = cwResult.data;
    }

    //==============================
    // Build context from Classroom metadata
    //==============================

    const title       = data.title       || "Untitled Assignment";
    const description = data.description || "No description provided.";
    const maxPoints   = data.maxPoints   ? `${data.maxPoints} points` : "Not specified";
    const itemType    = data.workType    || workType || "ASSIGNMENT";
    const courseLink  = data.alternateLink || "";

    // Due date
    let dueDateStr = "No due date";
    if (data.dueDate) {
      const { year, month, day } = data.dueDate;
      dueDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // List attached material titles (Drive files, YouTube, links, forms)
    let materialsList = "None";
    if (data.materials && data.materials.length > 0) {
      materialsList = data.materials.map(m => {
        if (m.driveFile)   return `📄 ${m.driveFile.driveFile.title} (Google Drive file)`;
        if (m.youtubeVideo) return `🎥 ${m.youtubeVideo.title} (YouTube)`;
        if (m.link)        return `🔗 ${m.link.title || m.link.url} (Link)`;
        if (m.form)        return `📝 ${m.form.title} (Google Form)`;
        return "Unknown material";
      }).join("\n");
    }

    //==============================
    // Compose the text to send to AI
    //==============================

    const textContent = `
Assignment Title: ${title}

Type: ${itemType}
Due Date: ${dueDateStr}
Max Points: ${maxPoints}

Description / Instructions:
${description}

Attached Materials:
${materialsList}
    `.trim();

    //==============================
    // Trim Text (token safety)
    //==============================

    const trimmedText = textContent.slice(0, 12000);

    //==============================
    // Send to OpenRouter
    //==============================

    const ai = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are an academic assistant that explains assignments clearly and gives structured feedback."
          },
          {
            role: "user",
            content: `Analyze this assignment and give:

1. Summary
2. Key Concepts
3. What students must implement or do
4. Important topics to study
5. Possible exam questions

Assignment Details:

${trimmedText}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        }
      }
    );

    const feedback = ai.data.choices[0].message.content;

    res.json({ feedback });

  } catch (err) {

    console.error("AI Feedback Error:", err);

    res.status(500).json({
      feedback: "Failed to analyze assignment."
    });

  }

});



// ===============================
// Doubts - Get All Chats
// ===============================
app.get("/api/doubts/chats", async (req, res) => {

  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const result = await db.execute({
    sql: "SELECT id, title, updated_at FROM doubt_chats WHERE user_id = ? ORDER BY updated_at DESC",
    args: [req.session.user.id]
  });

  res.json(result.rows);

});

// ===============================
// Doubts - Get Single Chat + Messages
// ===============================
app.get("/api/doubts/chats/:id", async (req, res) => {

  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const chatId = req.params.id;

  const chat = await db.execute({
    sql: "SELECT * FROM doubt_chats WHERE id = ? AND user_id = ?",
    args: [chatId, req.session.user.id]
  });

  if (!chat.rows[0]) return res.status(404).json({ error: "Chat not found" });

  const messages = await db.execute({
    sql: "SELECT role, content FROM doubt_messages WHERE chat_id = ? ORDER BY created_at ASC",
    args: [chatId]
  });

  res.json({ ...chat.rows[0], messages: messages.rows });

});

// ===============================
// Doubts - Delete Chat
// ===============================
app.delete("/api/doubts/chats/:id", async (req, res) => {

  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const chatId = req.params.id;

  await db.execute({ sql: "DELETE FROM doubt_messages WHERE chat_id = ?", args: [chatId] });
  await db.execute({ sql: "DELETE FROM doubt_chats WHERE id = ? AND user_id = ?", args: [chatId, req.session.user.id] });

  res.json({ success: true });

});

// ===============================
// Doubts - Ask AI
// ===============================
app.post("/api/doubts/ask", async (req, res) => {

  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  try {

    const { chatId, message, history, docContext } = req.body;

    if (!message) return res.status(400).json({ error: "Message required" });

    // Build system prompt — inject document context if provided
    let systemPrompt = `You are StudyBuddy AI, a friendly and expert academic assistant for B.Tech CSE (Artificial Intelligence) students at UEM Kolkata (Admission Year 2024), currently in Semester IV.

STUDENT CONTEXT:
- University: University of Engineering & Management (UEM), Kolkata
- Program: B.Tech CSE (Artificial Intelligence)
- Semester: IV (Admission Year 2024)

SEMESTER IV SYLLABUS:

1. DISCRETE MATHEMATICS
   - Set Theory, Relations, Functions, Lattices, Boolean Algebra
   - Propositional Logic, Predicate Logic, Proof Techniques
   - Graph Theory: Trees, Paths, Circuits, Planar Graphs, Graph Coloring
   - Combinatorics: Permutations, Combinations, Pigeonhole Principle, Recurrence Relations
   - Algebraic Structures: Groups, Rings, Fields

2. COMPUTER ORGANIZATION & ARCHITECTURE (COA)
   - Basic Structure of Computers, Instruction Sets, Addressing Modes
   - ALU Design, Integer & Floating Point Arithmetic
   - Control Unit: Hardwired & Microprogrammed
   - Memory Hierarchy: Cache, Virtual Memory, RAM types
   - I/O Organization, DMA, Interrupts
   - Pipelining, Hazards, Superscalar Architecture
   - Parallel Processing, RISC vs CISC

3. ARTIFICIAL INTELLIGENCE & MACHINE LEARNING (AIML)
   - Introduction to AI, Intelligent Agents, Problem Solving
   - Search Algorithms: BFS, DFS, A*, Heuristic Search
   - Knowledge Representation: Logic, Semantic Nets, Frames
   - Machine Learning: Supervised, Unsupervised, Reinforcement Learning
   - Regression, Classification, Decision Trees, SVM, KNN
   - Neural Networks, Backpropagation, Deep Learning basics
   - Clustering: K-Means, Hierarchical
   - Dimensionality Reduction: PCA
   - Natural Language Processing basics

4. DESIGN & ANALYSIS OF ALGORITHMS (DAA)
   - Algorithm Analysis: Time & Space Complexity, Asymptotic Notations
   - Divide & Conquer: Merge Sort, Quick Sort, Binary Search
   - Greedy Algorithms: Huffman Coding, Kruskal, Prim, Dijkstra
   - Dynamic Programming: LCS, Knapsack, Matrix Chain Multiplication, Floyd-Warshall
   - Backtracking: N-Queens, Graph Coloring, Hamiltonian Cycle
   - Branch & Bound
   - NP-Completeness, P vs NP, NP-Hard problems
   - String Matching: KMP, Rabin-Karp

5. ADVANCED PROGRAMMING - OOP (Java)
   - Classes, Objects, Constructors, Access Modifiers
   - Inheritance: Single, Multilevel, Hierarchical
   - Polymorphism: Method Overloading & Overriding
   - Abstraction: Abstract Classes, Interfaces
   - Exception Handling: try-catch-finally, Custom Exceptions
   - Collections Framework: ArrayList, LinkedList, HashMap, HashSet
   - Generics, Lambda Expressions, Stream API
   - File I/O, Serialization
   - Multithreading, Synchronization
   - JDBC basics

6. MANAGEMENT & HUMANITIES
   - Engineering Economics & Costing
   - Project Management basics
   - Technical Communication & Report Writing
   - Professional Ethics

7. PRACTICAL LABS & SESSIONALS
   - Discrete Mathematics Lab
   - COA Lab: Assembly Language, Logic Circuit Simulation
   - AIML Lab: Python with NumPy, Pandas, Scikit-learn
   - OOP Lab: Java Programming Assignments
   - DAA Lab: Algorithm Implementation in Java/C
   - Mini Project Sessional

INSTRUCTIONS:
- Always relate answers to this Semester IV syllabus when relevant
- When explaining algorithms or concepts, connect them to their course topics
- For exam preparation questions, focus on the above syllabus topics
- Use simple language, examples, bullet points and headings
- Be encouraging and supportive
- If a topic is outside this syllabus, still answer it helpfully`;
    if (docContext) {
      systemPrompt += `

IMPORTANT: The student has uploaded a document. The FULL content of the document is provided below. You MUST read and use the actual content from this document to answer the student's question in detail. Do NOT say you cannot access the file. Do NOT give a generic answer. Base your response entirely on the document content provided.

${docContext}`;
    }

    // Build messages array for Groq
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-10),
    ];

    // Get AI reply
    const aiRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 4096
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = aiRes.data.choices[0].message.content.trim();

    let finalChatId = chatId;
    let title = "New Conversation";

    // Create new chat if needed
    if (!chatId) {

      // Auto-generate title from first message (max 50 chars)
      const titleRes = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: `Generate a very short chat title (max 5 words, no quotes) for this question: "${message}"`
            }
          ],
          max_tokens: 20
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      title = titleRes.data.choices[0].message.content.trim().replace(/^["']|["']$/g, "").slice(0, 50);

      const newChat = await db.execute({
        sql: "INSERT INTO doubt_chats (user_id, title) VALUES (?, ?)",
        args: [req.session.user.id, title]
      });

      finalChatId = Number(newChat.lastInsertRowid);

    } else {

      // Update updated_at
      await db.execute({
        sql: "UPDATE doubt_chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [chatId]
      });

      const chatRow = await db.execute({
        sql: "SELECT title FROM doubt_chats WHERE id = ?",
        args: [chatId]
      });

      title = chatRow.rows[0]?.title || "Conversation";

    }

    // Save user message + AI reply
    await db.execute({
      sql: "INSERT INTO doubt_messages (chat_id, role, content) VALUES (?, ?, ?)",
      args: [finalChatId, "user", message]
    });

    await db.execute({
      sql: "INSERT INTO doubt_messages (chat_id, role, content) VALUES (?, ?, ?)",
      args: [finalChatId, "assistant", reply]
    });

    res.json({ reply, chatId: finalChatId, title });

  } catch (err) {

    console.error("Doubts AI error:", err.message);
    res.status(500).json({ error: "AI failed", reply: "Sorry, I couldn't process that. Please try again." });

  }

});


// ===============================
// Upload File
// ===============================
app.post("/api/upload", upload.single("file"), async (req, res) => {

  if (!req.session.user) {
    return res.status(401).send("Not logged in");
  }

  const userId = req.session.user.id;

  const filename = req.file.originalname;

  // Cloudinary returns the file URL in req.file.path
  const filepath = req.file.path;

  await db.execute({
    sql: `
      INSERT INTO uploads (user_id, filename, filepath)
      VALUES (?, ?, ?)
    `,
    args: [userId, filename, filepath]
  });

  res.json({ success: true });

});

// ===============================
// Get Uploaded Files
// ===============================
app.get("/api/uploads", async (req, res) => {

  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const userId = req.session.user.id;

  const result = await db.execute({
    sql: `
      SELECT id, filename, filepath, uploaded_at
      FROM uploads
      WHERE user_id = ?
      ORDER BY uploaded_at DESC
    `,
    args: [userId]
  });

  res.json(result.rows);

});

// ===============================
// Start Server
// ===============================
//================================
// PDF Text Extraction Route
//================================
app.post("/api/extract-text", async (req, res) => {
  try {
    const { base64, filename } = req.body;
    if (!base64) return res.status(400).json({ error: "No file data" });

    const buffer = Buffer.from(base64, "base64");
    const ext = (filename || "").split(".").pop().toLowerCase();
    console.log(`[extract-text] file=${filename}, ext=${ext}, bufferSize=${buffer.length} bytes`);

    if (ext === "pdf") {
      try {
        // Use createRequire to load pdf-parse (CommonJS module)
        const pdfParse = require2("pdf-parse");
        const pdfData = await pdfParse(buffer);
        const text = (pdfData.text || "").trim();
        if (!text) {
          return res.json({ text: `[PDF: ${filename} — scanned/image PDF, no extractable text layer]`, success: false });
        }
        console.log(`PDF extracted: ${text.length} chars from ${filename}`);
        return res.json({ text, success: true, chars: text.length });
      } catch (pdfErr) {
        console.error("pdf-parse error:", pdfErr.message);
        // Fallback: try pdfjs-dist
        try {
          let text = "";
          const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
          const pdf = await loadingTask.promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            text += textContent.items.map(item => item.str).join(" ") + "\n";
          }
          text = text.trim();
          if (!text) return res.json({ text: `[PDF: ${filename} — no extractable text]`, success: false });
          console.log(`PDF extracted via pdfjs: ${text.length} chars`);
          return res.json({ text, success: true, chars: text.length });
        } catch (fallbackErr) {
          return res.json({ text: `[PDF: ${filename} — could not extract text: ${fallbackErr.message}]`, success: false });
        }
      }
    }

    // Plain text files
    if (["txt", "md", "csv", "json", "py", "js", "ts", "java", "cpp", "c", "html", "xml"].includes(ext)) {
      const text = buffer.toString("utf-8");
      return res.json({ text, success: true, chars: text.length });
    }

    // Word documents — extract with mammoth
    if (["docx", "doc"].includes(ext)) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value.trim();
        if (!text) return res.json({ text: `[DOCX: ${filename} — no text found]`, success: false });
        console.log(`DOCX extracted: ${text.length} chars from ${filename}`);
        return res.json({ text, success: true, chars: text.length });
      } catch (docErr) {
        console.error("mammoth error:", docErr.message);
        return res.json({ text: `[DOCX extraction failed: ${docErr.message}]`, success: false });
      }
    }

    return res.json({ text: `[File: ${filename} — binary format, cannot extract text]`, success: false });

  } catch (err) {
    console.error("Extract text error:", err);
    res.status(500).json({ text: "[Server error during text extraction]", success: false });
  }
});

/* ============================================================
   GET /api/course-items?courseId=xxx
   Returns ALL courseWork, materials, and announcements for a course
   Used by the AI Feedback dropdown in assignments.html
   ============================================================ */
app.get("/api/course-items", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });
  if (!req.session.tokens) return res.status(403).json({ error: "No Google tokens. Please log in again." });

  const { courseId } = req.query;
  if (!courseId) return res.status(400).json({ error: "courseId required" });

  try {
    const oauthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauthClient.setCredentials(req.session.tokens);

    const classroom = google.classroom({ version: "v1", auth: oauthClient });

    const [workRes, matRes, annRes] = await Promise.allSettled([
      classroom.courses.courseWork.list({ courseId, pageSize: 30, orderBy: "updateTime desc" }),
      classroom.courses.courseWorkMaterials.list({ courseId, pageSize: 30, orderBy: "updateTime desc" }),
      classroom.courses.announcements.list({ courseId, pageSize: 30, orderBy: "updateTime desc" })
    ]);

    const cwItems  = (workRes.status === "fulfilled" && workRes.value.data.courseWork)         ? workRes.value.data.courseWork         : [];
    const matItems = (matRes.status  === "fulfilled" && matRes.value.data.courseWorkMaterial)  ? matRes.value.data.courseWorkMaterial  : [];
    const annItems = (annRes.status  === "fulfilled" && annRes.value.data.announcements)        ? annRes.value.data.announcements        : [];

    matItems.forEach(m => { m.workType = "MATERIAL"; });
    annItems.forEach(a => {
      a.workType = "ANNOUNCEMENT";
      if (!a.title) a.title = a.text ? a.text.slice(0, 60) : "Announcement";
    });

    const allItems = [...cwItems, ...matItems, ...annItems]
      .sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
      .map(item => ({
        id:       item.id,
        title:    item.title || "Untitled",
        workType: item.workType || "ASSIGNMENT",
      }));

    res.json(allItems);

  } catch (err) {
    console.error("course-items error:", err);
    res.status(500).json({ error: "Failed to fetch course items" });
  }
});

app.listen(PORT, () => {

  console.log(`🚀 Server running at http://localhost:${PORT}`);

});