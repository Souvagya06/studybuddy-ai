# StudyBuddy.AI 🎓

An AI-powered Academic Intelligence & Performance Optimization Platform built for B.Tech CSE (AI) students at the University of Engineering & Management, Kolkata.

## 🌐 Live Demo
[https://studybuddy-ai-4px8.onrender.com](https://studybuddy-ai-4px8.onrender.com)

---

## ✨ Features
- **Google Classroom Sync** — Auto-fetches assignments, materials & announcements in real time
- **AI Difficulty Predictor** — Classifies each assignment as Easy / Medium / Hard with reasoning
- **AI Assignment Feedback** — Detailed analysis, key concepts, and exam prep tips
- **Deadline Tracker** — Live countdown timers for upcoming due dates
- **AI Doubt Assistant** — Chat with LLaMA 3.3 70B via Groq AI, with semester syllabus awareness
- **Document Upload** — Upload PDFs & DOCXs for context-aware AI answers
- **File Uploads** — Persistent cloud storage via Cloudinary
- **Google OAuth** — Secure one-click login

---

## 🛠️ Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | HTML, Tailwind CSS, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | Turso (LibSQL) |
| AI Model | Groq API — LLaMA 3.3 70B |
| Auth | Google OAuth 2.0 |
| Classroom | Google Classroom API |
| Storage | Cloudinary |
| Hosting | Render |

---

## 👨‍💻 Team

| Name | Role |
|------|------|
| **Souvagya Karmakar** | Full Stack Developer (Backend & AI Systems Lead) |
| **Anirban Pal** | AI API Integration Engineer |
| **Ronit Mishra** | Database Engineer & Data Architect |
| **Sugata Nayak** | Frontend Developer (HTML & UI/UX Lead) |
| **Supratik Patra** | UI & Frontend Integration Engineer |

---

## ⚙️ Local Setup

1. Clone the repo
```bash
git clone https://github.com/Souvagya06/studybuddy-ai.git
cd studybuddy-ai/backend
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` in `/backend`:
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
GROQ_API_KEY=
DATABASE_URL=
DATABASE_TOKEN=
SESSION_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
APP_URL=http://localhost:5000
```

4. Run the server
```bash
node server.js
```

5. Open [http://localhost:5000](http://localhost:5000)

---

## 🚀 Future Development

The following features are planned for upcoming versions of StudyBuddy.AI:

- **Large PDF Support (RAG Pipeline)** — Currently, the AI Doubt Assistant has limitations when processing large documents (e.g., 80+ page PDFs) due to the context window constraints of the LLaMA 3.3 70B model. A **Retrieval Augmented Generation (RAG)** pipeline will be implemented to chunk large documents, embed them using vector search, and retrieve only the most relevant sections based on the student's query — enabling accurate answers from entire textbooks or lecture notes.

- **Image Understanding** — The current AI model (LLaMA 3.3 70B) is text-only and cannot process images. A future update will integrate a **vision-capable model** (such as LLaMA 4 Scout or Maverick via Groq) to allow students to upload diagrams, handwritten notes, circuit diagrams, or screenshots and receive AI-powered explanations.

- **Personalized Performance Analytics** — Track individual student performance over time, identify weak areas based on doubt history, and generate personalized study recommendations.

- **Multi-Semester Syllabus Support** — Extend syllabus awareness to all semesters and allow students to select their current semester dynamically.

- **Mobile App** — A React Native mobile application for on-the-go access to assignments, doubts, and AI feedback.

- **Offline Mode** — Enable basic functionality without internet access using cached classroom data and local AI models.

---

## 📄 License
Built for Innovative Group Project 2026 — University of Engineering & Management (UEM), Kolkata.