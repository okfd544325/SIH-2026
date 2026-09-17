const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

console.log("[DIAGNOSTIC] dotenv loaded: true");
console.log(`[DIAGNOSTIC] GEMINI_API_KEY loaded: ${!!process.env.GEMINI_API_KEY}`);
console.log(`[DIAGNOSTIC] GEMINI_MODEL loaded: ${!!process.env.GEMINI_MODEL}`);

const app = express();
const PORT = Number(process.env.PORT || 3000);

// ===============================
// BASIC SETTINGS
// ===============================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Allow frontend requests
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Cart-Id");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

// ===============================
// DATA STORAGE
// ===============================

const dataFolder = path.join(__dirname, "data");

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
}

const usersFile = path.join(dataFolder, "users.json");
const appointmentsFile = path.join(dataFolder, "appointments.json");
const messagesFile = path.join(dataFolder, "messages.json");
const ordersFile = path.join(dataFolder, "orders.json");
const cartsFile = path.join(dataFolder, "carts.json");
const medicinesFile = path.join(dataFolder, "medicines.json");
const medicineImagesFolder = path.join(dataFolder, "medicine-images");

function createFileIfNeeded(file, defaultData = []) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
    }
}

createFileIfNeeded(usersFile);
createFileIfNeeded(appointmentsFile);
createFileIfNeeded(messagesFile);
createFileIfNeeded(ordersFile);
createFileIfNeeded(cartsFile, {});

if (!fs.existsSync(medicineImagesFolder)) {
    fs.mkdirSync(medicineImagesFolder, { recursive: true });
}

function readMedicines() {
    try {
        const value = JSON.parse(fs.readFileSync(medicinesFile, "utf8"));
        return Array.isArray(value) ? value : [];
    } catch (error) {
        return [];
    }
}

function readData(file) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
        return [];
    }
}

function saveData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ===============================
// PASSWORD SECURITY
// ===============================

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

    return `${salt}:${hash}`;
}

function checkPassword(password, storedPassword) {
    try {
        const [salt, storedHash] = storedPassword.split(":");

        const hash = crypto
            .scryptSync(password, salt, 64)
            .toString("hex");

        return crypto.timingSafeEqual(
            Buffer.from(hash, "hex"),
            Buffer.from(storedHash, "hex")
        );
    } catch (error) {
        return false;
    }
}

// ===============================
// LOGIN SESSIONS
// ===============================

const sessions = new Map();

function createSession(userId) {
    const token = crypto.randomBytes(32).toString("hex");

    sessions.set(token, {
        userId: userId,
        createdAt: Date.now()
    });

    return token;
}

function authentication(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const token = header.split(" ")[1];
    const session = sessions.get(token);

    if (!session) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired login session."
        });
    }

    req.userId = session.userId;
    next();
}

// ===============================
// TEST ROUTE
// ===============================

app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "MediSwift backend is running!"
    });
});

// ===============================
// MEDICINES CATALOGUE
// ===============================

app.get("/api/medicines", (req, res) => {
    res.json({
        success: true,
        medicines: readMedicines()
    });
});

app.get("/api/medicine-images/:filename", (req, res) => {
    const filename = path.basename(req.params.filename || "");
    if (!filename) return res.status(404).json({ success: false, message: "Image not found." });
    const filePath = path.join(medicineImagesFolder, filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: "Image not found." });
    }
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(filePath);
});

// ===============================
// REGISTER
// ===============================

app.post("/api/register", (req, res) => {
    const { name, email, password, phone, address, city, pincode } = req.body;

    if (!name || !email || !password || !phone || !address || !city || !pincode) {
        return res.status(400).json({ success: false, message: "Please fill all required registration details." });
    }

    const cleanPhone = String(phone).trim();
    const cleanPincode = String(pincode).trim();
    if (!/^[0-9]{10}$/.test(cleanPhone)) {
        return res.status(400).json({ success: false, message: "Please enter a valid 10-digit phone number." });
    }
    if (!/^[0-9]{6}$/.test(cleanPincode)) {
        return res.status(400).json({ success: false, message: "Please enter a valid 6-digit pincode." });
    }
    if (String(password).length < 6) {
        return res.status(400).json({ success: false, message: "Password must contain at least 6 characters." });
    }

    const users = readData(usersFile);
    const cleanEmail = String(email).trim().toLowerCase();
    const existingUser = users.find(user => user.email.toLowerCase() === cleanEmail);
    if (existingUser) {
        return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const newUser = {
        id: crypto.randomUUID(),
        name: String(name).trim().slice(0, 80),
        email: cleanEmail,
        phone: cleanPhone,
        address: String(address).trim().slice(0, 180),
        city: String(city).trim().slice(0, 80),
        pincode: cleanPincode,
        password: hashPassword(password),
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveData(usersFile, users);

    res.status(201).json({
        success: true,
        message: "Account created successfully.",
        user: {
            id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone,
            address: newUser.address, city: newUser.city, pincode: newUser.pincode
        }
    });
});

// ===============================
// LOGIN
// ===============================

app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    const users = readData(usersFile);

    const user = users.find(
        u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user || !checkPassword(password, user.password)) {
        return res.status(401).json({
            success: false,
            message: "Incorrect email or password."
        });
    }

    const token = createSession(user.id);

    res.json({
        success: true,
        message: "Login successful.",
        token: token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            address: user.address || "",
            city: user.city || "",
            pincode: user.pincode || ""
        }
    });
});

// ===============================
// LOGOUT
// ===============================

app.post("/api/logout", authentication, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];

    sessions.delete(token);

    res.json({
        success: true,
        message: "Logged out successfully."
    });
});

// ===============================
// CURRENT USER PROFILE
// ===============================

app.get("/api/profile", authentication, (req, res) => {
    const users = readData(usersFile);

    const user = users.find(u => u.id === req.userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found."
        });
    }

    res.json({
        success: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            address: user.address || "",
            city: user.city || "",
            pincode: user.pincode || "",
            createdAt: user.createdAt
        }
    });
});

// ===============================
// PROFILE MANAGEMENT
// ===============================

app.put("/api/profile", authentication, (req, res) => {
    const { name, email, phone, address, city, pincode } = req.body;
    if (!name || !email) return res.status(400).json({ success:false, message:"Name and email are required." });
    const users = readData(usersFile);
    const user = users.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ success:false, message:"User not found." });
    const cleanEmail = String(email).trim().toLowerCase();
    if (users.some(u => u.id !== req.userId && u.email.toLowerCase() === cleanEmail)) return res.status(409).json({ success:false, message:"That email is already used by another account." });
    user.name=String(name).trim().slice(0,80); user.email=cleanEmail; user.phone=String(phone||"").trim().slice(0,20);
    user.address=String(address||"").trim().slice(0,180); user.city=String(city||"").trim().slice(0,80); user.pincode=String(pincode||"").trim().slice(0,12); user.updatedAt=new Date().toISOString();
    saveData(usersFile, users);
    res.json({ success:true, message:"Profile updated successfully.", user:{ id:user.id,name:user.name,email:user.email,phone:user.phone,address:user.address,city:user.city,pincode:user.pincode,createdAt:user.createdAt } });
});

app.post("/api/change-password", authentication, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success:false, message:"Current and new password are required." });
    if (String(newPassword).length < 6) return res.status(400).json({ success:false, message:"New password must contain at least 6 characters." });
    const users=readData(usersFile); const user=users.find(u=>u.id===req.userId);
    if (!user || !checkPassword(currentPassword,user.password)) return res.status(401).json({ success:false, message:"Current password is incorrect." });
    user.password=hashPassword(newPassword); user.updatedAt=new Date().toISOString(); saveData(usersFile,users);
    res.json({ success:true, message:"Password changed successfully." });
});

// ===============================
// DOCTORS
// ===============================

const doctors = [
    { id: "dr-001", name: "Dr. Anil Sharma", specialization: "General Physician", experience: 15, rating: 4.9, reviews: 1240, consultationFee: 300, available: true, nextSlot: "Today, 4:30 PM", photo: "https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=400", qualifications: "MBBS, MD (Internal Medicine)" },
    { id: "dr-002", name: "Dr. Priya Deshmukh", specialization: "Pediatrician", experience: 12, rating: 4.8, reviews: 980, consultationFee: 400, available: true, nextSlot: "Today, 5:15 PM", photo: "https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=400", qualifications: "MBBS, MD (Pediatrics)" },
    { id: "dr-003", name: "Dr. Rajesh Kulkarni", specialization: "Cardiologist", experience: 22, rating: 4.9, reviews: 2150, consultationFee: 800, available: false, nextSlot: "Tomorrow, 11:00 AM", photo: "https://images.pexels.com/photos/6234600/pexels-photo-6234600.jpeg?auto=compress&cs=tinysrgb&w=400", qualifications: "MBBS, MD, DM (Cardiology)" },
    { id: "dr-004", name: "Dr. Meera Joshi", specialization: "Dermatologist", experience: 10, rating: 4.7, reviews: 760, consultationFee: 500, available: true, nextSlot: "Today, 6:00 PM", photo: "https://images.pexels.com/photos/5214949/pexels-photo-5214949.jpeg?auto=compress&cs=tinysrgb&w=400", qualifications: "MBBS, MD (Dermatology)" },
    { id: "dr-005", name: "Dr. Sanjay Patil", specialization: "Orthopedic Surgeon", experience: 18, rating: 4.8, reviews: 1560, consultationFee: 600, available: true, nextSlot: "Today, 7:30 PM", photo: "https://images.pexels.com/photos/6234600/pexels-photo-6234600.jpeg?auto=compress&cs=tinysrgb&w=400", qualifications: "MBBS, MS (Orthopedics)" },
    { id: "dr-006", name: "Dr. Sunita Rao", specialization: "Gynecologist", experience: 14, rating: 4.9, reviews: 1820, consultationFee: 500, available: true, nextSlot: "Tomorrow, 9:30 AM", photo: "https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=400", qualifications: "MBBS, MS (Gynecology)" }
];

app.get("/api/doctors", (req, res) => {
    res.json({
        success: true,
        doctors: doctors
    });
});

app.get("/api/doctors/:id", (req, res) => {
    const doctor = doctors.find(d => d.id === req.params.id);

    if (!doctor) {
        return res.status(404).json({
            success: false,
            message: "Doctor not found."
        });
    }

    res.json({
        success: true,
        doctor: doctor
    });
});

// ===============================
// BOOK APPOINTMENT
// ===============================

app.post("/api/appointments", authentication, (req, res) => {
    const {
        doctorId,
        doctorName,
        date,
        time,
        reason
    } = req.body;

    if (!doctorId || !date || !time) {
        return res.status(400).json({
            success: false,
            message: "Doctor, date and time are required."
        });
    }

    const doctor = doctors.find(d => d.id === doctorId);

    if (!doctor) {
        return res.status(404).json({
            success: false,
            message: "Doctor not found."
        });
    }

    const appointments = readData(appointmentsFile);

    const alreadyBooked = appointments.find(
        appointment =>
            appointment.doctorId === doctorId &&
            appointment.date === date &&
            appointment.time === time &&
            appointment.status === "Booked"
    );

    if (alreadyBooked) {
        return res.status(409).json({
            success: false,
            message: "This appointment time is already booked."
        });
    }

    const appointment = {
        id: crypto.randomUUID(),
        userId: req.userId,
        doctorId: doctorId,
        doctorName: doctorName || doctor.name,
        date: date,
        time: time,
        reason: reason || "",
        status: "Booked",
        createdAt: new Date().toISOString()
    };

    appointments.push(appointment);
    saveData(appointmentsFile, appointments);

    res.status(201).json({
        success: true,
        message: "Appointment booked successfully.",
        appointment: appointment
    });
});

// ===============================
// GET USER APPOINTMENTS
// ===============================

app.get("/api/appointments", authentication, (req, res) => {
    const appointments = readData(appointmentsFile);

    const userAppointments = appointments.filter(
        appointment => appointment.userId === req.userId
    );

    res.json({
        success: true,
        appointments: userAppointments
    });
});

// ===============================
// CANCEL APPOINTMENT
// ===============================

app.delete("/api/appointments/:id", authentication, (req, res) => {
    const appointments = readData(appointmentsFile);

    const appointment = appointments.find(
        a => a.id === req.params.id && a.userId === req.userId
    );

    if (!appointment) {
        return res.status(404).json({
            success: false,
            message: "Appointment not found."
        });
    }

    appointment.status = "Cancelled";

    saveData(appointmentsFile, appointments);

    res.json({
        success: true,
        message: "Appointment cancelled successfully."
    });
});

// ===============================
// ORDERS
// ===============================

app.post("/api/orders", authentication, (req, res) => {
    const {
        items,
        address,
        city,
        pincode,
        phone,
        paymentMethod,
        total
    } = req.body;

    if (!Array.isArray(items) || items.length === 0 || !address || !city || !pincode || !phone || !paymentMethod) {
        return res.status(400).json({
            success: false,
            message: "Please provide all order details."
        });
    }

    const orders = readData(ordersFile);

    const order = {
        id: "MS-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000),
        userId: req.userId,
        date: new Date().toISOString(),
        items: items,
        total: Number(total) || 0,
        status: "Order Received",
        pharmacy: "MediSwift Partner Pharmacy",
        address: address,
        city: city,
        pincode: pincode,
        phone: phone,
        paymentMethod: paymentMethod,
        estimatedDelivery: "15 mins"
    };

    orders.push(order);
    saveData(ordersFile, orders);

    res.status(201).json({
        success: true,
        message: "Order placed successfully.",
        order: order
    });
});

app.get("/api/orders", authentication, (req, res) => {
    const orders = readData(ordersFile);

    const userOrders = orders.filter(order => order.userId === req.userId);

    res.json({
        success: true,
        orders: userOrders
    });
});

// ===============================
// CONTACT FORM
// ===============================

app.post("/api/contact", (req, res) => {
    const {
        name,
        email,
        subject,
        message
    } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: "Name, email and message are required."
        });
    }

    const messages = readData(messagesFile);

    const newMessage = {
        id: crypto.randomUUID(),
        name: name,
        email: email,
        subject: subject || "",
        message: message,
        createdAt: new Date().toISOString()
    };

    messages.push(newMessage);
    saveData(messagesFile, messages);

    res.status(201).json({
        success: true,
        message: "Your message has been received."
    });
});


// ===============================
// CART (persisted on backend per browser)
// ===============================

function getCartClientId(req) {
    return String(req.headers["x-cart-id"] || "").trim();
}

function readCarts() {
    try {
        const value = JSON.parse(fs.readFileSync(cartsFile, "utf8"));
        return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (error) {
        return {};
    }
}

function saveCarts(carts) {
    fs.writeFileSync(cartsFile, JSON.stringify(carts, null, 2));
}

function requireCartId(req, res, next) {
    const cartId = getCartClientId(req);
    if (!cartId) {
        return res.status(400).json({ success: false, message: "Missing cart id." });
    }
    req.cartId = cartId;
    next();
}

app.get("/api/cart", requireCartId, (req, res) => {
    const carts = readCarts();
    res.json({ success: true, items: carts[req.cartId] || [] });
});

app.post("/api/cart", requireCartId, (req, res) => {
    const { medicineId, quantity } = req.body;
    if (!medicineId) {
        return res.status(400).json({ success: false, message: "medicineId is required." });
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const carts = readCarts();
    const items = carts[req.cartId] || [];
    const existing = items.find(item => item.medicineId === medicineId);

    if (existing) existing.quantity += qty;
    else items.push({ medicineId, quantity: qty });

    carts[req.cartId] = items;
    saveCarts(carts);
    res.status(201).json({ success: true, items });
});

app.put("/api/cart/:medicineId", requireCartId, (req, res) => {
    const carts = readCarts();
    const items = carts[req.cartId] || [];
    const item = items.find(i => i.medicineId === req.params.medicineId);
    if (!item) return res.status(404).json({ success: false, message: "Cart item not found." });

    const quantity = Number(req.body.quantity);
    if (!Number.isFinite(quantity)) {
        return res.status(400).json({ success: false, message: "Valid quantity is required." });
    }

    if (quantity <= 0) {
        carts[req.cartId] = items.filter(i => i.medicineId !== req.params.medicineId);
    } else {
        item.quantity = Math.min(99, Math.floor(quantity));
        carts[req.cartId] = items;
    }

    saveCarts(carts);
    res.json({ success: true, items: carts[req.cartId] });
});

app.delete("/api/cart/:medicineId", requireCartId, (req, res) => {
    const carts = readCarts();
    const items = carts[req.cartId] || [];
    carts[req.cartId] = items.filter(item => item.medicineId !== req.params.medicineId);
    saveCarts(carts);
    res.json({ success: true, items: carts[req.cartId] });
});

app.delete("/api/cart", requireCartId, (req, res) => {
    const carts = readCarts();
    carts[req.cartId] = [];
    saveCarts(carts);
    res.json({ success: true, items: [] });
});

// ===============================
// PRESCRIPTION SCANNING
// ===============================

const uploadsFolder = path.join(dataFolder, "uploads");
if (!fs.existsSync(uploadsFolder)) fs.mkdirSync(uploadsFolder);
app.use("/uploads", express.static(uploadsFolder));

app.post("/api/prescription", async (req, res) => {
    const { base64Image, mimeType } = req.body;
    if (!base64Image || !mimeType) {
        return res.status(400).json({ success: false, message: "Image data is required." });
    }

    try {
        const ext = mimeType.split('/')[1] || 'jpg';
        const filename = crypto.randomUUID() + "." + ext;
        const filepath = path.join(uploadsFolder, filename);
        fs.writeFileSync(filepath, Buffer.from(base64Image, "base64"));
        const imageUrl = `/uploads/${filename}`;

        const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
        const geminiModel = process.env.GEMINI_MODEL?.trim();

        console.log(`[ENDPOINT DIAGNOSTIC] KEY: ${!!geminiApiKey}, MODEL: ${!!geminiModel}, RAW_KEY_EXISTS: ${!!process.env.GEMINI_API_KEY}, RAW_MODEL_EXISTS: ${!!process.env.GEMINI_MODEL}`);

        if (!geminiApiKey || !geminiModel) {
            throw new Error("Gemini API key or model not configured on server.");
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': geminiApiKey
            },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [
                        {
                            text: 'Read this prescription image and return ONLY a JSON array of strings containing the names (and strengths if visible) of the medicines prescribed. Do not return any other text, markdown formatting, or explanation. Only return a valid JSON array like ["Medicine A 500mg", "Medicine B"].'
                        },
                        {
                            inline_data: { mime_type: mimeType, data: base64Image }
                        }
                    ]
                }]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error(`[GEMINI API ERROR] Status: ${response.status} - Message: ${data.error?.message || JSON.stringify(data)}`);
            throw new Error(`Gemini API Error: ${response.status} - ${data.error?.message || 'Request failed'}`);
        }

        let resultText = '';
        if (data.candidates && data.candidates[0]?.content?.parts) {
            data.candidates[0].content.parts.forEach(part => {
                if (part.text) resultText += part.text;
            });
        }

        let medicines = [];
        try {
            const cleanText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
            medicines = JSON.parse(cleanText);
            if (!Array.isArray(medicines)) medicines = [];
        } catch (e) {
            console.error("Failed to parse Gemini output as JSON:", resultText);
            throw new Error("Failed to parse medicines from the prescription.");
        }

        res.json({ success: true, medicines, imageUrl });
    } catch (error) {
        console.error("Prescription API Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===============================
// SERVE YOUR MEDISWIFT WEBSITE
// ===============================

const projectRoot = path.join(__dirname, "..");
// Serve the organized frontend folders at their original root URLs.
app.use(express.static(projectRoot));
app.use(express.static(path.join(projectRoot, "HTML_Files")));
app.use(express.static(path.join(projectRoot, "CSS_Files")));
app.use(express.static(path.join(projectRoot, "JavaScript_Files")));

// ===============================
// START SERVER
// ===============================

if (require.main === module) {
    app.listen(PORT, () => {
        console.log("");
        console.log("======================================");
        console.log("       MEDISWIFT RUNNING");
        console.log("======================================");
        console.log("");
        console.log(`Website: http://localhost:${PORT}`);
        console.log(`API:     http://localhost:${PORT}/api`);
        console.log("Storage: Local JSON fallback");
        console.log("");
    });
}

module.exports = app;