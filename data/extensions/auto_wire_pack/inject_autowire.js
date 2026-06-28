// AUTO-WIRE ENGINE — inject_autowire.js v1.2
// Moteur universel : polling Bridge + auto-réparation du code généré
// Compatible : DeepSeek, ChatGPT, Gemini
(function () {
  'use strict';
  if (window._autoWireActive) return;
  window._autoWireActive = true;

  const BRIDGE = 'http://127.0.0.1:5005';
  const POLL_MS = 2000;

  // ═══════════════════════════════════════════════════════════════
  // DICTIONNAIRE D'AUTO-RÉPARATION
  // Toutes les erreurs connues → corrections automatiques
  // ═══════════════════════════════════════════════════════════════
  const LUCIDE_ICON_MAP = {
    // Icônes qui n'existent pas dans lucide-react → remplacement valide
    'ChartLine':       'TrendingUp',
    'ChartBar':        'BarChart2',
    'ChartPie':        'PieChart',
    'ChartDonut':      'PieChart',
    'Chart':           'BarChart2',
    'GraphLine':       'TrendingUp',
    'GraphBar':        'BarChart2',
    'Map':             'MapPin',
    'Location':        'MapPin',
    'Pin':             'MapPin',
    'Localisation':    'MapPin',
    'Globe':           'Globe2',
    'Gear':            'Settings',
    'Setting':         'Settings',
    'Config':          'Settings',
    'Configuration':   'Settings',
    'Heart':           'Heart',
    'Like':            'ThumbsUp',
    'Dislike':         'ThumbsDown',
    'Star':            'Star',
    'Favourite':       'Bookmark',
    'Favorite':        'Bookmark',
    'Bell':            'Bell',
    'Notification':    'Bell',
    'Alert':           'AlertCircle',
    'Warning':         'AlertTriangle',
    'Error':           'XCircle',
    'Success':         'CheckCircle',
    'Tick':            'Check',
    'Close':           'X',
    'Delete':          'Trash2',
    'Remove':          'Trash2',
    'Bin':             'Trash2',
    'Edit':            'Pencil',
    'Pen':             'Pencil',
    'Write':           'Pencil',
    'Search':          'Search',
    'Magnify':         'Search',
    'Zoom':            'Search',
    'Plus':            'Plus',
    'Add':             'Plus',
    'Minus':           'Minus',
    'Send':            'Send',
    'Upload':          'Upload',
    'Download':        'Download',
    'Share':           'Share2',
    'Link':            'Link',
    'Attach':          'Paperclip',
    'Clip':            'Paperclip',
    'Copy':            'Copy',
    'Paste':           'Clipboard',
    'Cut':             'Scissors',
    'Refresh':         'RefreshCw',
    'Reload':          'RefreshCw',
    'Sync':            'RefreshCw',
    'Spinner':         'Loader2',
    'Loading':         'Loader2',
    'Loader':          'Loader2',
    'Menu':            'Menu',
    'Burger':          'Menu',
    'Hamburger':       'Menu',
    'Grid':            'LayoutGrid',
    'Layout':          'Layout',
    'Dashboard':       'LayoutDashboard',
    'Home':            'Home',
    'House':           'Home',
    'User':            'User',
    'Profile':         'UserCircle',
    'Account':         'UserCircle',
    'Avatar':          'UserCircle',
    'Group':           'Users',
    'Team':            'Users',
    'Lock':            'Lock',
    'Secure':          'Lock',
    'Unlock':          'Unlock',
    'Key':             'Key',
    'Eye':             'Eye',
    'Show':            'Eye',
    'EyeOff':          'EyeOff',
    'Hide':            'EyeOff',
    'Filter':          'Filter',
    'Sort':            'ArrowUpDown',
    'Tag':             'Tag',
    'Label':           'Tag',
    'Badge':           'Badge',
    'Trophy':          'Trophy',
    'Award':           'Award',
    'Medal':           'Medal',
    'Crown':           'Crown',
    'Diamond':         'Gem',
    'Gem':             'Gem',
    'Fire':            'Flame',
    'Flame':           'Flame',
    'Lightning':       'Zap',
    'Zap':             'Zap',
    'Bolt':            'Zap',
    'Rocket':          'Rocket',
    'Target':          'Target',
    'Bullseye':        'Target',
    'Flag':            'Flag',
    'Clock':           'Clock',
    'Time':            'Clock',
    'Timer':           'Timer',
    'Stopwatch':       'Timer',
    'Calendar':        'Calendar',
    'Date':            'CalendarDays',
    'Schedule':        'CalendarCheck',
    'Phone':           'Phone',
    'Mobile':          'Smartphone',
    'Tablet':          'Tablet',
    'Laptop':          'Laptop',
    'Computer':        'Monitor',
    'Monitor':         'Monitor',
    'Tv':              'Tv',
    'Camera':          'Camera',
    'Photo':           'Image',
    'Image':           'Image',
    'Picture':         'Image',
    'Video':           'Video',
    'Play':            'Play',
    'Pause':           'Pause',
    'Stop':            'Square',
    'Volume':          'Volume2',
    'Sound':           'Volume2',
    'Mute':            'VolumeX',
    'Music':           'Music',
    'Headphones':      'Headphones',
    'Mic':             'Mic',
    'Microphone':      'Mic',
    'Wifi':            'Wifi',
    'Signal':          'Signal',
    'Bluetooth':       'Bluetooth',
    'Battery':         'Battery',
    'Power':           'Power',
    'Sun':             'Sun',
    'Moon':            'Moon',
    'Cloud':           'Cloud',
    'Rain':            'CloudRain',
    'Snow':            'CloudSnow',
    'Wind':            'Wind',
    'ThumbsUp':        'ThumbsUp',
    'ThumbsDown':      'ThumbsDown',
    'Smile':           'Smile',
    'Frown':           'Frown',
    'Emoji':           'Smile',
    'Book':            'Book',
    'Folder':          'Folder',
    'File':            'File',
    'Document':        'FileText',
    'Doc':             'FileText',
    'Pdf':             'FileText',
    'Excel':           'FileSpreadsheet',
    'Zip':             'Archive',
    'Archive':         'Archive',
    'Box':             'Box',
    'Package':         'Package',
    'Gift':            'Gift',
    'Cart':            'ShoppingCart',
    'Bag':             'ShoppingBag',
    'Shop':            'Store',
    'Store':           'Store',
    'Dollar':          'DollarSign',
    'Money':           'Banknote',
    'Credit':          'CreditCard',
    'CreditCard':      'CreditCard',
    'Bank':            'Building2',
    'Building':        'Building2',
    'Office':          'Building2',
    'Factory':         'Factory',
    'Hospital':        'Hospital',
    'School':          'School',
    'University':      'GraduationCap',
    'Graduation':      'GraduationCap',
    'Book2':           'BookOpen',
    'Pencil':          'Pencil',
    'Pen2':            'Pen',
    'Brush':           'Paintbrush',
    'Palette':         'Palette',
    'Code':            'Code2',
    'Terminal':        'Terminal',
    'Command':         'Command',
    'Hash':            'Hash',
    'At':              'AtSign',
    'Email':           'Mail',
    'Mail':            'Mail',
    'Message':         'MessageCircle',
    'Chat':            'MessageSquare',
    'Comment':         'MessageSquare',
    'Reply':           'Reply',
    'Forward':         'Forward',
    'Arrow':           'ArrowRight',
    'ArrowUp':         'ArrowUp',
    'ArrowDown':       'ArrowDown',
    'ArrowLeft':       'ArrowLeft',
    'ArrowRight':      'ArrowRight',
    'Chevron':         'ChevronRight',
    'ChevronUp':       'ChevronUp',
    'ChevronDown':     'ChevronDown',
    'ChevronLeft':     'ChevronLeft',
    'ChevronRight':    'ChevronRight',
    'Maximize':        'Maximize2',
    'Minimize':        'Minimize2',
    'Expand':          'Expand',
    'Collapse':        'Shrink',
    'Move':            'Move',
    'Drag':            'GripVertical',
    'Resize':          'Move',
    'Info':            'Info',
    'Question':        'HelpCircle',
    'Help':            'HelpCircle',
    'Support':         'HelpCircle',
    'Circle':          'Circle',
    'Dot':             'Dot',
    'Ellipsis':        'Ellipsis',
    'More':            'MoreHorizontal',
    'MoreVertical':    'MoreVertical',
    'MoreHorizontal':  'MoreHorizontal',
    'List':            'List',
    'ListOrdered':     'ListOrdered',
    'Table':           'Table',
    'Columns':         'Columns',
    'Rows':            'Rows',
    'Split':           'SplitSquareHorizontal',
    'Layers':          'Layers',
    'Stack':           'Layers',
    'Toggle':          'ToggleRight',
    'Switch':          'ToggleRight',
    'Slider':          'Sliders',
    'Range':           'Sliders',
    'Input':           'FormInput',
    'Form':            'FormInput',
    'Select':          'ChevronsUpDown',
    'Dropdown':        'ChevronDown',
    'Radio':           'Circle',
    'Checkbox':        'CheckSquare',
    'Check':           'Check',
  };

  // ═══════════════════════════════════════════════════════════════
  // AUTO-REPAIR ENGINE — Corrige le code avant envoi au Bridge
  // ═══════════════════════════════════════════════════════════════
  function autoRepairCode(code) {
    let fixed = code;
    let repairs = [];

    // 1. Corriger les icônes lucide-react inconnues
    const lucideImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
    fixed = fixed.replace(lucideImportRegex, (match, icons) => {
      const iconList = icons.split(',').map(i => i.trim()).filter(Boolean);
      const corrected = iconList.map(icon => {
        const fix = LUCIDE_ICON_MAP[icon];
        if (fix && fix !== icon) {
          repairs.push(`🔧 Icône: ${icon} → ${fix}`);
          return fix;
        }
        return icon;
      });
      // Déduplique les icônes
      const unique = [...new Set(corrected)];
      return `import { ${unique.join(', ')} } from 'lucide-react'`;
    });

    // Corriger aussi les usages inline (ex: <ChartLine dans un objet)
    for (const [wrong, right] of Object.entries(LUCIDE_ICON_MAP)) {
      if (wrong === right) continue;
      // Remplace seulement si utilisé comme icône (pas dans une chaîne)
      const usageRegex = new RegExp(`(?<!['"\`])\\b${wrong}\\b(?!['"'\`])`, 'g');
      if (usageRegex.test(fixed) && wrong !== right) {
        fixed = fixed.replace(usageRegex, right);
        if (!repairs.includes(`🔧 Icône: ${wrong} → ${right}`)) {
          repairs.push(`🔧 Usage: ${wrong} → ${right}`);
        }
      }
    }

    // 2. Supprimer les imports dupliqués
    const importLines = fixed.match(/^import .+$/gm) || [];
    const seen = new Set();
    const deduped = [];
    let hasDuplicates = false;
    importLines.forEach(line => {
      const key = line.trim();
      if (seen.has(key)) {
        hasDuplicates = true;
        repairs.push(`🧹 Import dupliqué supprimé: ${key.slice(0, 60)}...`);
      } else {
        seen.add(key);
        deduped.push(line);
      }
    });

    // 3. Corriger useState manquant (pattern courant)
    if (fixed.includes('useState') && !fixed.includes("import React") && !fixed.includes("{ useState }")) {
      // Essayer d'ajouter useState à l'import React existant
      fixed = fixed.replace(/import React from 'react'/, "import React, { useState } from 'react'");
      repairs.push('🔧 useState ajouté à l\'import React');
    }

    // 4. Corriger useEffect manquant
    if (fixed.includes('useEffect') && !fixed.includes("useEffect")) {
      fixed = fixed.replace(/import React(, \{([^}]+)\})? from 'react'/, (m, g1, g2) => {
        const existing = g2 ? g2.split(',').map(x => x.trim()) : [];
        if (!existing.includes('useEffect')) existing.push('useEffect');
        return `import React, { ${existing.join(', ')} } from 'react'`;
      });
      repairs.push('🔧 useEffect ajouté à l\'import React');
    }

    if (repairs.length > 0) {
      console.log(`⚡ [AUTO-WIRE] ${repairs.length} réparation(s) appliquée(s) :`, repairs);
      flashStatus(`🔧 ${repairs.length} fix(es) appliqués`, '#facc15');
    }

    return fixed;
  }

  // ═══════════════════════════════════════════════════════════════
  // UI FLOATING BADGE
  // ═══════════════════════════════════════════════════════════════
  function injectUI() {
    if (document.getElementById('aw-badge')) return;
    const badge = document.createElement('div');
    badge.id = 'aw-badge';
    badge.style.cssText = [
      'position:fixed', 'top:10px', 'right:10px', 'z-index:9999999',
      'background:rgba(10,20,40,0.95)', 'backdrop-filter:blur(12px)',
      'border:1.5px solid #38bdf8', 'color:#f1f5f9',
      'padding:12px 16px', 'border-radius:12px',
      'font-family:monospace', 'font-size:11px',
      'box-shadow:0 8px 32px rgba(56,189,248,0.2)',
      'min-width:200px', 'text-align:center', 'line-height:1.5'
    ].join(';');
    badge.innerHTML = `
      <div style="font-weight:900;color:#38bdf8;letter-spacing:1px;margin-bottom:4px">⚡ AUTO-WIRE v1.2</div>
      <div style="font-size:9px;color:#475569;margin-bottom:6px">Auto-Repair Engine actif</div>
      <div id="aw-status" style="color:#4ade80;font-size:10px;margin-bottom:8px">READY</div>
      <button id="aw-capture" style="width:100%;background:linear-gradient(90deg,#0ea5e9,#2563eb);border:none;color:#fff;padding:7px;border-radius:7px;cursor:pointer;font-weight:bold;font-size:10px">📋 FORCE CAPTURE</button>
    `;
    document.body.appendChild(badge);

    document.getElementById('aw-capture').addEventListener('click', () => {
      const msgs = document.querySelectorAll(SELECTORS.chatMessages);
      if (msgs.length > 0) {
        const txt = msgs[msgs.length - 1].innerText || msgs[msgs.length - 1].textContent || '';
        sendCallback(txt);
        flashStatus('📤 Capturé !', '#facc15');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SELECTORS (DeepSeek / ChatGPT / Gemini)
  // ═══════════════════════════════════════════════════════════════
  const SELECTORS = {
    input: 'textarea,[contenteditable="true"],.ds-textarea,[role="textbox"],#chat-input,rich-textarea',
    sendBtn: 'button[aria-label*="Send"],button[aria-label*="Envoyer"],.ds-input-send-button,.ds-input__send-btn,[data-testid="send-button"],[aria-label*="Submit"]',
    chatMessages: '.ds-markdown,.markdown-body,.prose,.model-response-text,[class*="message-content"],[data-testid*="message"],message-content,[data-testid="answer"]',
    stopBtn: 'button[aria-label*="Stop"],button[aria-label*="Arrêter"],.ds-icon--stop,.stop-button,.generating'
  };

  // ═══════════════════════════════════════════════════════════════
  // INJECT PROMPT INTO AI
  // ═══════════════════════════════════════════════════════════════
  function injectPrompt(text) {
    const input = document.querySelector(SELECTORS.input);
    if (!input) { flashStatus('❌ Input introuvable', '#f87171'); return; }
    input.focus();
    try { document.execCommand('insertText', false, text); } catch (e) {
      if (input.value !== undefined) input.value = text;
      else if (input.innerText !== undefined) input.innerText = text;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    flashStatus('✅ Prompt injecté !', '#4ade80');
    setTimeout(() => {
      const btn = document.querySelector(SELECTORS.sendBtn);
      if (btn && !btn.disabled) btn.click();
    }, 800);
  }

  // ═══════════════════════════════════════════════════════════════
  // MONITOR + CAPTURE + AUTO-REPAIR
  // ═══════════════════════════════════════════════════════════════
  let lastCapture = '';
  let lastLen = 0;
  let lastActivity = Date.now();

  function monitorGeneration() {
    const msgs = document.querySelectorAll(SELECTORS.chatMessages);
    if (!msgs.length) return;
    const last = msgs[msgs.length - 1];
    const content = last.innerText || last.textContent || '';

    if (content.length > lastLen) { lastLen = content.length; lastActivity = Date.now(); }

    const stopBtn = document.querySelector(SELECTORS.stopBtn);
    const isGenerating = !!stopBtn;
    const idle = Date.now() - lastActivity > 3000;
    const hasCode = content.includes('```') || content.includes('[[FILE:') || content.includes('FILE:');

    if (content !== lastCapture && (hasCode || content.length > lastCapture.length + 200)) {
      if (!isGenerating || idle) {
        lastCapture = content;
        // ⚡ Auto-réparation avant envoi au Bridge
        const repairedContent = autoRepairCode(content);
        sendCallback(repairedContent);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BRIDGE POLLING
  // ═══════════════════════════════════════════════════════════════
  async function poll() {
    try {
      const res = await fetch(`${BRIDGE}/v1/bridge/poll`);
      if (!res.ok) throw new Error('offline');
      const data = await res.json();

      const statusEl = document.getElementById('aw-status');
      if (statusEl) statusEl.textContent = (data.status || 'IDLE').toUpperCase();

      monitorGeneration();

      if (data.status === 'prompt' && data.prompt) {
        if (data.project_id) localStorage.setItem('aw_project_id', data.project_id);
        await fetch(`${BRIDGE}/v1/bridge/clear`, { method: 'POST' });
        injectPrompt(data.prompt);
      }
    } catch (e) {
      const s = document.getElementById('aw-status');
      if (s) { s.textContent = 'BRIDGE OFFLINE'; s.style.color = '#f87171'; }
    }
  }

  async function sendCallback(content) {
    const projectId = localStorage.getItem('aw_project_id') || '';
    try {
      await fetch(`${BRIDGE}/v1/bridge/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, project_id: projectId })
      });
    } catch (e) {}
  }

  function flashStatus(msg, color) {
    const el = document.getElementById('aw-status');
    if (el) { el.textContent = msg; el.style.color = color;
      setTimeout(() => { if (el) { el.style.color = '#4ade80'; } }, 3000); }
  }

  // BOOT
  setInterval(poll, POLL_MS);
  setInterval(injectUI, 2000);

})();
