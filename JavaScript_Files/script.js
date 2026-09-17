// AI API keys should not be stored in browser code. Keep them on the server.
/* ========================================
   MediSwift AI — script.js
   All data, cart logic, UI interactions,
   filtering, chat, and animations
   ======================================== */

// ==================== DATA ====================

// Medicine catalogue is loaded from the backend.
// Do not put catalogue records or medicine image paths in frontend code.
let medicines = [];
let medicinesLoadError = null;

const API_BASE = (window.location && window.location.protocol === 'file:')
  ? 'http://localhost:3000/api'
  : '/api';

async function loadMedicines() {
  try {
    const response = await fetch(API_BASE + '/medicines', { cache: 'no-store' });
    const data = await response.json().catch(function() { return {}; });
    if (!response.ok || !Array.isArray(data.medicines)) {
      throw new Error(data.message || 'Could not load medicines from the backend.');
    }
    medicines = data.medicines;
    medicinesLoadError = null;
    return medicines;
  } catch (error) {
    medicinesLoadError = error;
    console.error('Medicine catalogue load failed:', error);
    medicines = [];
    return medicines;
  }
}

// Other frontend scripts can wait for the same request instead of racing it.
window.mediswiftMedicinesReady = loadMedicines();

const pharmacies = [
  { id: 'ph-001', name: 'Shree Medical Store', address: 'Stern-Cross Rd, Nanded City, Shivaji Nagar', rating: 4.8, distanceKm: 0.8, open24Hours: true, deliveryMins: 12, ordersCompleted: 3240 },
  { id: 'ph-002', name: 'Apollo Pharmacy', address: 'Gurudwara Rd, Nanded, CIDCO', rating: 4.7, distanceKm: 1.4, open24Hours: true, deliveryMins: 18, ordersCompleted: 5180 },
  { id: 'ph-003', name: 'Carewell Pharma', address: 'Asarja Marg, Vazirabad, Nanded', rating: 4.6, distanceKm: 2.1, open24Hours: false, deliveryMins: 22, ordersCompleted: 1890 },
  { id: 'ph-4', name: 'MediPlus 24x7', address: 'Station Road, Taroda, Nanded', rating: 4.5, distanceKm: 2.8, open24Hours: true, deliveryMins: 15, ordersCompleted: 4120 },
  { id: 'ph-005', name: 'Lifeline Chemists', address: 'Shivaji Chowk, Nanded City', rating: 4.9, distanceKm: 0.5, open24Hours: false, deliveryMins: 10, ordersCompleted: 6700 },
];

const doctors = [
  { id: 'dr-001', name: 'Dr. Anil Sharma', specialization: 'General Physician', experience: 15, rating: 4.9, reviews: 1240, consultationFee: 300, available: true, nextSlot: 'Today, 4:30 PM', photo: 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=400', qualifications: 'MBBS, MD (Internal Medicine)' },
  { id: 'dr-002', name: 'Dr. Priya Deshmukh', specialization: 'Pediatrician', experience: 12, rating: 4.8, reviews: 980, consultationFee: 400, available: true, nextSlot: 'Today, 5:15 PM', photo: 'https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=400', qualifications: 'MBBS, MD (Pediatrics)' },
  { id: 'dr-003', name: 'Dr. Rajesh Kulkarni', specialization: 'Cardiologist', experience: 22, rating: 4.9, reviews: 2150, consultationFee: 800, available: false, nextSlot: 'Tomorrow, 11:00 AM', photo: 'https://images.pexels.com/photos/6234600/pexels-photo-6234600.jpeg?auto=compress&cs=tinysrgb&w=400', qualifications: 'MBBS, MD, DM (Cardiology)' },
  { id: 'dr-004', name: 'Dr. Meera Joshi', specialization: 'Dermatologist', experience: 10, rating: 4.7, reviews: 760, consultationFee: 500, available: true, nextSlot: 'Today, 6:00 PM', photo: 'https://images.pexels.com/photos/5214949/pexels-photo-5214949.jpeg?auto=compress&cs=tinysrgb&w=400', qualifications: 'MBBS, MD (Dermatology)' },
  { id: 'dr-005', name: 'Dr. Sanjay Patil', specialization: 'Orthopedic Surgeon', experience: 18, rating: 4.8, reviews: 1560, consultationFee: 600, available: true, nextSlot: 'Today, 7:30 PM', photo: 'https://images.pexels.com/photos/6234600/pexels-photo-6234600.jpeg?auto=compress&cs=tinysrgb&w=400', qualifications: 'MBBS, MS (Orthopedics)' },
  { id: 'dr-006', name: 'Dr. Sunita Rao', specialization: 'Gynecologist', experience: 14, rating: 4.9, reviews: 1820, consultationFee: 500, available: true, nextSlot: 'Tomorrow, 9:30 AM', photo: 'https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=400', qualifications: 'MBBS, MS (Gynecology)' },
];

const orders = [
  { id: 'MS-2024-8842', date: '2024-08-01', items: [ { medicineId: 'med-001', name: 'Paracetamol 650mg', price: 28, quantity: 2, image: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=100' }, { medicineId: 'med-002', name: 'Azithromycin 500mg', price: 92, quantity: 1, image: 'https://images.pexels.com/photos/3683056/pexels-photo-3683056.jpeg?auto=compress&cs=tinysrgb&w=100' } ], total: 148, status: 'Out For Delivery', pharmacy: 'Shree Medical Store', address: '12, Shivaji Nagar, Nanded', paymentMethod: 'UPI', estimatedDelivery: '15 mins' },
  { id: 'MS-2024-8721', date: '2024-07-28', items: [ { medicineId: 'med-003', name: 'Vitamin C 1000mg', price: 120, quantity: 1, image: 'https://images.pexels.com/photos/3683098/pexels-photo-3683098.jpeg?auto=compress&cs=tinysrgb&w=100' }, { medicineId: 'med-010', name: 'Multivitamin Tablets', price: 240, quantity: 1, image: 'https://images.pexels.com/photos/3683098/pexels-photo-3683098.jpeg?auto=compress&cs=tinysrgb&w=100' } ], total: 360, status: 'Delivered', pharmacy: 'Apollo Pharmacy', address: '12, Shivaji Nagar, Nanded', paymentMethod: 'Card', estimatedDelivery: 'Delivered' },
  { id: 'MS-2024-8650', date: '2024-07-22', items: [ { medicineId: 'med-004', name: 'Cough Syrup 100ml', price: 65, quantity: 1, image: 'https://images.pexels.com/photos/3683082/pexels-photo-3683082.jpeg?auto=compress&cs=tinysrgb&w=100' } ], total: 80, status: 'Delivered', pharmacy: 'Lifeline Chemists', address: '12, Shivaji Nagar, Nanded', paymentMethod: 'Cash on Delivery', estimatedDelivery: 'Delivered' },
];

const orderTimeline = [
  { status: 'Order Received', description: 'Your order has been placed successfully.' },
  { status: 'Prescription Verified', description: 'AI verified your prescription. Approved by partner pharmacy.' },
  { status: 'Packed', description: 'Medicines packed and quality-checked at the pharmacy.' },
  { status: 'Out For Delivery', description: 'Rider has picked up your order and is on the way.' },
  { status: 'Delivered', description: 'Order delivered. Thank you for using MediSwift AI!' },
];

const testimonials = [
  { id: 1, name: 'Aarav Patil', role: 'Nanded City', rating: 5, text: 'MediSwift AI delivered my medicines in just 14 minutes! The prescription scanner is incredibly accurate. This is the future of pharmacy.', photo: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100' },
  { id: 2, name: 'Sneha Sharma', role: 'CIDCO, Nanded', rating: 5, text: "I uploaded my father's prescription and the AI verified it instantly. The medicine list matched exactly. Super convenient for elderly care.", photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100' },
  { id: 3, name: 'Rohan Deshmukh', role: 'Shivaji Nagar', rating: 5, text: 'The AI medicine assistant explained my dosage and side effects clearly. The live tracking kept me updated the whole time. Brilliant app.', photo: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100' },
  { id: 4, name: 'Anjali Kulkarni', role: 'Vazirabad, Nanded', rating: 5, text: 'Consulted a doctor online at 11 PM and got my medicines delivered the same night. MediSwift AI is a lifesaver for working professionals.', photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100' },
];

const aiAssistantSuggestions = [
  'Find nearby pharmacies',
  'Explain my prescription',
  'Medicine dosage',
  'Side effects',
  'Order status',
  'Consult a doctor',
];

const COUPONS = { MEDISWIFT10: 10, NANDED20: 20, FIRST15: 15 };

// ==================== STATE ====================

let cart = [];
let user = null;
let activeCategory = 'All';
let sortBy = 'relevance';
let searchQuery = '';
let doctorQuery = '';
let doctorFilter = 'all';
let selectedOrderId = orders[0].id;
let selectedPayment = 'UPI';
let appliedCoupon = null;
let chatMessages = [];
let panelChatMessages = [];
let analysisStage = 0;
let analysisDone = false;

// ==================== HELPERS ====================

function formatINR(val) { return '\u20B9' + val.toLocaleString('en-IN'); }
function formatDate(dateStr) { return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function getTime() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
function generateOrderId() { return 'MS-2024-' + Math.floor(1000 + Math.random() * 9000); }

function svgIcon(name) {
  var icons = {
    ScanLine: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/>',
    Stethoscope: '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .2.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
    Truck: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    ShieldCheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    Building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    MapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    Upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    Check: '<polyline points="20 6 9 17 4 12"/>',
    Pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
    ArrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    Star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    Clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    Bot: '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/>',
    User: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    Phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    Bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/>',
    Package: '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
    Home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    FlaskConical: '<path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/>',
    Syringe: '<path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15.5 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m10 4 4 4"/>',
    Apple: '<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>',
    Send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    Trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    Minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
    Plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    Video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
    Calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    BadgeCheck: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
    Sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    AlertCircle: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    ShoppingCart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    FileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    BadgeCheckAlt: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    TrendingUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    Loader: '<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>',
  };
  return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (icons[name] || '') + '</svg>';
}

// ==================== NAV SEARCH ====================
function initNavSearch() {
  var input = document.getElementById('navSearchInput');
  var dropdown = document.getElementById('navSearchDropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', function() {
    var q = input.value.trim().toLowerCase();
    if (!q) { dropdown.classList.remove('show'); return; }
    var medResults = medicines.filter(function(m) { return m.name.toLowerCase().includes(q) || m.manufacturer.toLowerCase().includes(q); }).slice(0, 5);
    var docResults = doctors.filter(function(d) { return d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q); }).slice(0, 3);
    var html = '';
    if (medResults.length > 0) {
      html += '<div class="search-dropdown-section-label">Medicines</div>';
      html += medResults.map(function(m) {
        return '<div class="search-dropdown-item" onclick="navSearchGoToMedicine(\'' + m.id + '\')"><div class="search-dropdown-item-icon">' + svgIcon('Pill') + '</div><div class="search-dropdown-item-info"><p class="search-dropdown-item-name">' + m.name + '</p><p class="search-dropdown-item-sub">' + m.manufacturer + ' • ' + m.category + '</p></div><span class="search-dropdown-item-price">' + formatINR(m.price) + '</span></div>';
      }).join('');
    }
    if (docResults.length > 0) {
      html += '<div class="search-dropdown-section-label">Doctors</div>';
      html += docResults.map(function(d) {
        return '<div class="search-dropdown-item" onclick="navSearchGoToDoctor()"><div class="search-dropdown-item-icon">' + svgIcon('Stethoscope') + '</div><div class="search-dropdown-item-info"><p class="search-dropdown-item-name">' + d.name + '</p><p class="search-dropdown-item-sub">' + d.specialization + ' • ' + formatINR(d.consultationFee) + '</p></div></div>';
      }).join('');
    }
    if (!html) html = '<div class="search-dropdown-empty">No results found for "' + q + '"</div>';
    dropdown.innerHTML = html;
    dropdown.classList.add('show');
  });

  input.addEventListener('focus', function() { if (input.value.trim()) dropdown.classList.add('show'); });
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-search-wrap')) dropdown.classList.remove('show');
  });

  var mobileInput = document.getElementById('mobileSearchInput');
  if (mobileInput) {
    mobileInput.addEventListener('input', function() {
      var q = mobileInput.value.trim().toLowerCase();
      if (!q) return;
      searchQuery = q;
      activeCategory = 'All';
      closeMobileMenu();
      document.getElementById('store').scrollIntoView({ behavior: 'smooth' });
      var medSearch = document.getElementById('medicineSearch');
      if (medSearch) { medSearch.value = q; document.getElementById('searchClear').style.display = 'block'; }
      renderMedicines();
    });
  }
}

function navSearchGoToMedicine(medId) {
  var dropdown = document.getElementById('navSearchDropdown');
  dropdown.classList.remove('show');
  document.getElementById('navSearchInput').value = '';
  searchQuery = '';
  activeCategory = 'All';
  var medSearch = document.getElementById('medicineSearch');
  if (medSearch) medSearch.value = '';
  document.getElementById('store').scrollIntoView({ behavior: 'smooth' });
  addToCart(medId);
}

function navSearchGoToDoctor() {
  var dropdown = document.getElementById('navSearchDropdown');
  dropdown.classList.remove('show');
  document.getElementById('navSearchInput').value = '';
  document.getElementById('doctors').scrollIntoView({ behavior: 'smooth' });
}

// ==================== TRUST STRIP ====================

function renderTrustStrip() {
  var items = [
    { icon: 'BadgeCheck', text: 'Verified Doctors', color: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))' },
    { icon: 'Building', text: 'Licensed Pharmacies', color: 'linear-gradient(135deg, var(--success-500), var(--success-700))' },
    { icon: 'ScanLine', text: 'AI Prescription Verification', color: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))' },
    { icon: 'ShieldCheck', text: 'Secure Payments', color: 'linear-gradient(135deg, var(--brand-600), var(--accent-600))' },
    { icon: 'Phone', text: 'Emergency Support 24×7', color: 'linear-gradient(135deg, var(--red-600), var(--red-800))' },
  ];
  document.getElementById('trustStripGrid').innerHTML = items.map(function(t) {
    return '<div class="card trust-card reveal"><div class="trust-card-icon" style="background:' + t.color + '">' + svgIcon(t.icon) + '</div><span class="trust-card-text">' + t.text + '</span></div>';
  }).join('');
}

// ==================== QUICK ACTIONS ====================

function renderQuickActions() {
  var actions = [
    { cls: 'qa-upload', icon: 'Upload', title: 'Upload Prescription', desc: 'AI scans & verifies in seconds', href: '#upload', color: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))' },
    { cls: 'qa-order', icon: 'ShoppingCart', title: 'Order Medicines', desc: '15-min delivery from nearby stores', href: '#store', color: 'linear-gradient(135deg, var(--success-500), var(--success-700))' },
    { cls: 'qa-consult', icon: 'Stethoscope', title: 'Consult Doctor', desc: 'Video consult verified doctors', href: '#doctors', color: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))' },
    { cls: 'qa-emergency', icon: 'Phone', title: 'Emergency Help', desc: 'Call ambulance 102 instantly', href: '#emergency', color: 'linear-gradient(135deg, var(--red-600), var(--red-800))', isEmergency: true },
  ];
  document.getElementById('quickActionsGrid').innerHTML = actions.map(function(a) {
    return '<a href="' + a.href + '" class="quick-action-card ' + a.cls + ' reveal"' + (a.isEmergency ? ' id="qaEmergency"' : '') + '><div class="quick-action-icon" style="background:' + a.color + '">' + svgIcon(a.icon) + '</div><h3 class="quick-action-title">' + a.title + '</h3><p class="quick-action-desc">' + a.desc + '</p><span class="quick-action-arrow">Get started ' + svgIcon('ArrowRight') + '</span></a>';
  }).join('');
}

// ==================== FLOATING CHAT PANEL ====================

function initFloatingChat() {
  var fabAi = document.getElementById('fabAi');
  var panel = document.getElementById('chatPanel');
  var closeBtn = document.getElementById('chatPanelClose');

  fabAi.addEventListener('click', function() {
    panel.classList.toggle('open');
    fabAi.classList.toggle('active');
    if (panel.classList.contains('open')) initPanelChat();
  });
  closeBtn.addEventListener('click', function() {
    panel.classList.remove('open');
    fabAi.classList.remove('active');
  });

  document.getElementById('chatPanelForm').addEventListener('submit', function(e) {
    e.preventDefault();
    sendPanelMessage(document.getElementById('chatPanelInput').value);
  });
}

function initPanelChat() {
  if (panelChatMessages.length === 0) {
    panelChatMessages = [{ id: 'p-init', role: 'assistant', text: "Hi! I'm your AI Medicine Assistant. Ask me about medicines, dosage, side effects, or find nearby pharmacies.", time: getTime() }];
  }
  renderPanelChat();
  renderPanelSuggestions();
}

function renderPanelChat() {
  var container = document.getElementById('chatPanelMessages');
  container.innerHTML = panelChatMessages.map(function(msg) {
    return '<div class="chat-msg ' + msg.role + '"><div class="chat-msg-avatar ' + msg.role + '">' + svgIcon(msg.role === 'user' ? 'User' : 'Bot') + '</div><div class="chat-msg-bubble ' + msg.role + '">' + msg.text + '</div></div>';
  }).join('');
  container.scrollTop = container.scrollHeight;
}

function renderPanelSuggestions() {
  var suggestions = ['Find nearby pharmacies', 'Medicine dosage', 'Side effects', 'Order status', 'Consult a doctor'];
  document.getElementById('chatPanelSuggestions').innerHTML = suggestions.map(function(s) {
    return '<button class="chat-panel-suggestion-chip" onclick="sendPanelMessage(\'' + s.replace(/'/g, "\\'") + '\')">' + s + '</button>';
  }).join('');
}

function sendPanelMessage(text) {
  if (!text || !text.trim()) return;
  panelChatMessages.push({ id: 'pu-' + Date.now(), role: 'user', text: text, time: getTime() });
  document.getElementById('chatPanelInput').value = '';
  renderPanelChat();
  var container = document.getElementById('chatPanelMessages');
  var typingEl = document.createElement('div');
  typingEl.className = 'chat-msg bot';
  typingEl.id = 'panelTyping';
  typingEl.innerHTML = '<div class="chat-msg-avatar bot">' + svgIcon('Bot') + '</div><div class="chat-msg-bubble bot"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
  container.appendChild(typingEl);
  container.scrollTop = container.scrollHeight;
  setTimeout(function() {
    var el = document.getElementById('panelTyping');
    if (el) el.remove();
    var response = getPanelResponse(text);
    panelChatMessages.push({ id: 'pa-' + Date.now(), role: 'assistant', text: response, time: getTime() });
    renderPanelChat();
  }, 1000);
}

function getPanelResponse(question) {
  var q = question.toLowerCase();
  if (q.includes('nearby') || q.includes('pharmac')) return 'There are 5 verified pharmacies near you in Nanded. The closest is Lifeline Chemists (0.5 km, ~10 min delivery) and Shree Medical Store (0.8 km, ~12 min delivery). Scroll to the "Nearby pharmacies" section to see all options.';
  if (q.includes('prescription')) return 'You can upload your prescription by clicking the "Upload Prescription" button. Our AI will scan it, extract medicines, and verify the doctor\u2019s credentials \u2014 usually within 30 seconds.';
  if (q.includes('order status') || q.includes('track')) return 'You can track your order in real-time from the "Track Your Order" section. You\u2019ll see each stage: Order Received \u2192 Prescription Verified \u2192 Packed \u2192 Out For Delivery \u2192 Delivered, with live rider location.';
  if (q.includes('consult') || q.includes('doctor')) return 'You can consult verified doctors online from the "Doctor Consultation" section. General physicians, pediatricians, cardiologists, and more are available. Fees start from \u20B9300. Book a video consult in seconds.';
  return getAssistantResponse(question);
}

// ==================== EMERGENCY BUTTON ====================

function initEmergency() {
  document.getElementById('fabEmergency').addEventListener('click', function() {
    openModal('emergencyModal');
  });
  document.getElementById('emergencyCancel').addEventListener('click', function() {
    closeModal('emergencyModal');
  });
  var qaEmergency = document.getElementById('qaEmergency');
  if (qaEmergency) {
    qaEmergency.addEventListener('click', function(e) {
      e.preventDefault();
      openModal('emergencyModal');
    });
  }
}

// ==================== CART LOGIC ====================

function addToCart(medId) {
  var med = medicines.find(function(m) { return m.id === medId; });
  if (!med || !med.inStock) return;
  var existing = cart.find(function(c) { return c.medicine.id === medId; });
  if (existing) { existing.quantity++; } else { cart.push({ medicine: med, quantity: 1 }); }
  updateCartUI();
  renderMedicines();
}

function removeFromCart(medId) {
  cart = cart.filter(function(c) { return c.medicine.id !== medId; });
  updateCartUI();
  renderCart();
  renderMedicines();
}

function updateQuantity(medId, delta) {
  var item = cart.find(function(c) { return c.medicine.id === medId; });
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) { removeFromCart(medId); return; }
  updateCartUI();
  renderCart();
}

function clearCart() {
  cart = [];
  appliedCoupon = null;
  updateCartUI();
  renderCart();
  renderMedicines();
}

function getSubtotal() { return cart.reduce(function(sum, i) { return sum + i.medicine.price * i.quantity; }, 0); }
function getTotalItems() { return cart.reduce(function(sum, i) { return sum + i.quantity; }, 0); }

function getDeliveryCharge(sub) { return (sub > 500 || sub === 0) ? 0 : 30; }

function getDiscount() { return appliedCoupon ? Math.round((getSubtotal() * appliedCoupon.discount) / 100) : 0; }
function getTotal() { return getSubtotal() - getDiscount() + getDeliveryCharge(getSubtotal()); }

function updateCartUI() {
  var badge = document.getElementById('cartBadge');
  var count = getTotalItems();
  if (count > 0) { badge.textContent = count; badge.style.display = 'flex'; }
  else { badge.style.display = 'none'; }
}

// ==================== RENDER: FEATURES ====================

function renderFeatures() {
  var features = [
    { icon: 'ScanLine', title: 'AI Prescription Scanner', desc: 'Upload your prescription and let AI extract medicines with 98% accuracy in seconds.', color: 'linear-gradient(to bottom right, var(--brand-500), var(--brand-700))' },
    { icon: 'Stethoscope', title: 'Doctor Consultation', desc: 'Consult verified doctors online within minutes — anytime, day or night.', color: 'linear-gradient(to bottom right, var(--success-500), var(--success-700))' },
    { icon: 'Truck', title: 'Fast Medicine Delivery', desc: 'Get medicines delivered from nearby pharmacies in as little as 15 minutes.', color: 'linear-gradient(to bottom right, var(--accent-500), var(--accent-700))' },
    { icon: 'ShieldCheck', title: 'Secure Payments', desc: 'Pay securely with UPI, cards, or cash on delivery. Your data is always encrypted.', color: 'linear-gradient(to bottom right, var(--brand-600), var(--accent-600))' },
    { icon: 'Building', title: 'Verified Pharmacies', desc: 'Every partner pharmacy is licensed and quality-checked for your safety.', color: 'linear-gradient(to bottom right, var(--success-600), var(--brand-600))' },
    { icon: 'MapPin', title: 'Live Order Tracking', desc: 'Track your order in real-time from the pharmacy to your doorstep.', color: 'linear-gradient(to bottom right, var(--accent-600), var(--brand-600))' },
  ];
  document.getElementById('featuresGrid').innerHTML = features.map(function(f) {
    return '<div class="card feature-card reveal"><div class="feature-icon" style="background:' + f.color + '">' + svgIcon(f.icon) + '</div><h3 class="feature-title">' + f.title + '</h3><p class="feature-desc">' + f.desc + '</p></div>';
  }).join('');
}

// ==================== RENDER: HOW IT WORKS ====================

function renderSteps() {
  var steps = [
    { icon: 'Upload', title: 'Upload Prescription', desc: "Snap or upload your doctor's prescription in JPG, PNG, or PDF." },
    { icon: 'ScanLine', title: 'AI Verifies Prescription', desc: "Our AI reads, extracts medicines, and verifies the doctor's credentials." },
    { icon: 'Building', title: 'Pharmacy Accepts Order', desc: 'The nearest verified pharmacy receives and accepts your order instantly.' },
    { icon: 'Truck', title: 'Medicine Delivered', desc: 'Your medicines are packed and delivered to your doorstep in minutes.' },
  ];
  document.getElementById('stepsGrid').innerHTML = steps.map(function(s, i) {
    return '<div class="step reveal" style="transition-delay:' + (i * 0.1) + 's"><div class="step-icon-wrap"><div class="step-icon-inner">' + svgIcon(s.icon) + '</div><span class="step-num">' + (i + 1) + '</span></div><h3 class="step-title">' + s.title + '</h3><p class="step-desc">' + s.desc + '</p></div>';
  }).join('');
}

// ==================== RENDER: STATS ====================

function renderStats() {
  var stats = [
    { value: 50, suffix: '+', label: 'Partner Pharmacies' },
    { value: 10000, suffix: '+', label: 'Medicines Listed' },
    { value: 2000, suffix: '+', label: 'Happy Customers' },
    { value: 15, suffix: ' min', label: 'Avg. Delivery Time' },
  ];
  document.getElementById('statsGrid').innerHTML = stats.map(function(s, i) {
    return '<div class="stat reveal" style="transition-delay:' + (i * 0.08) + 's"><div class="stat-value" data-value="' + s.value + '" data-suffix="' + s.suffix + '">0</div><p class="stat-label">' + s.label + '</p></div>';
  }).join('');
}

// ==================== RENDER: PHARMACIES ====================

function renderPharmacies() {
  document.getElementById('pharmaciesGrid').innerHTML = pharmacies.slice(0, 3).map(function(ph, i) {
    return '<div class="card pharmacy-card reveal" style="transition-delay:' + (i * 0.08) + 's"><div class="pharmacy-header"><div class="pharmacy-info"><div class="pharmacy-icon">' + svgIcon('Building') + '</div><div><h3 class="pharmacy-name">' + ph.name + '</h3><p class="pharmacy-address">' + ph.address + '</p></div></div></div><div class="pharmacy-meta"><span class="pharmacy-rating">' + svgIcon('Star') + ' ' + ph.rating + '</span><span class="pharmacy-meta-item">' + svgIcon('MapPin') + ' ' + ph.distanceKm + ' km</span><span class="pharmacy-meta-item">' + svgIcon('Clock') + ' ' + ph.deliveryMins + ' min</span></div>' + (ph.open24Hours ? '<div class="pharmacy-open"><span class="badge" style="background:var(--success-50);color:var(--success-700)">Open 24x7</span></div>' : '') + '</div>';
  }).join('');
}

// ==================== RENDER: MEDICINES ====================

function renderMedicines() {
  var list = medicines.filter(function(m) {
    var mq = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    var cat = activeCategory === 'All' || m.category === activeCategory;
    return mq && cat;
  });
  if (sortBy === 'price-low') list.sort(function(a, b) { return a.price - b.price; });
  if (sortBy === 'price-high') list.sort(function(a, b) { return b.price - a.price; });
  if (sortBy === 'rating') list.sort(function(a, b) { return b.rating - a.rating; });

  document.getElementById('storeCount').textContent = list.length + ' medicines found';
  var grid = document.getElementById('medicinesGrid');
  var empty = document.getElementById('storeEmpty');

  if (list.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    if (medicinesLoadError) {
      empty.innerHTML = '<p>Medicine catalogue is unavailable. Please make sure the MediSwift backend is running.</p>';
    }
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = list.map(function(med) {
    var inCart = cart.some(function(c) { return c.medicine.id === med.id; });
    return '<div class="card medicine-card"><div class="medicine-img-wrap"><img src="' + med.image + '" alt="' + med.name + '" class="medicine-img" loading="lazy" /><div class="medicine-badges"><span class="badge" style="background:rgba(255,255,255,0.9);color:var(--gray-700);backdrop-filter:blur(4px)">' + med.category + '</span>' + (med.prescriptionRequired ? '<span class="badge medicine-badge-rx">Rx</span>' : '') + '</div>' + (!med.inStock ? '<div class="medicine-oos-overlay"><span class="badge badge-gray">Out of stock</span></div>' : '') + '</div><div class="medicine-body"><div class="medicine-name-row"><h3 class="medicine-name">' + med.name + '</h3><span class="medicine-rating">' + svgIcon('Star') + ' ' + med.rating + '</span></div><p class="medicine-manufacturer">' + med.manufacturer + '</p><p class="medicine-desc">' + med.description + '</p><div class="medicine-footer"><div><span class="medicine-price">' + formatINR(med.price) + '</span><span class="medicine-mrp">' + formatINR(med.mrp) + '</span></div>' + (inCart ? '<span class="badge medicine-added-badge">' + svgIcon('Check') + ' Added</span>' : '<button class="medicine-add-btn" onclick="addToCart(\'' + med.id + '\')" ' + (!med.inStock ? 'disabled' : '') + '>' + svgIcon('Plus') + '</button>') + '</div></div></div>';
  }).join('');
}

function renderCategories() {
  var cats = ['All', 'Tablets', 'Syrups', 'Injections', 'Vitamins'];
  var icons = { All: 'Sparkles', Tablets: 'Pill', Syrups: 'FlaskConical', Injections: 'Syringe', Vitamins: 'Apple' };
  document.getElementById('storeCategories').innerHTML = cats.map(function(cat) {
    return '<button class="category-btn ' + (activeCategory === cat ? 'active' : '') + '" onclick="setCategory(\'' + cat + '\')">' + svgIcon(icons[cat] || 'Pill') + ' ' + cat + '</button>';
  }).join('');
}

function setCategory(cat) { activeCategory = cat; renderCategories(); renderMedicines(); }

// ==================== RENDER: CART ==============
function renderCart() {
  var empty = document.getElementById('cartEmpty');
  var content = document.getElementById('cartContent');
  var countEl = document.getElementById('cartItemCount');
  var count = getTotalItems();
  countEl.textContent = count + ' item' + (count !== 1 ? 's' : '') + ' in your cart';

  if (cart.length === 0) { empty.style.display = 'block'; content.style.display = 'none'; return; }
  empty.style.display = 'none'; content.style.display = 'grid';

  document.getElementById('cartItems').innerHTML = cart.map(function(item) {
    return '<div class="card cart-item"><img src="' + item.medicine.image + '" alt="' + item.medicine.name + '" class="cart-item-img" /><div class="cart-item-body"><div class="cart-item-header"><div><h3 class="cart-item-name">' + item.medicine.name + '</h3><p class="cart-item-manufacturer">' + item.medicine.manufacturer + '</p><span class="badge badge-gray" style="margin-top:0.25rem">' + item.medicine.category + '</span></div><button class="cart-item-remove" onclick="removeFromCart(\'' + item.medicine.id + '\')">' + svgIcon('Trash') + '</button></div><div class="cart-item-footer"><div class="cart-qty"><button class="cart-qty-btn" onclick="updateQuantity(\'' + item.medicine.id + '\', -1)">' + svgIcon('Minus') + '</button><span class="cart-qty-val">' + item.quantity + '</span><button class="cart-qty-btn" onclick="updateQuantity(\'' + item.medicine.id + '\', 1)">' + svgIcon('Plus') + '</button></div><span class="cart-item-price">' + formatINR(item.medicine.price * item.quantity) + '</span></div></div></div>';
  }).join('') + '<div class="cart-actions"><a href="#store" class="btn btn-ghost">' + svgIcon('ArrowRight') + ' Continue Shopping</a><button class="btn btn-ghost" style="color:var(--red-600)" onclick="clearCart()">' + svgIcon('Trash') + ' Clear Cart</button></div>';

  renderCartSummary();
}

function renderCartSummary() {
  var sub = getSubtotal();
  var delivery = getDeliveryCharge(sub);
  var discount = getDiscount();
  var total = sub - discount + delivery;

  // Coupon area
  var couponArea = document.getElementById('couponArea');
  var couponApplied = document.getElementById('couponApplied');
  if (appliedCoupon) {
    couponArea.style.display = 'none';
    couponApplied.style.display = 'flex';
    couponApplied.className = 'coupon-applied';
    couponApplied.innerHTML = '<span class="coupon-applied-text">' + svgIcon('BadgeCheck') + ' ' + appliedCoupon.code + ' (' + appliedCoupon.discount + '% off)</span><button onclick="removeCoupon()" style="color:var(--success-700)">' + svgIcon('Minus') + '</button>';
  } else {
    couponArea.style.display = 'block';
    couponApplied.style.display = 'none';
  }

  var breakdown = document.getElementById('cartBreakdown');
  var html = '<div class="summary-row gray"><span>Subtotal (' + getTotalItems() + ' items)</span><span>' + formatINR(sub) + '</span></div>';
  if (discount > 0) html += '<div class="summary-row summary-discount"><span>Discount (' + appliedCoupon.discount + '%)</span><span>-' + formatINR(discount) + '</span></div>';
  html += '<div class="summary-row ' + (delivery === 0 ? 'summary-free' : 'gray') + '"><span>Delivery Charges</span><span>' + (delivery === 0 ? 'FREE' : formatINR(delivery)) + '</span></div>';
  if (delivery > 0) html += '<div class="summary-free-delivery-hint">Add ' + formatINR(500 - sub) + ' more for free delivery</div>';
  breakdown.innerHTML = html;

  document.getElementById('cartTotal').textContent = formatINR(total);
}

function applyCoupon() {
  var input = document.getElementById('couponInput');
  var errEl = document.getElementById('couponError');
  var code = input.value.toUpperCase().trim();
  errEl.style.display = 'none';
  if (COUPONS[code]) { appliedCoupon = { code: code, discount: COUPONS[code] }; input.value = ''; renderCartSummary(); }
  else { errEl.textContent = 'Invalid coupon code.'; errEl.style.display = 'block'; }
}

function removeCoupon() { appliedCoupon = null; renderCartSummary(); }

// ==================== RENDER: CHECKOUT ====================

async function openCheckout() {
  if (cart.length === 0) return;

  // Checkout is tied to an account so saved delivery details can be reused.
  if (!localStorage.getItem('mediswiftToken')) {
    openModal('loginModal');
    return;
  }

  document.getElementById('checkout').style.display = 'block';
  renderCheckout();

  try {
    var profileData = await apiRequest('/profile');
    var profile = profileData.user || {};
    document.getElementById('checkoutAddress').value = profile.address || '';
    document.getElementById('checkoutCity').value = profile.city || 'Nanded';
    document.getElementById('checkoutPincode').value = profile.pincode || '';
    document.getElementById('checkoutPhone').value = profile.phone || '';
  } catch (error) {
    console.warn('Could not load saved delivery details:', error);
  }

  document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' });
}

function renderCheckout() {
  var items = document.getElementById('checkoutItems');
  items.innerHTML = cart.map(function(item) {
    return '<div class="checkout-item"><img src="' + item.medicine.image + '" alt="' + item.medicine.name + '" /><div style="flex:1;overflow:hidden"><p class="checkout-item-name">' + item.medicine.name + '</p><p class="checkout-item-qty">Qty: ' + item.quantity + '</p></div><span class="checkout-item-price">' + formatINR(item.medicine.price * item.quantity) + '</span></div>';
  }).join('');

  var sub = getSubtotal();
  var delivery = getDeliveryCharge(sub);
  var total = sub + delivery;

  var breakdown = document.getElementById('checkoutBreakdown');
  breakdown.innerHTML = '<div class="summary-row gray"><span>Subtotal</span><span>' + formatINR(sub) + '</span></div><div class="summary-row ' + (delivery === 0 ? 'summary-free' : 'gray') + '"><span>Delivery</span><span>' + (delivery === 0 ? 'FREE' : formatINR(delivery)) + '</span></div>';
  document.getElementById('checkoutTotal').textContent = formatINR(total);

  renderPaymentOptions();
}

function renderPaymentOptions() {
  var options = [
    { method: 'UPI', icon: 'ShoppingCart', desc: 'GPay, PhonePe, Paytm' },
    { method: 'Card', icon: 'FileText', desc: 'Credit / Debit card' },
    { method: 'Cash on Delivery', icon: 'Package', desc: 'Pay when you receive' },
  ];
  document.getElementById('paymentOptions').innerHTML = options.map(function(opt) {
    return '<button type="button" class="payment-option ' + (selectedPayment === opt.method ? 'selected' : '') + '" onclick="selectPayment(\'' + opt.method + '\')"><div class="payment-option-icon">' + svgIcon(opt.icon) + '</div><div style="flex:1"><p class="payment-option-name">' + opt.method + '</p><p class="payment-option-desc">' + opt.desc + '</p></div><div class="payment-radio">' + (selectedPayment === opt.method ? svgIcon('Check') : '') + '</div></button>';
  }).join('');
}

function selectPayment(method) { selectedPayment = method; renderPaymentOptions(); }

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  var addr = document.getElementById('checkoutAddress').value.trim();
  var phone = document.getElementById('checkoutPhone').value.trim();
  var pincode = document.getElementById('checkoutPincode').value.trim();
  var city = document.getElementById('checkoutCity').value.trim();
  var errEl = document.getElementById('checkoutError');
  errEl.style.display = 'none';

  if (!addr || !city || !phone || !pincode) { errEl.textContent = 'Please fill all required fields.'; errEl.style.display = 'block'; return; }
  if (phone.length < 10) { errEl.textContent = 'Please enter a valid phone number.'; errEl.style.display = 'block'; return; }
  if (pincode.length !== 6) { errEl.textContent = 'Please enter a valid 6-digit pincode.'; errEl.style.display = 'block'; return; }

  var btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.innerHTML = svgIcon('Loader') + ' Processing...';
  btn.querySelector('svg').classList.add('spin');

  if (!localStorage.getItem('mediswiftToken')) {
    btn.disabled = false;
    btn.innerHTML = 'Place Order ' + svgIcon('ArrowRight');
    errEl.textContent = 'Please login before placing an order.';
    errEl.style.display = 'block';
    return;
  }

  try {
    // Keep the latest delivery details on the account for the next order.
    try {
      var profileData = await apiRequest('/profile');
      var currentProfile = profileData.user || {};
      await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: currentProfile.name,
          email: currentProfile.email,
          phone: phone,
          address: addr,
          city: city,
          pincode: pincode
        })
      });
    } catch (profileError) {
      console.warn('Could not save latest delivery details:', profileError);
    }

    var data = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: cart.map(function(item) {
          return {
            medicineId: item.medicine.id,
            name: item.medicine.name,
            price: item.medicine.price,
            quantity: item.quantity,
            image: item.medicine.image
          };
        }),
        address: addr,
        city: city,
        pincode: pincode,
        phone: phone,
        paymentMethod: selectedPayment,
        total: getSubtotal() + getDeliveryCharge(getSubtotal()) - getDiscount(getSubtotal())
      })
    });

    btn.disabled = false;
    btn.innerHTML = 'Place Order ' + svgIcon('ArrowRight');
    document.getElementById('checkoutForm').style.display = 'none';
    var successEl = document.getElementById('checkoutSuccess');
    successEl.style.display = 'block';
    document.getElementById('successOrderId').textContent = data.order.id;
    document.getElementById('successPayment').textContent = selectedPayment;
    clearCart();
  } catch (error) {
    btn.disabled = false;
    btn.innerHTML = 'Place Order ' + svgIcon('ArrowRight');
    errEl.textContent = error.message;
    errEl.style.display = 'block';
  }
}

// ==================== RENDER: TRACKING ====================

function renderTracking() {
  var selector = document.getElementById('orderSelector');
  selector.innerHTML = orders.map(function(o) {
    return '<button class="order-selector-btn ' + (selectedOrderId === o.id ? 'active' : '') + '" onclick="selectOrder(\'' + o.id + '\')">' + o.id + '</button>';
  }).join('');

  var order = orders.find(function(o) { return o.id === selectedOrderId; }) || orders[0];
  var currentStep = orderTimeline.findIndex(function(s) { return s.status === order.status; });
  if (currentStep === -1) currentStep = 0;
  var isDelivered = order.status === 'Delivered';

  document.getElementById('trackingOrderId').textContent = order.id;
  document.getElementById('trackingOrderInfo').textContent = order.pharmacy + ' • ' + order.items.length + ' items • ' + formatINR(order.total);

  var badge = document.getElementById('trackingBadge');
  if (!isDelivered) { badge.style.background = 'var(--brand-50)'; badge.style.color = 'var(--brand-700)'; badge.innerHTML = svgIcon('Clock') + ' Arriving in ' + order.estimatedDelivery; }
  else { badge.style.background = 'var(--success-50)'; badge.style.color = 'var(--success-700)'; badge.innerHTML = svgIcon('Check') + ' Delivered'; }

  var etaBanner = document.getElementById('trackingEtaBanner');
  if (!isDelivered) {
    var progressPct = ((currentStep + 1) / orderTimeline.length) * 100;
    etaBanner.innerHTML = '<div class="tracking-eta-banner"><div class="tracking-eta-top"><div><p class="tracking-eta-label">Estimated Arrival</p><p class="tracking-eta-value">' + order.estimatedDelivery + '</p></div><div class="tracking-eta-bike">' + svgIcon('Bike') + '</div></div><div class="tracking-eta-progress"><div class="tracking-eta-progress-fill" style="width:' + progressPct + '%"></div></div></div>';
  } else { etaBanner.innerHTML = ''; }

  var statusIcons = { 'Order Received': 'Package', 'Prescription Verified': 'Check', 'Packed': 'Package', 'Out For Delivery': 'Truck', 'Delivered': 'Home' };
  var timeline = document.getElementById('trackingTimeline');
  var stepsHtml = '<div class="tracking-timeline-line"></div>';
  var fillHeight = isDelivered ? '100%' : 'calc(' + (currentStep / (orderTimeline.length - 1)) * 100 + '% - 0px)';
  stepsHtml += '<div class="tracking-timeline-line-fill" style="height:' + fillHeight + '"></div>';
  stepsHtml += '<div class="tracking-steps">';
  orderTimeline.forEach(function(step, i) {
    var done = i <= currentStep;
    var active = i === currentStep && !isDelivered;
    var iconClass = done ? 'done' : 'pending';
    if (active) iconClass += ' active';
    var bodyClass = done ? '' : 'pending';
    var titleClass = done ? 'done' : 'pending';
    var icon = done ? svgIcon('Check') : svgIcon(statusIcons[step.status] || 'Package');
    stepsHtml += '<div class="tracking-step"><div class="tracking-step-icon ' + iconClass + '">' + icon + '</div><div class="tracking-step-body ' + bodyClass + '"><p class="tracking-step-title ' + titleClass + '">' + step.status + '</p><p class="tracking-step-desc">' + step.description + '</p></div></div>';
  });
  stepsHtml += '</div>';
  timeline.innerHTML = stepsHtml;

  // Sidebar
  var sidebar = document.getElementById('trackingSidebar');
  var sidebarHtml = '';
  if (!isDelivered) {
    sidebarHtml += '<div class="card tracking-rider-card"><h3 class="tracking-rider-header">Delivery Rider</h3><div class="tracking-rider-body"><div class="tracking-rider-avatar">' + svgIcon('Bike') + '</div><div style="flex:1"><p class="tracking-rider-name">Rahul K.</p><p class="tracking-rider-meta">' + svgIcon('Star') + ' 4.8 • 320 deliveries</p></div><a href="tel:+919876543210" class="tracking-rider-call">' + svgIcon('Phone') + '</a></div></div>';
  }
  sidebarHtml += '<div class="card tracking-address-card"><h3 class="tracking-address-title">' + svgIcon('MapPin') + ' Delivery Address</h3><p style="margin-top:0.5rem;font-size:0.875rem;color:var(--gray-600)">' + order.address + '</p><p style="font-size:0.875rem;color:var(--gray-600)">Nanded, Maharashtra — 431601</p><p style="margin-top:0.5rem;font-size:0.75rem;color:var(--gray-400)">Payment: ' + order.paymentMethod + '</p></div>';
  sidebarHtml += '<div class="card tracking-items-card"><h3 class="tracking-items-title">Order Items</h3>';
  order.items.forEach(function(item) {
    sidebarHtml += '<div class="tracking-item"><img src="' + item.image + '" alt="' + item.name + '" /><div style="flex:1"><p class="tracking-item-name">' + item.name + '</p><p class="tracking-item-qty">Qty: ' + item.quantity + '</p></div><span class="tracking-item-price">' + formatINR(item.price * item.quantity) + '</span></div>';
  });
  sidebarHtml += '<div class="tracking-items-total"><span class="tracking-items-total-label">Total</span><span class="tracking-items-total-value">' + formatINR(order.total) + '</span></div></div>';
  sidebarHtml += '<a href="#store" class="btn btn-secondary btn-block" style="padding:0.75rem;justify-content:center">' + svgIcon('Package') + ' Order Again</a>';
  sidebar.innerHTML = sidebarHtml;
}

function selectOrder(id) { selectedOrderId = id; renderTracking(); }

// ==================== RENDER: DOCTORS ====================

function renderDoctors() {
  var list = doctors.filter(function(d) {
    var q = d.name.toLowerCase().includes(doctorQuery.toLowerCase()) || d.specialization.toLowerCase().includes(doctorQuery.toLowerCase());
    var f = doctorFilter === 'all' || d.available;
    return q && f;
  });

  var grid = document.getElementById('doctorsGrid');
  var empty = document.getElementById('doctorsEmpty');
  if (list.length === 0) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  grid.innerHTML = list.map(function(doc) {
    return '<div class="card doctor-card"><div class="doctor-img-wrap"><img src="' + doc.photo + '" alt="' + doc.name + '" class="doctor-img" loading="lazy" /><div class="doctor-img-overlay"></div>' + (doc.available ? '<span class="badge doctor-availability" style="background:var(--success-50);color:var(--success-700)"><span style="width:6px;height:6px;border-radius:9999px;background:var(--success-500);display:inline-block"></span> Available</span>' : '<span class="badge doctor-availability" style="background:rgba(243,244,246,0.9);color:var(--gray-600)">Offline</span>') + '<div class="doctor-name-overlay"><p>' + doc.name + '</p><p>' + doc.specialization + '</p></div></div><div class="doctor-body"><p class="doctor-qualifications">' + doc.qualifications + '</p><div class="doctor-meta"><span class="doctor-rating">' + svgIcon('Star') + ' ' + doc.rating + ' <span class="doctor-rating-count">(' + doc.reviews + ')</span></span><span style="color:var(--gray-400)">•</span><span class="doctor-exp">' + doc.experience + ' yrs exp</span></div><div class="doctor-slot">' + svgIcon('Clock') + '<span class="doctor-slot-label">Next slot:</span><span class="doctor-slot-value">' + doc.nextSlot + '</span></div><div class="doctor-footer"><div><span class="doctor-fee-label">Consultation</span><p class="doctor-fee">' + formatINR(doc.consultationFee) + '</p></div><button class="btn btn-primary doctor-consult-btn" ' + (!doc.available ? 'disabled' : '') + ' onclick="openDoctorBooking(\'' + doc.id + '\')">' + svgIcon('Video') + ' Consult</button></div></div></div>';
  }).join('');
}

// ==================== RENDER: TESTIMONIALS ====================

function renderTestimonials() {
  document.getElementById('testimonialsGrid').innerHTML = testimonials.map(function(t) {
    var stars = '';
    for (var j = 0; j < t.rating; j++) stars += svgIcon('Star');
    return '<div class="card testimonial-card"><div class="testimonial-stars">' + stars + '</div><p class="testimonial-text">"' + t.text + '"</p><div class="testimonial-author"><img src="' + t.photo + '" alt="' + t.name + '" /><div><p class="testimonial-name">' + t.name + '</p><p class="testimonial-role">' + t.role + '</p></div></div></div>';
  }).join('');
}

// ==================== AI ASSISTANT ====================
function getAssistantResponse(question) {
  var q = question.toLowerCase();
  if (q.includes('paracetamol')) return 'Paracetamol (acetaminophen) is commonly used to relieve mild to moderate pain such as headaches, body aches, and toothaches, and to reduce fever. The usual adult dose is 500\u2013650mg every 4\u20136 hours as needed, not exceeding 4g in 24 hours. Common side effects are rare at normal doses but may include nausea or rash. Always follow your doctor\'s instructions and do not combine with other paracetamol-containing products.';
  if (q.includes('azithromycin')) return 'Azithromycin 500mg is an antibiotic used to treat bacterial infections such as respiratory infections, ear infections, and certain skin infections. A typical course is one tablet daily for 3\u20135 days as prescribed. Take it at the same time each day, with or without food. Common side effects include nausea, diarrhea, and stomach pain. Complete the full course even if you feel better \u2014 stopping early can cause the infection to return.';
  if (q.includes('ibuprofen')) return 'Ibuprofen is a non-steroidal anti-inflammatory drug (NSAID) used to reduce pain, inflammation, and fever. The usual adult dose is 200\u2013400mg every 4\u20136 hours, not exceeding 1200mg per day without medical advice. Take it with food or milk to reduce stomach irritation. Possible side effects include stomach upset, heartburn, dizziness, and in rare cases, elevated blood pressure. Avoid ibuprofen if you have a history of stomach ulcers or kidney disease without consulting your doctor.';
  if (q.includes('antibiotic')) return 'General precautions while taking antibiotics: (1) Take them exactly as prescribed and complete the full course, even if symptoms improve. (2) Do not skip doses or double up on missed ones. (3) Avoid alcohol during the course. (4) Some antibiotics should be taken with food, others on an empty stomach \u2014 follow the label. (5) Inform your doctor about any other medications or supplements you take to avoid interactions. (6) If you experience severe diarrhea, rash, or breathing difficulty, seek medical help immediately.';
  if (q.includes('dosage')) return 'Medicine dosage depends on the specific drug, your age, weight, and medical condition. I can explain the general recommended dosage for common medicines, but the exact dose should always be determined by your doctor. Please mention the medicine name (e.g., "dosage of Paracetamol") and I\'ll share the standard guidelines. Never self-adjust your dose without medical advice.';
  if (q.includes('side effect')) return 'Side effects vary by medicine. Common side effects across many oral medicines include nausea, dizziness, drowsiness, or mild stomach upset. Most side effects are temporary and resolve as your body adjusts. If you experience severe reactions like difficulty breathing, swelling of the face or throat, or a severe skin rash, seek emergency medical attention immediately \u2014 these may indicate an allergic reaction. Share the medicine name for specific side-effect information.';
  if (q.includes('precaution')) return 'General medicine precautions: store medicines at room temperature away from direct sunlight and moisture unless instructed otherwise; keep them out of reach of children; check expiry dates before use; inform your doctor about existing conditions and other medications to avoid interactions; and never share prescription medicines with others. For medicine-specific precautions, mention the medicine name.';
  return 'I can help explain medicines \u2014 their uses, standard dosage guidelines, precautions, and common side effects. Please ask about a specific medicine (for example: "What is Paracetamol used for?" or "Side effects of Azithromycin"). Remember, I do not diagnose diseases or prescribe medicines. Always consult a qualified doctor for medical advice.';
}

function initChat() {
  chatMessages = [{ id: 'init', role: 'assistant', text: "Hi! I'm your AI Medicine Assistant. I can explain medicine uses, dosage, precautions, and side effects. How can I help you today?", time: getTime() }];
  renderChat();
  renderSuggestions();
  renderHelpList();
}

function renderChat() {
  var container = document.getElementById('assistantMessages');
  container.innerHTML = chatMessages.map(function(msg) {
    return '<div class="assistant-msg ' + msg.role + '"><div class="assistant-msg-avatar ' + msg.role + '">' + svgIcon(msg.role === 'user' ? 'User' : 'Bot') + '</div><div><div class="assistant-msg-bubble ' + msg.role + '">' + msg.text + '</div><p class="assistant-msg-time">' + msg.time + '</p></div></div>';
  }).join('');
  container.scrollTop = container.scrollHeight;
}

function renderSuggestions() {
  document.getElementById('assistantSuggestions').innerHTML = aiAssistantSuggestions.map(function(s) {
    return '<button class="assistant-suggestion-btn" onclick="sendMessage(\'' + s.replace(/'/g, "\\'") + '\')">' + s + '</button>';
  }).join('');
}

function renderHelpList() {
  var items = ['Medicine uses', 'Dosage guidelines', 'Precautions', 'Side effects'];
  document.getElementById('assistantHelpList').innerHTML = items.map(function(item) {
    return '<li class="assistant-help-item">' + svgIcon('Sparkles') + ' ' + item + '</li>';
  }).join('');
}

function sendMessage(text) {
  if (!text || !text.trim()) return;
  chatMessages.push({ id: 'u-' + Date.now(), role: 'user', text: text, time: getTime() });
  document.getElementById('assistantInput').value = '';
  renderChat();

  // Typing indicator
  var container = document.getElementById('assistantMessages');
  var typingEl = document.createElement('div');
  typingEl.className = 'assistant-typing';
  typingEl.id = 'typingIndicator';
  typingEl.innerHTML = '<div class="assistant-msg-avatar bot">' + svgIcon('Bot') + '</div><div class="typing-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
  container.appendChild(typingEl);
  container.scrollTop = container.scrollHeight;

  setTimeout(function() {
    var el = document.getElementById('typingIndicator');
    if (el) el.remove();
    chatMessages.push({ id: 'a-' + Date.now(), role: 'assistant', text: getAssistantResponse(text), time: getTime() });
    renderChat();
  }, 1200);
}

// ==================== UPLOAD + AI ANALYSIS ====================

function handleFile(file) {
  var errEl = document.getElementById('uploadError');
  errEl.style.display = 'none';

  var validTypes = ['image/jpeg', 'image/png'];
  var validExts = ['.jpg', '.jpeg', '.png'];
  var isValid = validTypes.includes(file.type) || validExts.some(function(ext) {
    return file.name.toLowerCase().endsWith(ext);
  });

  if (!isValid) {
    errEl.textContent = 'Please upload a JPG or PNG prescription image for AI scanning.';
    errEl.style.display = 'block';
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    errEl.textContent = 'File size must be under 10MB.';
    errEl.style.display = 'block';
    return;
  }

  document.getElementById('uploadDropzone').style.display = 'none';
  document.getElementById('uploadProgress').style.display = 'block';
  document.getElementById('uploadProgressBar').style.width = '30%';

  var reader = new FileReader();

  reader.onload = function(e) {
    var base64Image = e.target.result.split(',')[1];

    document.getElementById('uploadProgressBar').style.width = '100%';

    setTimeout(function() {
      document.getElementById('uploadProgress').style.display = 'none';
      document.getElementById('aiAnalysis').style.display = 'block';
      document.getElementById('analysisFileCard').style.display = 'flex';
      document.getElementById('analysisFileName').textContent = file.name;
      document.getElementById('analysisFileSize').textContent = Math.round(file.size / 1024) + ' KB';

      runOpenAIPrescriptionScan(base64Image, file.type);
      document.getElementById('aiAnalysis').scrollIntoView({ behavior: 'smooth' });
    }, 500);
  };

  reader.onerror = function() {
    errEl.textContent = 'Could not read the prescription file.';
    errEl.style.display = 'block';
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('uploadDropzone').style.display = 'block';
  };

  reader.readAsDataURL(file);
}

async function runOpenAIPrescriptionScan(base64Image, mimeType) {
  analysisDone = false;
  analysisStage = 0;

  var stages = [
    { key: 'upload', label: 'Prescription Uploaded', icon: 'FileText' },
    { key: 'reading', label: 'Backend Processing', icon: 'ScanLine' },
    { key: 'extraction', label: 'AI Medicine Extraction', icon: 'Pill' },
    { key: 'verification', label: 'Catalogue Matching', icon: 'Stethoscope' },
    { key: 'status', label: 'Finalizing Results', icon: 'ShieldCheck' }
  ];

  function renderScanStages() {
    var html = '';
    stages.forEach(function(stage, i) {
      var isDone = i < analysisStage || analysisDone;
      var isActive = i === analysisStage && !analysisDone;
      var iconClass = isDone ? 'done' : isActive ? 'active' : 'pending';
      var icon = isDone ? svgIcon('Check') : isActive ? svgIcon('Loader') : svgIcon(stage.icon);
      var sub = isActive ? '<p class="analysis-stage-sub">Processing...</p>' : '';
      html += '<div class="analysis-stage"><div class="analysis-stage-icon-wrap"><div class="analysis-stage-icon ' +
        iconClass + '">' + (isActive ? '<span class="spin">' + icon + '</span>' : icon) +
        '</div>' + (i < stages.length - 1 ? '<div class="analysis-stage-connector ' +
        (isDone ? 'done' : '') + '"></div>' : '') +
        '</div><div class="analysis-stage-label ' + iconClass +
        '"><p>' + stage.label + '</p>' + sub + '</div></div>';
    });
    document.getElementById('analysisStages').innerHTML = html;
    var progress = ((analysisDone ? stages.length : analysisStage + 1) / stages.length) * 100;
    document.getElementById('analysisProgressBar').style.width = progress + '%';
  }
  renderScanStages();

  try {
    analysisStage = 1;
    renderScanStages();

    var response = await fetch('/api/prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image, mimeType })
    });

    analysisStage = 2;
    renderScanStages();

    var data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Server error.');

    analysisStage = 3;
    renderScanStages();

    var extractedNames = data.medicines || [];
    var matchedMedicines = [];
    var needsReviewNames = [];

    extractedNames.forEach(function(extracted) {
      var extLower = extracted.toLowerCase();
      var match = medicines.find(function(m) {
        return extLower.includes(m.name.toLowerCase().split(' ')[0]);
      });
      if (match) {
        if (!matchedMedicines.includes(match)) matchedMedicines.push(match);
      } else {
        needsReviewNames.push(extracted);
      }
    });

    analysisStage = 4;
    renderScanStages();

    setTimeout(function() {
      analysisDone = true;
      document.getElementById('analysisFileCheck').style.display = 'block';
      renderScanStages();
      showOpenAIAnalysisResults(matchedMedicines, needsReviewNames, data.imageUrl);
    }, 600);
  } catch (error) {
    console.error('Prescription scan error:', error);
    document.getElementById('analysisProgressBar').style.width = '100%';
    document.getElementById('analysisStages').innerHTML =
      '<div class="analysis-warning" style="margin-top:1rem">' +
      svgIcon('AlertCircle') +
      '<p>Prescription scan failed: ' + escapeHTML(error.message) + '</p></div>' +
      '<button class="btn btn-primary" onclick="document.getElementById(\'uploadDropzone\').style.display=\'block\'; document.getElementById(\'aiAnalysis\').style.display=\'none\';" style="margin-top:1rem">Try Again</button>';
    document.getElementById('analysisResults').innerHTML = '';
    document.getElementById('analysisResults').style.display = 'none';
  }
}

function escapeHTML(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showOpenAIAnalysisResults(matchedMedicines, needsReviewNames, imageUrl) {
  var html =
    '<div class="card analysis-result-banner verified" style="margin-top:1.5rem">' +
      '<div class="analysis-result-icon verified">' + svgIcon('BadgeCheck') + '</div>' +
      '<div style="flex:1">' +
        '<h2 class="analysis-result-title verified">Prescription AI Extracted</h2>' +
        '<p class="analysis-result-sub verified">Medicines matched with our catalogue. Please verify before adding to cart.</p>' +
      '</div>' +
    '</div>';

  if (matchedMedicines.length > 0) {
    html += '<h3 style="margin-top:2rem;margin-bottom:1rem">Available Medicines</h3><div class="medicines-grid">';
    matchedMedicines.forEach(function(m) {
      html += 
        '<div class="medicine-card">' +
          '<div class="medicine-image-wrap">' +
            '<img src="' + m.image + '" alt="' + m.name + '" class="medicine-image" />' +
            (m.prescriptionRequired ? '<span class="medicine-badge rx">Rx Required</span>' : '') +
          '</div>' +
          '<div class="medicine-info">' +
            '<p class="medicine-name">' + m.name + '</p>' +
            '<p class="medicine-sub">' + m.manufacturer + '</p>' +
            '<div class="medicine-price-row">' +
              '<span class="medicine-price">' + formatINR(m.price) + '</span>' +
              '<span class="medicine-mrp">' + formatINR(m.mrp) + '</span>' +
            '</div>' +
            (m.inStock ? 
              '<button class="btn btn-primary medicine-add-btn" onclick="addToCart(\'' + m.id + '\')">Add to Cart</button>' : 
              '<button class="btn btn-secondary medicine-add-btn" disabled>Out of Stock</button>'
            ) +
          '</div>' +
        '</div>';
    });
    html += '</div>';
  } else {
    html += '<div class="analysis-warning" style="margin-top:1.5rem"><p>No directly matching medicines were found in our catalogue.</p></div>';
  }

  if (needsReviewNames.length > 0) {
    html += '<div class="card" style="margin-top:1.5rem;padding:1.25rem;border:1px solid #f59e0b">' +
      '<h3 style="color:#b45309;display:flex;align-items:center;gap:0.5rem;">' + svgIcon('AlertCircle') + ' Needs Review</h3>' +
      '<p style="margin-top:0.5rem;color:var(--gray-700)">The AI found these medicines but they couldn\'t be automatically matched. You may need to search them manually:</p>' +
      '<ul style="margin-top:0.5rem;margin-left:1.5rem;color:var(--gray-800)">' +
      needsReviewNames.map(function(n) { return '<li>' + escapeHTML(n) + '</li>' }).join('') +
      '</ul>' +
    '</div>';
  }

  var fullUrl = window.location.origin + imageUrl;
  var waMessage = encodeURIComponent("Hello! I want to order medicines from this prescription: " + fullUrl);
  var waLink = "https://wa.me/919999999999?text=" + waMessage;

  html += 
    '<div class="analysis-actions" style="margin-top:2rem">' +
      '<a href="' + waLink + '" target="_blank" class="btn btn-primary btn-lg" style="background:#25D366;color:#fff;border-color:#25D366;">' +
        svgIcon('Send') + ' Send to Pharmacy via WhatsApp' +
      '</a>' +
      '<a href="#cart" class="btn btn-secondary btn-lg">Go to Cart ' + svgIcon('ArrowRight') + '</a>' +
      '<button class="btn btn-ghost btn-lg" onclick="document.getElementById(\'uploadDropzone\').style.display=\'block\'; document.getElementById(\'aiAnalysis\').style.display=\'none\';">Upload Another</button>' +
    '</div>' +
    '<div class="analysis-warning" style="margin-top:1.5rem">' +
      svgIcon('AlertCircle') +
      '<p>AI extraction does not confirm prescription authenticity. Please have a qualified pharmacist verify the prescription before dispensing.</p>' +
    '</div>';

  document.getElementById('analysisResults').innerHTML = html;
  document.getElementById('analysisResults').style.display = 'block';
}

function runAnalysis() {
  analysisStage = 0;
  analysisDone = false;
  var stages = [
    { key: 'upload', label: 'Prescription Uploaded', icon: 'FileText' },
    { key: 'reading', label: 'AI Reading Prescription', icon: 'ScanLine' },
    { key: 'extraction', label: 'Medicine Extraction', icon: 'Pill' },
    { key: 'verification', label: 'Doctor Verification', icon: 'Stethoscope' },
    { key: 'status', label: 'Prescription Status', icon: 'ShieldCheck' },
  ];

  function renderStages() {
    var html = '';
    stages.forEach(function(stage, i) {
      var isActive = i === analysisStage && !analysisDone;
      var isDone = i < analysisStage || analysisDone;
      var iconClass = isDone ? 'done' : isActive ? 'active' : 'pending';
      var labelClass = isDone ? 'done' : isActive ? 'active' : 'pending';
      var icon = isDone ? svgIcon('Check') : isActive ? svgIcon('Loader') : svgIcon(stage.icon);
      var sub = isActive ? '<p class="analysis-stage-sub">Processing...</p>' : (isDone && i === stages.length - 1) ? '<p class="analysis-stage-complete">Complete</p>' : '';
      var connector = i < stages.length - 1 ? '<div class="analysis-stage-connector ' + (isDone ? 'done' : '') + '"></div>' : '';
      html += '<div class="analysis-stage"><div class="analysis-stage-icon-wrap"><div class="analysis-stage-icon ' + iconClass + '">' + (isActive ? '<span class="spin">' + icon + '</span>' : icon) + '</div>' + connector + '</div><div class="analysis-stage-label ' + labelClass + '"><p>' + stage.label + '</p>' + sub + '</div></div>';
    });
    document.getElementById('analysisStages').innerHTML = html;
    var progress = ((analysisDone ? stages.length : analysisStage + 1) / stages.length) * 100;
    document.getElementById('analysisProgressBar').style.width = progress + '%';
  }

  renderStages();

  function advance() {
    if (analysisStage >= stages.length - 1) {
      setTimeout(function() {
        analysisDone = true;
        document.getElementById('analysisFileCheck').style.display = 'block';
        renderStages();
        showAnalysisResults();
      }, 800);
      return;
    }
    setTimeout(function() { analysisStage++; renderStages(); advance(); }, 1100);
  }
  advance();
}

function showAnalysisResults() {
  var result = {
    verified: true,
    confidence: 98,
    doctor: 'Dr. Anil Sharma',
    doctorReg: 'MH-2019/45678',
    date: '2024-08-01',
    medicines: [
      { name: 'Paracetamol 650mg', dosage: '1 tablet', frequency: '3 times daily after meals' },
      { name: 'Azithromycin 500mg', dosage: '1 tablet', frequency: '1 daily for 5 days' },
    ],
    notes: 'Patient advised to complete full course of antibiotics. Follow-up recommended after 5 days. Avoid alcohol during medication course.',
  };

  var html = '<div class="card analysis-result-banner verified" style="margin-top:1.5rem"><div class="analysis-result-icon verified">' + svgIcon('BadgeCheck') + '</div><div style="flex:1"><h2 class="analysis-result-title verified">Prescription Verified</h2><p class="analysis-result-sub verified">AI confidence: ' + result.confidence + '% • ' + result.doctor + '</p></div><div class="analysis-result-confidence"><div class="analysis-result-confidence-value">' + result.confidence + '%</div><p class="text-gray-500" style="font-size:0.75rem">confidence</p></div></div>';

  html += '<div class="card analysis-doctor-card" style="margin-top:1.5rem"><h3 class="analysis-doctor-title">' + svgIcon('Stethoscope') + ' Prescribing Doctor</h3><div class="analysis-doctor-info"><div><span class="text-gray-400">Name:</span> <span class="font-semibold text-gray-900">' + result.doctor + '</span></div><div><span class="text-gray-400">Reg. No:</span> <span class="font-semibold text-gray-900">' + result.doctorReg + '</span></div><div><span class="text-gray-400">Date:</span> <span class="font-semibold text-gray-900">' + result.date + '</span></div></div></div>';

  html += '<div class="card analysis-medicines-card" style="margin-top:1.5rem"><div style="display:flex;align-items:center;justify-content:space-between"><h3 class="analysis-doctor-title">' + svgIcon('Pill') + ' Extracted Medicines</h3><span class="badge" style="background:var(--brand-50);color:var(--brand-700)">' + result.medicines.length + ' found</span></div><div style="margin-top:1rem">';
  result.medicines.forEach(function(med) {
    html += '<div class="analysis-medicine-item"><div style="width:40px;height:40px;border-radius:0.5rem;background:#fff;color:var(--brand-600);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-soft)">' + svgIcon('Pill') + '</div><div style="flex:1"><p class="font-bold text-gray-900" style="font-size:0.875rem">' + med.name + '</p><p style="font-size:0.75rem;color:var(--gray-500)">' + med.dosage + ' • ' + med.frequency + '</p></div>' + svgIcon('Check') + '</div>';
  });
  html += '</div></div>';

  html += '<div class="card analysis-notes-card" style="margin-top:1.5rem"><h3 class="font-bold text-gray-900" style="font-size:0.875rem">Doctor\'s Notes</h3><p style="margin-top:0.5rem;font-size:0.875rem;color:var(--gray-600);line-height:1.625">' + result.notes + '</p></div>';

  html += '<div class="analysis-actions" style="margin-top:1.5rem"><button class="btn btn-primary btn-lg" onclick="addAllToCart()">' + svgIcon('ShoppingCart') + ' Add Medicines to Cart</button><a href="#store" class="btn btn-secondary btn-lg">Browse Store ' + svgIcon('ArrowRight') + '</a><a href="#upload" class="btn btn-ghost btn-lg">Upload Another</a></div>';

  html += '<div class="analysis-warning" style="margin-top:1.5rem">' + svgIcon('AlertCircle') + '<p>AI verification is for assistance only. Please cross-check with your doctor before consuming any medication.</p></div>';

  document.getElementById('analysisResults').innerHTML = html;
  document.getElementById('analysisResults').style.display = 'block';
}

function addAllToCart() {
  var resultMedicines = ['Paracetamol', 'Azithromycin'];
  resultMedicines.forEach(function(name) {
    var match = medicines.find(function(m) { return m.name.toLowerCase().includes(name.toLowerCase()); });
    if (match) addToCart(match.id);
  });
  document.getElementById('store').scrollIntoView({ behavior: 'smooth' });
}

// ==================== AUTH + BACKEND CONNECTION ====================

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

async function apiRequest(endpoint, options) {
  options = options || {};
  options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});

  var token = localStorage.getItem('mediswiftToken');
  if (token) options.headers.Authorization = 'Bearer ' + token;

  var response = await fetch(API_BASE + endpoint, options);
  var data = await response.json().catch(function() { return {}; });

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}

function showFormError(id, message) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}

// Update the UI after a successful login/registration/profile edit.
function loginUser(account) {
  account = account || {};
  user = account;

  var navAuth = document.getElementById('navAuth');
  var navUser = document.getElementById('navUser');
  var userAvatar = document.getElementById('userAvatar');
  var userName = document.getElementById('userName');
  var userEmail = document.getElementById('userEmail');

  if (navAuth) navAuth.style.display = 'none';
  if (navUser) {
    navUser.style.display = 'flex';
    navUser.classList.add('active');
  }

  var displayName = String(account.name || 'User').trim() || 'User';
  if (userAvatar) userAvatar.textContent = displayName.charAt(0).toUpperCase();
  if (userName) userName.textContent = displayName;
  if (userEmail) userEmail.textContent = account.email || '';
}

// Explicitly expose this for fullstack.js and enhancements.js.
window.loginUser = loginUser;

async function handleLogin(e) {
  e.preventDefault();
  var email = document.getElementById('loginEmail').value.trim();
  var password = document.getElementById('loginPassword').value;
  var errorEl = document.getElementById('loginFormError');
  errorEl.style.display = 'none';

  try {
    var data = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ email: email, password: password })
    });

    localStorage.setItem('mediswiftToken', data.token);
    loginUser(data.user);
    document.getElementById('loginForm').reset();
    closeModal('loginModal');
  } catch (error) {
    showFormError('loginFormError', error.message);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  var form = e.currentTarget;
  var fd = new FormData(form);
  var name = String(fd.get('name') || '').trim();
  var email = String(fd.get('email') || '').trim();
  var phone = String(fd.get('phone') || '').replace(/\D/g, '').trim();
  var address = String(fd.get('address') || '').trim();
  var city = String(fd.get('city') || '').trim();
  var pincode = String(fd.get('pincode') || '').replace(/\D/g, '').trim();
  var password = String(fd.get('password') || '');
  var errorEl = document.getElementById('registerFormError');
  errorEl.style.display = 'none';

  var missing = [];
  if (!name) missing.push('Full Name');
  if (!email) missing.push('Email');
  if (!phone) missing.push('Phone Number');
  if (!address) missing.push('Delivery Address');
  if (!city) missing.push('City');
  if (!pincode) missing.push('Pincode');
  if (!password) missing.push('Password');
  if (missing.length) {
    showFormError('registerFormError', 'Missing: ' + missing.join(', ') + '.');
    return;
  }
  if (!/^[0-9]{10}$/.test(phone)) {
    showFormError('registerFormError', 'Please enter a valid 10-digit phone number.');
    return;
  }
  if (!/^[0-9]{6}$/.test(pincode)) {
    showFormError('registerFormError', 'Please enter a valid 6-digit pincode.');
    return;
  }
  if (password.length < 6) {
    showFormError('registerFormError', 'Password must be at least 6 characters.');
    return;
  }

  try {
    await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone, address, city, pincode })
    });
    var data = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('mediswiftToken', data.token);
    loginUser(data.user);
    form.reset();
    closeModal('registerModal');
    showToast('Account created successfully!');
  } catch (error) {
    showFormError('registerFormError', error.message || 'Could not create account.');
  }
}

async function restoreLogin() {
  if (!localStorage.getItem('mediswiftToken')) return;

  try {
    var data = await apiRequest('/profile');
    loginUser(data.user);
  } catch (error) {
    localStorage.removeItem('mediswiftToken');
    user = null;
    document.getElementById('navAuth').style.display = 'flex';
    document.getElementById('navUser').style.display = 'none';
    document.getElementById('navUser').classList.remove('active');
  }
}

async function logoutUser(e) {
  if (e && e.preventDefault) e.preventDefault();

  try {
    await apiRequest('/logout', { method: 'POST' });
  } catch (error) {
    // Even if the server session is already gone, clear the browser session.
  }

  localStorage.removeItem('mediswiftToken');
  user = null;
  document.getElementById('navAuth').style.display = 'flex';
  document.getElementById('navUser').style.display = 'none';
  document.getElementById('navUser').classList.remove('active');
  document.getElementById('userDropdown').classList.remove('show');
  closeMobileMenu();
}

// ==================== NAVBAR ====================

function initNavbar() {
  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function() {
    if (window.scrollY > 8) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    var scrollTopBtn = document.getElementById('scrollTopBtn');
    if (window.scrollY > 500) scrollTopBtn.classList.add('show');
    else scrollTopBtn.classList.remove('show');
  });

  // Mobile menu
  document.getElementById('mobileMenuBtn').addEventListener('click', function() {
    var menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
    var icon = document.getElementById('menuIcon');
    if (menu.classList.contains('open')) {
      icon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    } else {
      icon.innerHTML = '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>';
    }
  });

  // User dropdown
  document.getElementById('userAvatarBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('userDropdown').classList.toggle('show');
  });
  document.addEventListener('click', function() {
    document.getElementById('userDropdown').classList.remove('show');
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', function(e) { e.preventDefault(); logoutUser(); });
}

function closeMobileMenu() {
  var menu = document.getElementById('mobileMenu');
  menu.classList.remove('open');
  document.getElementById('menuIcon').innerHTML = '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>';
}

// ==================== REVEAL ON SCROLL ====================

function initReveal() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
}

// ==================== ANIMATED COUNTERS ====================

function initCounters() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        var target = parseInt(el.dataset.value);
        var suffix = el.dataset.suffix || '';
        var current = 0;
        var duration = 2000;
        var steps = 60;
        var increment = target / steps;
        var step = 0;
        var timer = setInterval(function() {
          step++;
          current = Math.round(increment * step);
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = current.toLocaleString('en-IN') + suffix;
        }, duration / steps);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-value').forEach(function(el) { observer.observe(el); });
}
//==================== UPLOAD DRAG & DROP ====================

function initUpload() {
  var dropzone = document.getElementById('dropzone');
  var fileInput = document.getElementById('fileInput');

  dropzone.addEventListener('click', function() { fileInput.click(); });
  fileInput.addEventListener('change', function(e) { if (e.target.files[0]) handleFile(e.target.files[0]); });

  dropzone.addEventListener('dragover', function(e) { e.preventDefault(); dropzone.classList.add('dragging'); document.getElementById('dropzoneTitle').textContent = 'Drop your file here'; });
  dropzone.addEventListener('dragleave', function(e) { dropzone.classList.remove('dragging'); document.getElementById('dropzoneTitle').textContent = 'Drag & drop your prescription'; });
  dropzone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropzone.classList.remove('dragging');
    document.getElementById('dropzoneTitle').textContent = 'Drag & drop your prescription';
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', async function() {
  restoreLogin();
  await window.mediswiftMedicinesReady;
  // Render all sections
  renderFeatures();
  renderSteps();
  renderStats();
  renderPharmacies();
  renderCategories();
  renderMedicines();
  renderCart();
  renderTracking();
  initChat();
  renderDoctors();
  renderTestimonials();
  renderTrustStrip();
  renderQuickActions();

  // Init interactions
  initNavbar();
  initReveal();
  initCounters();
  initUpload();
  initNavSearch();
  initFloatingChat();
  initEmergency();

  // Search
  var medSearch = document.getElementById('medicineSearch');
  medSearch.addEventListener('input', function() {
    searchQuery = medSearch.value;
    document.getElementById('searchClear').style.display = searchQuery ? 'block' : 'none';
    renderMedicines();
  });
  document.getElementById('searchClear').addEventListener('click', function() {
    medSearch.value = ''; searchQuery = ''; document.getElementById('searchClear').style.display = 'none'; renderMedicines();
  });

  // Sort
  document.getElementById('sortSelect').addEventListener('change', function(e) { sortBy = e.target.value; renderMedicines(); });

  // Cart
  document.getElementById('applyCouponBtn').addEventListener('click', applyCoupon);
  document.getElementById('couponInput').addEventListener('keypress', function(e) { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } });
  document.getElementById('checkoutBtn').addEventListener('click', openCheckout);

  // Checkout
  document.getElementById('checkoutForm').addEventListener('submit', handleCheckoutSubmit);
  document.getElementById('checkoutPincode').addEventListener('input', function(e) { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); });
  document.getElementById('checkoutPhone').addEventListener('input', function(e) { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); });

  // Doctor search
  var docSearch = document.getElementById('doctorSearch');
  docSearch.addEventListener('input', function() {
    doctorQuery = docSearch.value;
    document.getElementById('doctorSearchClear').style.display = doctorQuery ? 'block' : 'none';
    renderDoctors();
  });
  document.getElementById('doctorSearchClear').addEventListener('click', function() {
    docSearch.value = ''; doctorQuery = ''; document.getElementById('doctorSearchClear').style.display = 'none'; renderDoctors();
  });
  document.getElementById('filterAllBtn').addEventListener('click', function() { doctorFilter = 'all'; document.getElementById('filterAllBtn').classList.add('active'); document.getElementById('filterAvailableBtn').classList.remove('active'); renderDoctors(); });
  document.getElementById('filterAvailableBtn').addEventListener('click', function() { doctorFilter = 'available'; document.getElementById('filterAvailableBtn').classList.add('active'); document.getElementById('filterAllBtn').classList.remove('active'); renderDoctors(); });

  // Assistant
  document.getElementById('assistantForm').addEventListener('submit', function(e) { e.preventDefault(); sendMessage(document.getElementById('assistantInput').value); });
  document.getElementById('clearChatBtn').addEventListener('click', initChat);

  // Modals
  document.getElementById('loginBtn').addEventListener('click', function(e) { e.preventDefault(); openModal('loginModal'); });
  document.getElementById('registerBtn').addEventListener('click', function(e) { e.preventDefault(); openModal('registerModal'); });
  document.getElementById('mobileLoginBtn').addEventListener('click', function(e) { e.preventDefault(); closeMobileMenu(); openModal('loginModal'); });
  document.getElementById('mobileRegisterBtn').addEventListener('click', function(e) { e.preventDefault(); closeMobileMenu(); openModal('registerModal'); });
  document.querySelectorAll('[data-modal]').forEach(function(el) {
    el.addEventListener('click', function() { closeModal(el.dataset.modal); });
  });
  document.querySelectorAll('[data-modal-open]').forEach(function(el) {
    el.addEventListener('click', function(e) { e.preventDefault(); closeModal(el.dataset.modalClose); openModal(el.dataset.modalOpen); });
  });
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('registerPhone').addEventListener('input', function(e) { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); });
  document.getElementById('registerPincode').addEventListener('input', function(e) { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); });

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.style.display = 'none'; });
  });

  // Scroll to top
  document.getElementById('scrollTopBtn').addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // Close mobile menu on nav link click
  document.querySelectorAll('.mobile-menu-link').forEach(function(link) {
    link.addEventListener('click', closeMobileMenu);
  });

  // Re-run reveal after dynamic content is added
  setTimeout(function() {
    document.querySelectorAll('.reveal:not(.visible)').forEach(function(el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) el.classList.add('visible');
    });
  }, 100);
});