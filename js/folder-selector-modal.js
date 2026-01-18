// Folder selector modal module (used for move/save dialogs)

const folderSelectorModal = {
  extractFolders: (bookmarkTree, excludeId = null) => {
    const folders = [];

    const traverse = (nodes, path = '') => {
      if (!nodes) return;

      nodes.forEach(node => {
        if (!node.url && node.id !== excludeId) {
          const currentPath = path ? `${path} > ${node.title}` : node.title;
          folders.push({
            id: node.id,
            title: node.title,
            path: currentPath
          });

          if (node.children) {
            traverse(node.children, currentPath);
          }
        }
      });
    };

    traverse(bookmarkTree);
    return folders;
  },

  renderFolderList: (container, folders, { onSelect, setSelectedIndex } = {}) => {
    container.innerHTML = '';

    if (!folders.length) {
      container.appendChild(
        h('div', {
          style: { padding: '16px', textAlign: 'center', color: '#999' }
        }, 'No folders found')
      );
      return;
    }

    folders.forEach((folder, index) => {
      const folderItem = h('div', {
        class: 'prd-stv-folder-item',
        'data-folder-id': folder.id,
        'data-index': index,
        style: {
          padding: '8px 12px',
          cursor: 'pointer',
          borderBottom: '1px solid #3a3a3a',
          display: 'flex',
          flexDirection: 'column'
        }
      }, [
        h('div', {
          style: { fontSize: '14px', color: '#f5f5f5' }
        }, folder.title),
        h('div', {
          style: { fontSize: '12px', color: '#999', marginTop: '2px' }
        }, folder.path)
      ]);
      container.appendChild(folderItem);
    });

    if (container._prdStvFolderListClickHandler) {
      container.removeEventListener('click', container._prdStvFolderListClickHandler);
    }

    container._prdStvFolderListClickHandler = (e) => {
      const folderItem = e.target.closest('.prd-stv-folder-item');
      if (!folderItem || !folderItem.dataset.folderId) return;

      const clickedIndex = Number(folderItem.dataset.index);
      if (Number.isFinite(clickedIndex) && typeof setSelectedIndex === 'function') {
        setSelectedIndex(clickedIndex);
      }

      if (typeof onSelect === 'function') {
        onSelect(folderItem.dataset.folderId);
      }
    };

    container.addEventListener('click', container._prdStvFolderListClickHandler);
  },

  show: async ({
    title,
    actionText = 'Move',
    showTitleInput = false,
    titleValue = '',
    titlePlaceholder = 'Bookmark title',
    excludeId = null,
    focus = 'search',
  } = {}) => {
    const existingDialog = document.querySelector('.prd-stv-move-overlay');
    if (existingDialog) existingDialog.remove();

    const titleInputEl = showTitleInput ? h('input', {
      type: 'text',
      class: 'prd-stv-title-input',
      placeholder: titlePlaceholder,
      value: titleValue
    }) : null;

    const dialog = h('div', { class: 'prd-stv-move-dialog' }, [
      h('h3', { style: { margin: '0 0 16px 0', fontSize: '16px' } }, title || 'Select a folder'),
      titleInputEl,
      h('input', {
        type: 'text',
        class: 'prd-stv-folder-search',
        placeholder: 'Search folders...'
      }),
      h('div', { class: 'prd-stv-folder-list' }, h('div', {
        style: { padding: '16px', textAlign: 'center', color: '#999' }
      }, 'Loading folders...')),
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          marginTop: '16px'
        }
      }, [
        h('button', { class: 'prd-stv-cancel-btn' }, 'Cancel'),
        h('button', { class: 'prd-stv-move-btn', disabled: true }, actionText)
      ])
    ]);

    const overlay = h('div', { class: 'prd-stv-move-overlay' }, dialog);
    document.body.appendChild(overlay);

    let resolvePromise;
    let finished = false;
    const resultPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const folderList = dialog.querySelector('.prd-stv-folder-list');
    const titleInput = dialog.querySelector('.prd-stv-title-input');
    const searchInput = dialog.querySelector('.prd-stv-folder-search');
    const confirmBtn = dialog.querySelector('.prd-stv-move-btn');
    const cancelBtn = dialog.querySelector('.prd-stv-cancel-btn');

    let selectedFolderId = null;
    let allFolders = [];
    let filteredFolders = [];
    let selectedIndex = -1;

    const close = () => overlay.remove();

    const cleanup = () => {
      cancelBtn?.removeEventListener('click', handleCancel);
      overlay?.removeEventListener('click', handleOverlayClick);
      searchInput?.removeEventListener('input', handleSearchInput);
      searchInput?.removeEventListener('keydown', handleSearchKeydown);
      confirmBtn?.removeEventListener('click', handleConfirm);
      titleInput?.removeEventListener('keydown', handleTitleKeydown);
    };

    const finish = (value) => {
      if (finished) return;
      finished = true;
      cleanup();
      close();
      resolvePromise(value);
    };

    const setSelectedIndex = (index) => {
      selectedIndex = index;
    };

    const updateSelection = (folderId) => {
      selectedFolderId = folderId;
      confirmBtn.disabled = !folderId;
      folderList.querySelectorAll('.prd-stv-folder-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.folderId === folderId);
      });
    };

    const selectByIndex = (index) => {
      selectedIndex = index;
      const items = folderList.querySelectorAll('.prd-stv-folder-item');
      items.forEach((item, i) => item.classList.toggle('selected', i === index));

      if (index >= 0 && index < items.length) {
        const selectedItem = items[index];
        selectedFolderId = selectedItem.dataset.folderId;
        confirmBtn.disabled = false;
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        selectedFolderId = null;
        confirmBtn.disabled = true;
      }
    };

    const loadFolders = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_BOOKMARK_TREE' });
        if (!response) throw new Error('No response from background script');
        if (response.success === false) throw new Error(response.error || 'Failed to get bookmark tree');

        allFolders = folderSelectorModal.extractFolders(response, excludeId);
        filteredFolders = allFolders;
        folderSelectorModal.renderFolderList(folderList, filteredFolders, {
          onSelect: updateSelection,
          setSelectedIndex
        });
      } catch (error) {
        console.error('Failed to load folders:', error);
        folderList.innerHTML = '<div style="padding:16px;text-align:center;color:#ff6666;">Failed to load folders</div>';
      }
    };

    await loadFolders();

    const handleSearchInput = (e) => {
      const query = e.target.value.toLowerCase();
      filteredFolders = allFolders.filter(folder =>
        folder.title.toLowerCase().includes(query) || folder.path.toLowerCase().includes(query)
      );
      selectedIndex = -1;
      selectedFolderId = null;
      confirmBtn.disabled = true;
      folderSelectorModal.renderFolderList(folderList, filteredFolders, {
        onSelect: updateSelection,
        setSelectedIndex
      });
    };

    const handleSearchKeydown = (e) => {
      const items = folderList.querySelectorAll('.prd-stv-folder-item');

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        selectByIndex(selectedIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        selectByIndex(selectedIndex);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedFolderId) handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish(null);
      }
    };

    const handleTitleKeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchInput.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish(null);
      }
    };

    const handleCancel = () => finish(null);

    const handleOverlayClick = (e) => {
      if (e.target === overlay) finish(null);
    };

    const handleConfirm = () => {
      if (!selectedFolderId) return;
      const editedTitle = titleInput ? titleInput.value.trim() : null;
      finish({
        folderId: selectedFolderId,
        title: editedTitle
      });
    };

    cancelBtn?.addEventListener('click', handleCancel);
    overlay?.addEventListener('click', handleOverlayClick);
    searchInput?.addEventListener('input', handleSearchInput);
    searchInput?.addEventListener('keydown', handleSearchKeydown);
    confirmBtn?.addEventListener('click', handleConfirm);
    if (titleInput) titleInput.addEventListener('keydown', handleTitleKeydown);

    // Focus management
    setTimeout(() => {
      if (focus === 'title' && titleInput) {
        titleInput.focus();
        titleInput.select();
      } else {
        searchInput?.focus();
      }
    }, 50);

    return resultPromise;
  }
};

window.folderSelectorModal = folderSelectorModal;
