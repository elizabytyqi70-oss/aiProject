/* ============================================================
   NOVA — Supabase Auth Client
   Replace the placeholder values with your Supabase project URL & anon key.
   Find them at: https://supabase.com/dashboard → Project → Settings → API
   ============================================================ */

const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- Auth State ---------- */
let currentUser = null;

async function initAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  updateNavForAuth(user);

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    updateNavForAuth(currentUser);
  });
}

/* ---------- Update Navigation ---------- */
function updateNavForAuth(user) {
  const authLinks = document.querySelectorAll('.auth-link');
  authLinks.forEach(el => el.remove());

  const nav = document.querySelector('.nav-links');
  if (!nav) return;

  if (user) {
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    nav.insertAdjacentHTML('beforeend',
      `<li class="auth-link"><a href="#" id="user-menu">👤 ${escapeHtml(name)}</a></li>
       <li class="auth-link"><a href="#" id="logout-btn">Dilni</a></li>`
    );
    document.getElementById('logout-btn')?.addEventListener('click', logout);
  } else {
    nav.insertAdjacentHTML('beforeend',
      `<li class="auth-link"><a href="login.html">Hyrja</a></li>
       <li class="auth-link"><a href="register.html" class="btn btn-primary" style="padding:0.4rem 1.2rem;font-size:0.85rem;">Regjistrohu</a></li>`
    );
  }
}

/* ---------- Register ---------- */
async function register(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });

  if (error) throw error;

  // Auto-create profile row (trigger handles this on server)
  // If email confirmation is OFF, user is logged in immediately
  // If ON, user sees "check your email" message
  return data;
}

/* ---------- Login ---------- */
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/* ---------- Logout ---------- */
async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

/* ---------- Get / Update Profile ---------- */
async function getProfile() {
  if (!currentUser) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  if (error) throw error;
  return data;
}

async function updateProfile(updates) {
  if (!currentUser) throw new Error('Not logged in');
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', currentUser.id);
  if (error) throw error;
  return data;
}

/* ---------- Contact Form (saves to DB) ---------- */
async function submitContact(formData) {
  const { data, error } = await supabase
    .from('contact_messages')
    .insert({
      user_id: currentUser?.id ?? null,
      ...formData
    });
  if (error) throw error;
  return data;
}

/* ---------- Helpers ---------- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg, isError = false) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast' + (isError ? ' error' : '');
  t.textContent = msg;
  t.setAttribute('role', 'status');
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 4000);
}

/* ---------- Bootstrap ---------- */
document.addEventListener('DOMContentLoaded', initAuth);
