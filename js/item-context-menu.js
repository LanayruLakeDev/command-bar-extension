// Shared context menu helpers for popup overlay + sidepanel

const itemContextMenu = {
  getQuickDates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const someday = new Date(today);
    const randomDays = Math.floor(Math.random() * 30) + 1;
    someday.setDate(someday.getDate() + randomDays);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      tomorrow: formatDate(tomorrow),
      nextWeek: formatDate(nextWeek),
      someday: formatDate(someday)
    };
  },

  close() {
    document.querySelectorAll('.prd-stv-context-menu').forEach(menu => menu.remove());
  },

  createDateIconRow(hasDate, handleDateAction) {
    const icons = {
      tomorrow: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v2M12 18v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M18 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        <circle cx="12" cy="12" r="4"/>
      </svg>`,
      nextWeek: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M12 14l3 3-3 3"/>
      </svg>`,
      someday: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M12 14c.5-1 1.5-1.5 2-1.5.8 0 1.5.7 1.5 1.5 0 1.5-2 2-2 3"/>
        <circle cx="12" cy="19" r="0.5" fill="currentColor"/>
      </svg>`,
      custom: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M15 14l2 2-4 4h-2v-2l4-4z"/>
      </svg>`,
      remove: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>`
    };

    const createIconButton = (action, icon, title) => {
      const btn = document.createElement('button');
      btn.className = 'prd-stv-date-icon-btn';
      btn.dataset.action = action;
      btn.title = title;
      btn.innerHTML = icon;
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const shouldClose = await handleDateAction(action);
        if (shouldClose !== false) itemContextMenu.close();
      });
      return btn;
    };

    const dateOptionsRow = document.createElement('div');
    dateOptionsRow.className = 'prd-stv-date-icon-row';
    dateOptionsRow.appendChild(createIconButton('add-date-tomorrow', icons.tomorrow, 'Tomorrow'));
    dateOptionsRow.appendChild(createIconButton('add-date-next-week', icons.nextWeek, 'Next week'));
    dateOptionsRow.appendChild(createIconButton('add-date-someday', icons.someday, 'Someday'));
    dateOptionsRow.appendChild(createIconButton('add-date-custom', icons.custom, 'Custom date'));

    if (!hasDate) return dateOptionsRow;

    const removeRow = document.createElement('div');
    removeRow.className = 'prd-stv-date-icon-row';
    removeRow.appendChild(createIconButton('remove-date', icons.remove, 'Remove date'));

    const section = document.createElement('div');
    section.className = 'prd-stv-date-icon-section';
    section.appendChild(dateOptionsRow);
    section.appendChild(removeRow);
    return section;
  },

  showMenuAtEvent(event, contentNodes, { minWidth = 180, offsetLeft = 120, offsetTop = 4 } = {}) {
    itemContextMenu.close();

    const buttonRect = event.target.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'prd-stv-context-menu';
    menu.style.left = `${buttonRect.left - offsetLeft}px`;
    menu.style.top = `${buttonRect.bottom + offsetTop}px`;
    menu.style.minWidth = `${minWidth}px`;

    contentNodes.filter(Boolean).forEach(node => menu.appendChild(node));
    document.body.appendChild(menu);

    setTimeout(() => {
      document.addEventListener('click', itemContextMenu.close, { once: true });
    }, 10);

    return menu;
  },

  createMenuItem(label, action) {
    const row = document.createElement('div');
    row.className = 'prd-stv-context-item';
    row.dataset.action = action;
    const span = document.createElement('span');
    span.textContent = label;
    row.appendChild(span);
    return row;
  }
};

window.itemContextMenu = itemContextMenu;

