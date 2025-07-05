document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const noteInput = document.getElementById("note-input");
  const addBtn = document.getElementById("add-btn");
  const notesList = document.getElementById("notes-list");
  const stats = document.getElementById("stats");
  const exportBtn = document.getElementById("export-btn");
  const importInput = document.getElementById("import-input");
  const clearAllBtn = document.getElementById("clear-all-btn");
  const searchInput = document.getElementById("search-input");
  const categorySelect = document.getElementById("category-select");
  const sortSelect = document.getElementById("sort-select");
  
  // Data
  let notes = JSON.parse(localStorage.getItem("notes-app-data") || "[]");
  let editingIndex = null;
  let currentFilter = "";
  let currentCategory = "all";
  let currentSort = "newest";

  // Categories
  const categories = ["personal", "work", "study", "ideas", "other"];

  // Save to localStorage
  const saveNotes = () => {
    localStorage.setItem("notes-app-data", JSON.stringify(notes));
  };

  // Escape HTML
  const escapeHtml = (text) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Hari ini";
    if (diffDays === 2) return "Kemarin";
    if (diffDays <= 7) return `${diffDays - 1} hari lalu`;
    
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Filter and sort notes
  const getFilteredNotes = () => {
    let filtered = notes.filter(note => {
      const matchesSearch = note.text.toLowerCase().includes(currentFilter.toLowerCase());
      const matchesCategory = currentCategory === "all" || note.category === currentCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort notes
    filtered.sort((a, b) => {
      switch (currentSort) {
        case "oldest":
          return new Date(a.date) - new Date(b.date);
        case "alphabetical":
          return a.text.localeCompare(b.text);
        case "category":
          return (a.category || "other").localeCompare(b.category || "other");
        default: // newest
          return new Date(b.date) - new Date(a.date);
      }
    });

    return filtered;
  };

  // Render notes
  const renderNotes = () => {
    const filteredNotes = getFilteredNotes();
    notesList.innerHTML = "";

    if (filteredNotes.length === 0) {
      const emptyMessage = currentFilter || currentCategory !== "all" 
        ? "Tidak ada catatan yang sesuai dengan filter."
        : "Belum ada catatan.";
      notesList.innerHTML = `<div class="empty-state"><h3>${emptyMessage}</h3></div>`;
    } else {
      filteredNotes.forEach((note, index) => {
        const originalIndex = notes.indexOf(note);
        const noteElement = document.createElement("div");
        noteElement.className = "note-item";
        
        const categoryBadge = note.category 
          ? `<span class="category-badge category-${note.category}">${note.category}</span>`
          : "";
        
        const priority = note.priority || "normal";
        const priorityClass = priority !== "normal" ? `priority-${priority}` : "";
        
        noteElement.innerHTML = `
          <div class="note-content ${priorityClass}">
            <div class="note-header">
              ${categoryBadge}
              ${priority === "high" ? '<span class="priority-indicator">🔴</span>' : ''}
              ${priority === "medium" ? '<span class="priority-indicator">🟡</span>' : ''}
            </div>
            <div class="note-text">${escapeHtml(note.text)}</div>
            <div class="note-date">📅 ${formatDate(note.date)}</div>
            <div class="note-actions">
              <button class="btn btn-small btn-edit" data-index="${originalIndex}">✏️ Edit</button>
              <button class="btn btn-small btn-duplicate" data-index="${originalIndex}">📋 Duplikat</button>
              <button class="btn btn-small btn-delete" data-index="${originalIndex}">🗑️ Hapus</button>
            </div>
          </div>
        `;
        notesList.appendChild(noteElement);
      });
    }

    updateStats();
  };

  // Update statistics
  const updateStats = () => {
    const totalNotes = notes.length;
    const totalChars = notes.reduce((sum, note) => sum + note.text.length, 0);
    const filteredCount = getFilteredNotes().length;
    
    const statsText = currentFilter || currentCategory !== "all"
      ? `📊 Menampilkan: ${filteredCount} dari ${totalNotes} catatan • ${totalChars} karakter`
      : `📊 Total: ${totalNotes} catatan • ${totalChars} karakter`;
    
    stats.textContent = statsText;
  };

  // Add or update note
  const addOrUpdateNote = () => {
    const text = noteInput.value.trim();
    if (!text) return;

    const category = categorySelect ? categorySelect.value : "other";
    const priority = document.getElementById("priority-select") ? 
      document.getElementById("priority-select").value : "normal";

    if (editingIndex !== null) {
      // Update existing note
      notes[editingIndex].text = text;
      notes[editingIndex].category = category;
      notes[editingIndex].priority = priority;
      notes[editingIndex].lastModified = new Date().toISOString();
      editingIndex = null;
      addBtn.textContent = "Tambah Catatan";
    } else {
      // Add new note
      const newNote = {
        text: text,
        date: new Date().toISOString(),
        category: category,
        priority: priority,
        id: Date.now().toString()
      };
      notes.unshift(newNote);
    }

    noteInput.value = "";
    if (categorySelect) categorySelect.value = "other";
    if (document.getElementById("priority-select")) {
      document.getElementById("priority-select").value = "normal";
    }
    
    saveNotes();
    renderNotes();
    noteInput.focus();
  };

  // Handle note actions
  const handleNoteAction = (event) => {
    const index = parseInt(event.target.dataset.index);
    
    if (event.target.classList.contains("btn-delete")) {
      if (confirm("Hapus catatan ini?")) {
        notes.splice(index, 1);
        saveNotes();
        renderNotes();
      }
    } else if (event.target.classList.contains("btn-edit")) {
      const note = notes[index];
      noteInput.value = note.text;
      if (categorySelect) categorySelect.value = note.category || "other";
      if (document.getElementById("priority-select")) {
        document.getElementById("priority-select").value = note.priority || "normal";
      }
      editingIndex = index;
      addBtn.textContent = "Update Catatan";
      noteInput.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (event.target.classList.contains("btn-duplicate")) {
      const note = notes[index];
      const duplicatedNote = {
        ...note,
        text: note.text + " (Salinan)",
        date: new Date().toISOString(),
        id: Date.now().toString()
      };
      notes.unshift(duplicatedNote);
      saveNotes();
      renderNotes();
    }
  };

  // Export notes
  const exportNotes = () => {
    if (notes.length === 0) {
      alert("Tidak ada catatan untuk diekspor.");
      return;
    }

    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.download = `notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import notes
  const importNotes = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedNotes = JSON.parse(e.target.result);
        if (Array.isArray(importedNotes)) {
          if (confirm(`Impor ${importedNotes.length} catatan? Ini akan ditambahkan ke catatan yang sudah ada.`)) {
            // Add imported notes to existing notes
            notes = [...importedNotes, ...notes];
            saveNotes();
            renderNotes();
          }
        } else {
          alert("File JSON tidak valid.");
        }
      } catch (error) {
        alert("Gagal membaca file: " + error.message);
      }
    };
    reader.readAsText(file);
    importInput.value = "";
  };

  // Clear all notes
  const clearAllNotes = () => {
    if (notes.length > 0 && confirm("HAPUS SEMUA CATATAN? Tindakan ini tidak dapat dibatalkan!")) {
      notes = [];
      editingIndex = null;
      addBtn.textContent = "Tambah Catatan";
      noteInput.value = "";
      saveNotes();
      renderNotes();
    }
  };

  // Search functionality
  const handleSearch = (event) => {
    currentFilter = event.target.value;
    renderNotes();
  };

  // Category filter
  const handleCategoryFilter = (event) => {
    currentCategory = event.target.value;
    renderNotes();
  };

  // Sort functionality
  const handleSort = (event) => {
    currentSort = event.target.value;
    renderNotes();
  };

  // Event listeners
  addBtn.addEventListener("click", addOrUpdateNote);
  noteInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      addOrUpdateNote();
    }
  });
  
  notesList.addEventListener("click", handleNoteAction);
  exportBtn.addEventListener("click", exportNotes);
  importInput.addEventListener("change", importNotes);
  clearAllBtn.addEventListener("click", clearAllNotes);
  
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }
  
  if (categorySelect) {
    categorySelect.addEventListener("change", handleCategoryFilter);
  }
  
  if (sortSelect) {
    sortSelect.addEventListener("change", handleSort);
  }

  // Initialize
  renderNotes();
});

