   # StudyBuddy.AI 🎓

An AI-powered Academic Intelligence & Performance Optimization Platform built for students of the Institute of Engineering and Management, Kolkata.

## 🌐 Live Demo
[https://studybuddy-ai-4px8.onrender.com](https://studybuddy-ai-4px8.onrender.com)

## ✨ Features
- **Google Classroom Sync** — Auto-fetches assignments, materials & announcements
- **AI Difficulty Predictor** — Classifies each assignment as Easy / Medium / Hard with reasoning
- **AI Assignment Feedback** — Detailed analysis, key concepts, and exam prep tips
- **Deadline Tracker** — Countdown timers for upcoming due dates
- **AI Doubt Assistant** — Chat with LLaMA AI, upload PDFs/DOCXs for context-aware answers
- **File Uploads** — Persistent cloud storage via Cloudinary
- **Google OAuth** — Secure one-click login

## 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | HTML, Tailwind CSS, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | Turso (LibSQL) |
| AI Model | Groq API — LLaMA 3.3 70B |
| Auth | Google OAuth 2.0 |
| Classroom | Google Classroom API |
| Storage | Cloudinary |
| Hosting | Render |

## 👨‍💻 Team

| Name | Role |
|------|------|
| **Souvagya Karmakar** | Full Stack Developer & Project Lead |
| **Anirban Karmakar** | Frontend Developer |
| **Ronit Bose** | Backend Developer |
| **Sugata Dey** | AI & API Integration |
| **Supratik Chatterjee** | UI/UX Designer |

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
```
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

## 📄 License
Built for IGP Hackathon 2026 — Institute of Engineering and Management, Kolkata.
