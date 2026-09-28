const MemoryEngine = {
  
  async add(content, type = "note") {
    
    if (!content || !content.trim()) {
      throw new Error("Memory tidak boleh kosong.");
    }
    
    return await dbAdd("memory", {
      content: content.trim(),
      type: type,
      source: "user"
    });
  },
  
  async all() {
    return await dbGetAll("memory");
  },
  
  async search(query) {
    
    const all = await this.all();
    
    if (!query || !query.trim()) {
      return all;
    }
    
    const q = query.toLowerCase();
    
    return all.filter(item => {
      return (
        String(item.content || "").toLowerCase().includes(q) ||
        String(item.type || "").toLowerCase().includes(q)
      );
    });
  },
  
  async remove(id) {
    return await dbDelete("memory", id);
  },
  
  async rememberFromConversation(text) {
    
    const lower = text.toLowerCase();
    
    const triggers = [
      "ingat bahwa",
      "ingat kalau",
      "saya suka",
      "saya tidak suka",
      "saya ingin",
      "tujuan saya",
      "saya sedang",
      "saya punya"
    ];
    
    const found = triggers.some(trigger =>
      lower.includes(trigger)
    );
    
    if (!found) {
      return null;
    }
    
    return await this.add(
      text.trim(),
      "conversation"
    );
  }
};


const KnowledgeEngine = {
  
  async add(title, content, category) {
    
    if (!title.trim()) {
      throw new Error("Judul knowledge wajib diisi.");
    }
    
    if (!content.trim()) {
      throw new Error("Isi knowledge wajib diisi.");
    }
    
    return await dbAdd("knowledge", {
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || "Umum"
    });
  },
  
  async all() {
    return await dbGetAll("knowledge");
  },
  
  async search(query) {
    
    const all = await this.all();
    
    if (!query || !query.trim()) {
      return all;
    }
    
    const q = query.toLowerCase();
    
    return all.filter(item =>
      String(item.title || "").toLowerCase().includes(q) ||
      String(item.content || "").toLowerCase().includes(q) ||
      String(item.category || "").toLowerCase().includes(q)
    );
  },
  
  async remove(id) {
    return await dbDelete("knowledge", id);
  }
};


const ActivityEngine = {
  
  async add(title, detail, category) {
    
    if (!title.trim()) {
      throw new Error("Aktivitas wajib diisi.");
    }
    
    return await dbAdd("activity", {
      title: title.trim(),
      detail: detail.trim(),
      category: category.trim() || "Umum"
    });
  },
  
  async all() {
    return await dbGetAll("activity");
  },
  
  async remove(id) {
    return await dbDelete("activity", id);
  }
};


const GoalEngine = {
  
  async add(title) {
    
    if (!title.trim()) {
      throw new Error("Tujuan tidak boleh kosong.");
    }
    
    return await dbAdd("goals", {
      title: title.trim(),
      completed: false
    });
  },
  
  async all() {
    return await dbGetAll("goals");
  },
  
  async toggle(id) {
    
    const item = await dbGet("goals", id);
    
    if (!item) {
      return;
    }
    
    item.completed = !item.completed;
    
    return await dbPut("goals", item);
  },
  
  async remove(id) {
    return await dbDelete("goals", id);
  }
};


const RelationshipEngine = {
  
  async add(from, relation, to) {
    
    if (!from.trim() ||
      !relation.trim() ||
      !to.trim()) {
      
      throw new Error("Semua bagian relationship wajib diisi.");
    }
    
    return await dbAdd("relationships", {
      from: from.trim(),
      relation: relation.trim(),
      to: to.trim()
    });
  },
  
  async all() {
    return await dbGetAll("relationships");
  },
  
  async remove(id) {
    return await dbDelete("relationships", id);
  }
};