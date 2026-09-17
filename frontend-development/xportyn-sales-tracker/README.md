# XPORTYN Sales Tracker

Contact outreach & follow-up tracking dashboard for XPORTYN (custom sportswear manufacturer).

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router + Axios + Recharts
- **Backend:** Node.js + Express + MongoDB (Mongoose) + Multer + xlsx
- **Backend code location:** `backend-development/` (same Express app as your existing project — nothing existing was changed)

---

## 1. Setup — Backend

Backend aapke existing `backend-development` folder me hi hai. Naye endpoints `/api/...` par hain.

```bash
cd backend-development
npm install           # xlsx already install ho chuka hai
npm run dev           # ya: npm start
```

`.env` file me ye variables hone chahiyen (tracker wale already add kar diye gaye hain):

```env
MONGO_URI=mongodb://localhost:27017/school
PORT=3000
JWT_SECRET=<your-secret>

# XPORTYN Sales Tracker
TRACKER_ADMIN_USER=admin
TRACKER_ADMIN_PASS=admin
TRACKER_TOKEN_EXPIRY=7d
SALES_REP_NAME=Raja Ali
SALES_REP_TITLE=Sales Manager
```

Backend chalne ke baad:
- API: http://localhost:3000
- Swagger docs: http://localhost:3000/swagger-api-docs

---

## 2. Setup — Frontend

```bash
cd frontend-development/xportyn-sales-tracker
npm install
npm run dev
```

Browser: **http://localhost:5173**

Login: **admin / admin**

> Vite dev server `/api` requests ko automatically `http://localhost:3000` par proxy karta hai,
> is liye CORS ka koi masla nahi hota.

---

## 3. Pehli dafa istemal

1. Login karein (`admin` / `admin`)
2. **Contacts** page → **Import Excel/CSV** button
3. Apni Google Sheet ko `.xlsx` ya `.csv` me export kar ke upload karein
4. Import ho jane ke baad **Dashboard** par stats aur charts nazar aayenge
5. Kisi bhi contact row par click karein → email template khul jayega (placeholders already filled)
6. **Copy to Clipboard** ya **Send via Email** use karein, phir status update kar dein

---

## 4. Excel / CSV Import

**Expected columns:** `Name`, `City`, `Category`, `Address`, `Phone`, `Website`, `Email`
(column order maayne nahi rakhta; capital/small letters bhi chalte hain)

**Multi-sheet support:** agar file me `Soccer Facilities`, `Colleges & Universities`, `Schools`
jaise tabs hain to har tab apni category me chala jata hai. `Overview` jaisi sheet
(jis me proper headers nahi hote) khud skip ho jati hai.

**Category detection priority:**
1. UI se "Force Category" (agar select kiya ho)
2. Sheet ka naam (e.g. "Colleges & Universities" → Colleges)
3. Row ka Category column (e.g. "Soccer field" → Soccer)

**Duplicates:** email se match hote hain. Jis contact ka email na ho wo `name + city` se match hota hai.

---

## 5. Status, Colors & Follow-up Cadence

| Status | Row Color | Next Follow-up |
|---|---|---|
| Not Contacted | White | koi nahi — abhi email hi nahi bheji |
| Email Sent | Yellow | last contact + **4 din** |
| Follow-up 1 | Orange | last contact + **7 din** |
| Follow-up 2 | Red | koi follow-up nahi |
| Replied | Green | koi follow-up nahi |
| Deal Closed | Blue | koi follow-up nahi |
| No Reply | Grey | koi follow-up nahi |

Dates automatic calculate hoti hain, magar modal me manually override bhi kar sakte hain.

**Ahem:** Sheet import karne par har contact **"Not Contacted"** hota hai — dashboard par
"Emails Sent" **0** rahega. Jab aap waqai kisi ko email bhej dein, tab us contact ka status
khud **"Email Sent"** karein — tabhi counter barhega aur 4 din baad wali follow-up date lagegi.

---

## 6. API Endpoints

Base URL: `http://localhost:3000`

Login ke ilawa **har endpoint ko `Authorization: Bearer <token>` header chahiye**.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login (`{ username, password }`) → JWT token |
| GET | `/api/auth/me` | Current user / token valid hai ya nahi |

### Contacts

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/contacts` | List (filters: `page`, `limit`, `category`, `status`, `city`, `search`, `hasEmail`, `sortField`, `order`) |
| POST | `/api/contacts` | Naya contact add karein |
| GET | `/api/contacts/:id` | Ek contact |
| PUT | `/api/contacts/:id` | Contact update (details, status, dates, notes) |
| DELETE | `/api/contacts/:id` | Contact delete |
| PATCH | `/api/contacts/:id/status` | Sirf status change (color + next follow-up auto) |
| GET | `/api/contacts/:id/template` | Email template filled (`?type=initial\|followUp1\|followUp2&senderName=&senderTitle=`) |
| POST | `/api/contacts/import` | Excel/CSV import (`multipart/form-data`: `file`, optional `categoryOverride`) |
| POST | `/api/contacts/bulk-delete` | Multiple delete (`{ ids: [...] }`) |
| GET | `/api/contacts/filters/options` | Dropdown options (cities, categories, statuses, colors) |

### Dashboard / Stats

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stats/summary` | Cards + bar chart + pie chart ka data |
| GET | `/api/stats/upcoming-followups` | Follow-ups due (`?days=2&limit=50`) |

### Templates

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/templates` | Raw templates + placeholder list |

> Poori interactive documentation: **http://localhost:3000/swagger-api-docs** ("XPORTYN Tracker" tag)

---

## 7. Project Structure

```
backend-development/                     # (existing Express app — naye files add kiye gaye)
├── config/uploadExcel.js                # NEW — multer (memory) for .xlsx/.csv
├── controller/contactController.js      # NEW — CRUD, import, stats, templates
├── controller/trackerAuthController.js  # NEW — simple admin login
├── model/contactModel.js                # NEW
├── schema/contactSchema.js              # NEW — Mongoose schema
├── routes/contactRoutes.js              # NEW — saare /api/... routes
├── swagger/contactSwagger.js            # NEW — Swagger docs
├── utils/trackerRules.js                # NEW — status colors + follow-up cadence
├── utils/emailTemplates.js              # NEW — 3 templates + 2 follow-ups
└── index.js                             # MODIFIED — sirf router register kiya

frontend-development/xportyn-sales-tracker/
├── index.html
├── vite.config.js                       # dev proxy -> localhost:3000
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx                          # routes
    ├── index.css                        # Tailwind + reusable classes
    ├── api/
    │   ├── client.js                    # axios instance + JWT interceptors
    │   └── endpoints.js                 # saare API calls
    ├── context/AuthContext.jsx          # login state + sender settings
    ├── utils/
    │   ├── statusStyles.js              # status -> colors
    │   └── date.js                      # date helpers
    ├── components/
    │   ├── Layout.jsx                   # sidebar + header
    │   ├── ProtectedRoute.jsx
    │   ├── ContactModal.jsx             # detail + email template + status update
    │   ├── ImportModal.jsx              # Excel/CSV upload
    │   ├── StatCard.jsx
    │   ├── StatusBadge.jsx
    │   ├── Pagination.jsx
    │   └── Spinner.jsx
    └── pages/
        ├── Login.jsx
        ├── Dashboard.jsx                # cards + bar/pie charts + follow-ups
        ├── Contacts.jsx                 # filters + color-coded table
        ├── Templates.jsx                # template reference
        └── Settings.jsx                 # [Your Name] / [Your Title]
```

---

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| `MongoDB connection failed` | MongoDB service chal rahi hai? `MONGO_URI` check karein |
| Login par 500 error | `.env` me `JWT_SECRET` set karein |
| Frontend par 401 | Token expire — dobara login karein |
| Import "no valid contact" | Sheet me `Name` column hona zaroori hai |
| Port 3000 busy | `.env` me `PORT` change karein + `vite.config.js` ka proxy target bhi |
