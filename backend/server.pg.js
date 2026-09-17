const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = Number(process.env.PORT || 3000);

const medicinesFile = path.join(__dirname, 'data', 'medicines.json');
const medicineImagesFolder = path.join(__dirname, 'data', 'medicine-images');

function readMedicines() {
  try {
    const value = JSON.parse(fs.readFileSync(medicinesFile, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error('Could not read medicines.json:', error.message);
    return [];
  }
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Cart-Id');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL is not set. Database routes will fail until it is configured.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

let schemaReady;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT NOT NULL DEFAULT '',
          address TEXT NOT NULL DEFAULT '',
          city TEXT NOT NULL DEFAULT '',
          pincode TEXT NOT NULL DEFAULT '',
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ
        );
        CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL
        );
        CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
        CREATE TABLE IF NOT EXISTS appointments (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          doctor_id TEXT NOT NULL,
          doctor_name TEXT NOT NULL,
          appointment_date TEXT NOT NULL,
          appointment_time TEXT NOT NULL,
          reason TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'Booked',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS appointments_user_idx ON appointments(user_id);
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          items JSONB NOT NULL,
          total NUMERIC(12,2) NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'Order Received',
          pharmacy TEXT NOT NULL DEFAULT 'MediSwift Partner Pharmacy',
          address TEXT NOT NULL,
          city TEXT NOT NULL,
          pincode TEXT NOT NULL,
          phone TEXT NOT NULL,
          payment_method TEXT NOT NULL,
          estimated_delivery TEXT NOT NULL DEFAULT '15 mins'
        );
        CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id);
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          subject TEXT NOT NULL DEFAULT '',
          message TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS cart_items (
          cart_id TEXT NOT NULL,
          medicine_id TEXT NOT NULL,
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (cart_id, medicine_id)
        );
      `);
    })().catch(err => {
      schemaReady = undefined;
      throw err;
    });
  }
  return schemaReady;
}

app.use('/api', async (req, res, next) => {
  try {
    await ensureSchema();
    next();
  } catch (err) {
    console.error('Database initialization error:', err.message);
    res.status(503).json({ success: false, message: 'Database is not configured or unavailable.' });
  }
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function checkPassword(password, storedPassword) {
  try {
    const [salt, storedHash] = String(storedPassword || '').split(':');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch { return false; }
}
async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const days = Math.max(1, Number(process.env.SESSION_TTL_DAYS || 30));
  const expires = new Date(Date.now() + days * 86400000);
  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
  await pool.query('INSERT INTO sessions(token,user_id,expires_at) VALUES($1,$2,$3)', [token, userId, expires]);
  return token;
}
async function authentication(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ success:false, message:'Please login first.' });
    const token = header.slice(7);
    const { rows } = await pool.query('SELECT user_id FROM sessions WHERE token=$1 AND expires_at > NOW()', [token]);
    if (!rows[0]) return res.status(401).json({ success:false, message:'Invalid or expired login session.' });
    req.userId = rows[0].user_id;
    req.sessionToken = token;
    next();
  } catch (err) { next(err); }
}

app.get('/api', (req, res) => res.json({ success:true, message:'MediSwift backend is running with PostgreSQL!' }));

// Medicine catalogue remains file-backed so local JSON and PostgreSQL modes use the same catalogue.
app.get('/api/medicines', (req, res) => res.json({ success:true, medicines:readMedicines() }));
app.get('/api/medicine-images/:filename', (req, res) => {
  const filename = path.basename(req.params.filename || '');
  if (!filename) return res.status(404).json({ success:false, message:'Image not found.' });
  const filePath = path.join(medicineImagesFolder, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success:false, message:'Image not found.' });
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(filePath);
});

app.post('/api/register', async (req, res, next) => {
  try {
    const { name, email, password, phone, address, city, pincode } = req.body;
    if (!name || !email || !password || !phone || !address || !city || !pincode) return res.status(400).json({ success:false, message:'Please fill all required registration details.' });
    const cleanPhone=String(phone).trim(), cleanPincode=String(pincode).trim(), cleanEmail=String(email).trim().toLowerCase();
    if (!/^\d{10}$/.test(cleanPhone)) return res.status(400).json({ success:false, message:'Please enter a valid 10-digit phone number.' });
    if (!/^\d{6}$/.test(cleanPincode)) return res.status(400).json({ success:false, message:'Please enter a valid 6-digit pincode.' });
    if (String(password).length < 6) return res.status(400).json({ success:false, message:'Password must contain at least 6 characters.' });
    const id=crypto.randomUUID();
    const result = await pool.query(`INSERT INTO users(id,name,email,phone,address,city,pincode,password_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,name,email,phone,address,city,pincode,created_at`, [id,String(name).trim().slice(0,80),cleanEmail,cleanPhone,String(address).trim().slice(0,180),String(city).trim().slice(0,80),cleanPincode,hashPassword(password)]);
    res.status(201).json({ success:true, message:'Account created successfully.', user: mapUser(result.rows[0]) });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success:false, message:'An account with this email already exists.' });
    next(err);
  }
});

app.post('/api/login', async (req,res,next)=>{
  try {
    const { email,password }=req.body;
    if(!email||!password) return res.status(400).json({success:false,message:'Email and password are required.'});
    const {rows}=await pool.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1',[email]);
    const user=rows[0];
    if(!user||!checkPassword(password,user.password_hash)) return res.status(401).json({success:false,message:'Incorrect email or password.'});
    const token=await createSession(user.id);
    res.json({success:true,message:'Login successful.',token,user:mapUser(user)});
  } catch(err){next(err)}
});

app.post('/api/logout', authentication, async (req,res,next)=>{ try { await pool.query('DELETE FROM sessions WHERE token=$1',[req.sessionToken]); res.json({success:true,message:'Logged out successfully.'}); } catch(err){next(err)} });

function mapUser(u){ return {id:u.id,name:u.name,email:u.email,phone:u.phone||'',address:u.address||'',city:u.city||'',pincode:u.pincode||'',createdAt:u.created_at}; }
app.get('/api/profile', authentication, async (req,res,next)=>{ try { const {rows}=await pool.query('SELECT * FROM users WHERE id=$1',[req.userId]); if(!rows[0])return res.status(404).json({success:false,message:'User not found.'}); res.json({success:true,user:mapUser(rows[0])}); }catch(err){next(err)} });
app.put('/api/profile', authentication, async (req,res,next)=>{ try { const {name,email,phone,address,city,pincode}=req.body; if(!name||!email)return res.status(400).json({success:false,message:'Name and email are required.'}); const cleanEmail=String(email).trim().toLowerCase(); const {rows}=await pool.query(`UPDATE users SET name=$1,email=$2,phone=$3,address=$4,city=$5,pincode=$6,updated_at=NOW() WHERE id=$7 RETURNING *`,[String(name).trim().slice(0,80),cleanEmail,String(phone||'').trim().slice(0,20),String(address||'').trim().slice(0,180),String(city||'').trim().slice(0,80),String(pincode||'').trim().slice(0,12),req.userId]); if(!rows[0])return res.status(404).json({success:false,message:'User not found.'}); res.json({success:true,message:'Profile updated successfully.',user:mapUser(rows[0])}); }catch(err){ if(err.code==='23505')return res.status(409).json({success:false,message:'That email is already used by another account.'}); next(err)} });
app.post('/api/change-password', authentication, async (req,res,next)=>{ try { const {currentPassword,newPassword}=req.body; if(!currentPassword||!newPassword)return res.status(400).json({success:false,message:'Current and new password are required.'}); if(String(newPassword).length<6)return res.status(400).json({success:false,message:'New password must contain at least 6 characters.'}); const {rows}=await pool.query('SELECT password_hash FROM users WHERE id=$1',[req.userId]); if(!rows[0]||!checkPassword(currentPassword,rows[0].password_hash))return res.status(401).json({success:false,message:'Current password is incorrect.'}); await pool.query('UPDATE users SET password_hash=$1,updated_at=NOW() WHERE id=$2',[hashPassword(newPassword),req.userId]); res.json({success:true,message:'Password changed successfully.'}); }catch(err){next(err)} });

const doctors = [
  { id:'dr-001',name:'Dr. Anil Sharma',specialization:'General Physician',experience:15,rating:4.9,reviews:1240,consultationFee:300,available:true,nextSlot:'Today, 4:30 PM',photo:'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=400',qualifications:'MBBS, MD (Internal Medicine)' },
  { id:'dr-002',name:'Dr. Priya Deshmukh',specialization:'Pediatrician',experience:12,rating:4.8,reviews:980,consultationFee:400,available:true,nextSlot:'Today, 5:15 PM',photo:'https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=400',qualifications:'MBBS, MD (Pediatrics)' },
  { id:'dr-003',name:'Dr. Rajesh Kulkarni',specialization:'Cardiologist',experience:22,rating:4.9,reviews:2150,consultationFee:800,available:false,nextSlot:'Tomorrow, 11:00 AM',photo:'https://images.pexels.com/photos/6234600/pexels-photo-6234600.jpeg?auto=compress&cs=tinysrgb&w=400',qualifications:'MBBS, MD, DM (Cardiology)' },
  { id:'dr-004',name:'Dr. Meera Joshi',specialization:'Dermatologist',experience:10,rating:4.7,reviews:760,consultationFee:500,available:true,nextSlot:'Today, 6:00 PM',photo:'https://images.pexels.com/photos/5214949/pexels-photo-5214949.jpeg?auto=compress&cs=tinysrgb&w=400',qualifications:'MBBS, MD (Dermatology)' },
  { id:'dr-005',name:'Dr. Sanjay Patil',specialization:'Orthopedic Surgeon',experience:18,rating:4.8,reviews:1560,consultationFee:600,available:true,nextSlot:'Today, 7:30 PM',photo:'https://images.pexels.com/photos/6234600/pexels-photo-6234600.jpeg?auto=compress&cs=tinysrgb&w=400',qualifications:'MBBS, MS (Orthopedics)' },
  { id:'dr-006',name:'Dr. Sunita Rao',specialization:'Gynecologist',experience:14,rating:4.9,reviews:1820,consultationFee:500,available:true,nextSlot:'Tomorrow, 9:30 AM',photo:'https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=400',qualifications:'MBBS, MS (Gynecology)' }
];
app.get('/api/doctors',(req,res)=>res.json({success:true,doctors}));
app.get('/api/doctors/:id',(req,res)=>{const d=doctors.find(x=>x.id===req.params.id); if(!d)return res.status(404).json({success:false,message:'Doctor not found.'}); res.json({success:true,doctor:d})});

app.post('/api/appointments', authentication, async (req,res,next)=>{ try { const {doctorId,doctorName,date,time,reason}=req.body; if(!doctorId||!date||!time)return res.status(400).json({success:false,message:'Doctor, date and time are required.'}); const doctor=doctors.find(d=>d.id===doctorId); if(!doctor)return res.status(404).json({success:false,message:'Doctor not found.'}); const clash=await pool.query(`SELECT 1 FROM appointments WHERE doctor_id=$1 AND appointment_date=$2 AND appointment_time=$3 AND status='Booked' LIMIT 1`,[doctorId,date,time]); if(clash.rows[0])return res.status(409).json({success:false,message:'This appointment time is already booked.'}); const id=crypto.randomUUID(); const {rows}=await pool.query(`INSERT INTO appointments(id,user_id,doctor_id,doctor_name,appointment_date,appointment_time,reason) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[id,req.userId,doctorId,doctorName||doctor.name,date,time,reason||'']); res.status(201).json({success:true,message:'Appointment booked successfully.',appointment:mapAppointment(rows[0])}); }catch(err){next(err)} });
function mapAppointment(a){return {id:a.id,userId:a.user_id,doctorId:a.doctor_id,doctorName:a.doctor_name,date:a.appointment_date,time:a.appointment_time,reason:a.reason,status:a.status,createdAt:a.created_at}}
app.get('/api/appointments',authentication,async(req,res,next)=>{try{const {rows}=await pool.query('SELECT * FROM appointments WHERE user_id=$1 ORDER BY created_at DESC',[req.userId]);res.json({success:true,appointments:rows.map(mapAppointment)})}catch(err){next(err)}});
app.delete('/api/appointments/:id',authentication,async(req,res,next)=>{try{const {rowCount}=await pool.query(`UPDATE appointments SET status='Cancelled' WHERE id=$1 AND user_id=$2`,[req.params.id,req.userId]);if(!rowCount)return res.status(404).json({success:false,message:'Appointment not found.'});res.json({success:true,message:'Appointment cancelled successfully.'})}catch(err){next(err)}});

function mapOrder(o){return {id:o.id,userId:o.user_id,date:o.order_date,items:o.items,total:Number(o.total),status:o.status,pharmacy:o.pharmacy,address:o.address,city:o.city,pincode:o.pincode,phone:o.phone,paymentMethod:o.payment_method,estimatedDelivery:o.estimated_delivery}}
app.post('/api/orders',authentication,async(req,res,next)=>{try{const {items,address,city,pincode,phone,paymentMethod,total}=req.body;if(!Array.isArray(items)||!items.length||!address||!city||!pincode||!phone||!paymentMethod)return res.status(400).json({success:false,message:'Please provide all order details.'});const id='MS-'+new Date().getFullYear()+'-'+crypto.randomInt(100000,999999);const {rows}=await pool.query(`INSERT INTO orders(id,user_id,items,total,address,city,pincode,phone,payment_method) VALUES($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9) RETURNING *`,[id,req.userId,JSON.stringify(items),Number(total)||0,address,city,pincode,phone,paymentMethod]);res.status(201).json({success:true,message:'Order placed successfully.',order:mapOrder(rows[0])})}catch(err){next(err)}});
app.get('/api/orders',authentication,async(req,res,next)=>{try{const {rows}=await pool.query('SELECT * FROM orders WHERE user_id=$1 ORDER BY order_date DESC',[req.userId]);res.json({success:true,orders:rows.map(mapOrder)})}catch(err){next(err)}});

app.post('/api/contact',async(req,res,next)=>{try{const {name,email,subject,message}=req.body;if(!name||!email||!message)return res.status(400).json({success:false,message:'Name, email and message are required.'});await pool.query('INSERT INTO messages(id,name,email,subject,message) VALUES($1,$2,$3,$4,$5)',[crypto.randomUUID(),name,email,subject||'',message]);res.status(201).json({success:true,message:'Your message has been received.'})}catch(err){next(err)}});

function cartId(req){return String(req.headers['x-cart-id']||'').trim()}
function requireCartId(req,res,next){const id=cartId(req);if(!id)return res.status(400).json({success:false,message:'Missing cart id.'});req.cartId=id;next()}
app.get('/api/cart',requireCartId,async(req,res,next)=>{try{const {rows}=await pool.query('SELECT medicine_id,quantity FROM cart_items WHERE cart_id=$1 ORDER BY updated_at',[req.cartId]);res.json({success:true,items:rows.map(r=>({medicineId:r.medicine_id,quantity:r.quantity}))})}catch(err){next(err)}});
app.post('/api/cart',requireCartId,async(req,res,next)=>{try{const {medicineId,quantity}=req.body;if(!medicineId)return res.status(400).json({success:false,message:'medicineId is required.'});const qty=Math.max(1,Math.floor(Number(quantity)||1));await pool.query(`INSERT INTO cart_items(cart_id,medicine_id,quantity) VALUES($1,$2,$3) ON CONFLICT(cart_id,medicine_id) DO UPDATE SET quantity=LEAST(99,cart_items.quantity+EXCLUDED.quantity),updated_at=NOW()`,[req.cartId,medicineId,qty]);return sendCart(req,res)}catch(err){next(err)}});
app.put('/api/cart/:medicineId',requireCartId,async(req,res,next)=>{try{const q=Number(req.body.quantity);if(!Number.isFinite(q))return res.status(400).json({success:false,message:'Valid quantity is required.'});if(q<=0)await pool.query('DELETE FROM cart_items WHERE cart_id=$1 AND medicine_id=$2',[req.cartId,req.params.medicineId]);else{const r=await pool.query('UPDATE cart_items SET quantity=$1,updated_at=NOW() WHERE cart_id=$2 AND medicine_id=$3',[Math.min(99,Math.floor(q)),req.cartId,req.params.medicineId]);if(!r.rowCount)return res.status(404).json({success:false,message:'Cart item not found.'})}return sendCart(req,res)}catch(err){next(err)}});
app.delete('/api/cart/:medicineId',requireCartId,async(req,res,next)=>{try{await pool.query('DELETE FROM cart_items WHERE cart_id=$1 AND medicine_id=$2',[req.cartId,req.params.medicineId]);return sendCart(req,res)}catch(err){next(err)}});
app.delete('/api/cart',requireCartId,async(req,res,next)=>{try{await pool.query('DELETE FROM cart_items WHERE cart_id=$1',[req.cartId]);res.json({success:true,items:[]})}catch(err){next(err)}});
async function sendCart(req,res){const {rows}=await pool.query('SELECT medicine_id,quantity FROM cart_items WHERE cart_id=$1 ORDER BY updated_at',[req.cartId]);res.json({success:true,items:rows.map(r=>({medicineId:r.medicine_id,quantity:r.quantity}))})}

const uploadsFolder = path.join(__dirname, "data", "uploads");
if (!fs.existsSync(uploadsFolder)) fs.mkdirSync(uploadsFolder, { recursive: true });
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
            throw new Error(data.error?.message || 'Gemini API request failed.');
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

const projectRoot = path.join(__dirname,'..');
app.use(express.static(projectRoot));
app.use(express.static(path.join(projectRoot,'HTML_Files')));
app.use(express.static(path.join(projectRoot,'CSS_Files')));
app.use(express.static(path.join(projectRoot,'JavaScript_Files')));

app.use((err,req,res,next)=>{console.error(err);res.status(500).json({success:false,message:'Server error. Please try again.'})});

if (require.main === module) {
  app.listen(PORT,()=>{
    console.log('');
    console.log('======================================');
    console.log('       MEDISWIFT BACKEND RUNNING');
    console.log('======================================');
    console.log(`Website: http://localhost:${PORT}`);
    console.log(`API:     http://localhost:${PORT}/api`);
    console.log('');
  });
}

module.exports = app;
