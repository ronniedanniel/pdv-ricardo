function fmt(value) {
  return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateOnly(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function today() {
  return new Date().toDateString();
}

function toast(msg, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'flex'; setTimeout(() => m.classList.add('open'), 10); }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); setTimeout(() => m.style.display = 'none', 250); }
}

function confirm(msg, onYes) {
  const m = document.getElementById('modal-confirm');
  if (!m) return onYes();
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-yes').onclick = () => { closeModal('modal-confirm'); onYes(); };
  openModal('modal-confirm');
}

function activePage() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === page);
  });
}

function setInnerHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setVal(id, v) {
  const el = document.getElementById(id);
  if (el) el.value = v;
}

function show(id) { const el = document.getElementById(id); if (el) el.style.display = ''; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

const PAYMENT_LABELS = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão Crédito',
  cartao_debito: 'Cartão Débito',
  pix: 'PIX',
  fiado: 'Fiado',
  multiplo: 'Múltiplo',
};

const MOVEMENT_LABELS = {
  in: 'Entrada',
  sale: 'Venda',
  waste: 'Desperdício',
  adjustment: 'Ajuste',
};

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Mobile Menu Drawer Navigation
function initMobileMenu() {
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'menu-toggle-btn';
  toggleBtn.innerHTML = '☰';
  
  const topbar = document.querySelector('.topbar') || document.querySelector('.pdv-topbar');
  if (topbar) {
    topbar.insertBefore(toggleBtn, topbar.firstChild);
  }

  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:999;';
  document.body.appendChild(overlay);

  function toggleSidebar(e) {
    if (e) e.stopPropagation();
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      const isOpen = sidebar.classList.contains('open');
      if (isOpen) {
        sidebar.classList.remove('open');
        overlay.style.display = 'none';
      } else {
        sidebar.classList.add('open');
        overlay.style.display = 'block';
      }
    }
  }

  toggleBtn.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', toggleSidebar);

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        toggleSidebar();
      }
    });
  });
}

function checkAuth() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  if (page === 'login.html') return true;
  
  const userStr = sessionStorage.getItem('currentUser');
  if (!userStr) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function adjustSidebarForRole() {
  const userStr = sessionStorage.getItem('currentUser');
  if (!userStr) return;
  const user = JSON.parse(userStr);
  
  const restrictedPages = ['produtos.html', 'estoque.html', 'relatorios.html', 'configuracoes.html'];
  
  if (user.role !== 'admin') {
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (restrictedPages.some(p => href.startsWith(p))) {
        a.style.display = 'none';
      }
    });
    
    // Also hide nav groups if all their links are hidden
    // In our layout: Gestão group has Clientes (allowed) and others (restricted).
    // Sistema has Configurações (restricted). Let's hide the "Sistema" group header.
    document.querySelectorAll('.sidebar-nav .nav-group').forEach(group => {
      if (group.textContent.trim() === 'Sistema') {
        group.style.display = 'none';
      }
    });

    const page = window.location.pathname.split('/').pop() || 'index.html';
    if (restrictedPages.some(p => page.startsWith(p))) {
      window.location.href = 'index.html';
    }
  }
}

function addLogoutButton() {
  const nav = document.querySelector('.sidebar-nav');
  if (nav) {
    const userStr = sessionStorage.getItem('currentUser');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    
    const group = document.createElement('div');
    group.className = 'nav-group';
    group.style.marginTop = '16px';
    group.textContent = 'Usuário';
    
    const userDisplay = document.createElement('div');
    userDisplay.style.cssText = 'padding: 8px 16px; font-size: 13px; color: var(--text2); display: flex; align-items: center; gap: 8px; font-weight: 600;';
    userDisplay.innerHTML = `👤 <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">${user.name}</span>`;
    
    const logoutLink = document.createElement('a');
    logoutLink.className = 'nav-link';
    logoutLink.href = '#';
    logoutLink.style.marginTop = '2px';
    logoutLink.innerHTML = '<i class="icon">🚪</i> Sair';
    logoutLink.onclick = (e) => {
      e.preventDefault();
      sessionStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    };
    
    nav.appendChild(group);
    nav.appendChild(userDisplay);
    nav.appendChild(logoutLink);
  }
}

function initAuthAndMenu() {
  const authed = checkAuth();
  if (authed) {
    initMobileMenu();
    adjustSidebarForRole();
    addLogoutButton();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthAndMenu);
} else {
  initAuthAndMenu();
}
