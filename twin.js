const Twin = {

    async getIdentity() {

        const all = await dbGetAll("identity");

        return all.length ? all[0] : {
            name: "",
            role: "",
            skills: "",
            interests: "",
            preferences: "",
            values: ""
        };
    },

    async saveIdentity(data) {

        const current = await this.getIdentity();

        const record = {
            ...current,
            ...data
        };

        if (current.id) {
            return await dbPut("identity", record);
        }

        return await dbAdd("identity", record);
    },

    async getContext() {

        const [
            identity,
            memories,
            knowledge,
            activities,
            goals,
            relationships
        ] = await Promise.all([
            this.getIdentity(),
            MemoryEngine.all(),
            KnowledgeEngine.all(),
            ActivityEngine.all(),
            GoalEngine.all(),
            RelationshipEngine.all()
        ]);

        return {
            identity,
            memories,
            knowledge,
            activities,
            goals,
            relationships
        };
    },

    async summary() {

        const context = await this.getContext();

        const name =
            context.identity.name ||
            "Pengguna";

        const role =
            context.identity.role ||
            "belum ditentukan";

        const activeGoals =
            context.goals.filter(goal => !goal.completed);

        const skills =
            context.identity.skills || "belum ada data";

        const interests =
            context.identity.interests || "belum ada data";

        return `
Digital Twin untuk ${name}.

Peran: ${role}.

Keahlian: ${skills}.

Minat: ${interests}.

Twin memiliki ${context.memories.length} memory,
${context.knowledge.length} knowledge,
${context.activities.length} aktivitas,
${context.relationships.length} relationship,
dan ${activeGoals.length} tujuan aktif.
        `.trim();
    },

    async respond(input) {

        const text = input.trim();

        if (!text) {
            return "Silakan masukkan sesuatu.";
        }

        const context = await this.getContext();

        await ActivityEngine.add(
            "Interaksi dengan Digital Twin",
            text,
            "conversation"
        );

        await MemoryEngine.rememberFromConversation(text);

        const lower = text.toLowerCase();

        if (
            lower.includes("siapa saya") ||
            lower.includes("tentang saya")
        ) {

            return this.buildIdentityResponse(context);
        }

        if (
            lower.includes("tujuan saya") ||
            lower.includes("goal saya")
        ) {

            return this.buildGoalResponse(context);
        }

        if (
            lower.includes("apa yang kamu ingat") ||
            lower.includes("apa yang anda ingat") ||
            lower.includes("ingatanku")
        ) {

            return this.buildMemoryResponse(context);
        }

        if (
            lower.includes("pengetahuan saya") ||
            lower.includes("knowledge saya")
        ) {

            return this.buildKnowledgeResponse(context);
        }

        if (
            lower.includes("aktivitas saya") ||
            lower.includes("kegiatan saya")
        ) {

            return this.buildActivityResponse(context);
        }

        if (
            lower.includes("ringkasan") ||
            lower.includes("summary")
        ) {

            return this.summary();
        }

        if (
            lower.includes("analisis") ||
            lower.includes("menurutmu")
        ) {

            return this.reason(text, context);
        }

        return this.generalResponse(text, context);
    },

    buildIdentityResponse(context) {

        const i = context.identity;

        return `
Identitas yang tersimpan:

Nama: ${i.name || "Belum diisi"}
Peran: ${i.role || "Belum diisi"}
Keahlian: ${i.skills || "Belum diisi"}
Minat: ${i.interests || "Belum diisi"}
Preferensi: ${i.preferences || "Belum diisi"}
Nilai/Prinsip: ${i.values || "Belum diisi"}
        `.trim();
    },

    buildGoalResponse(context) {

        if (!context.goals.length) {
            return "Belum ada tujuan yang tersimpan.";
        }

        const active =
            context.goals.filter(goal => !goal.completed);

        if (!active.length) {
            return "Semua tujuan yang tersimpan sudah ditandai selesai.";
        }

        return "Tujuan aktif:\n\n" +
            active
                .map((goal, index) =>
                    `${index + 1}. ${goal.title}`
                )
                .join("\n");
    },

    buildMemoryResponse(context) {

        if (!context.memories.length) {
            return "Belum ada memory yang tersimpan.";
        }

        return "Memory yang tersimpan:\n\n" +
            context.memories
                .slice(0, 10)
                .map((memory, index) =>
                    `${index + 1}. ${memory.content}`
                )
                .join("\n");
    },

    buildKnowledgeResponse(context) {

        if (!context.knowledge.length) {
            return "Belum ada knowledge yang tersimpan.";
        }

        return "Knowledge yang tersedia:\n\n" +
            context.knowledge
                .slice(0, 10)
                .map((item, index) =>
                    `${index + 1}. ${item.title} — ${item.category}`
                )
                .join("\n");
    },

    buildActivityResponse(context) {

        if (!context.activities.length) {
            return "Belum ada aktivitas yang tersimpan.";
        }

        return "Aktivitas terbaru:\n\n" +
            context.activities
                .slice(0, 10)
                .map((item, index) =>
                    `${index + 1}. ${item.title}`
                )
                .join("\n");
    },

    async reason(question, context) {

        const words = question
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3);

        const relatedMemory =
            context.memories.filter(item =>
                words.some(word =>
                    String(item.content)
                        .toLowerCase()
                        .includes(word)
                )
            ).slice(0, 5);

        const relatedKnowledge =
            context.knowledge.filter(item =>
                words.some(word =>
                    (
                        String(item.title) +
                        " " +
                        String(item.content)
                    )
                    .toLowerCase()
                    .includes(word)
                )
            ).slice(0, 5);

        let result =
            "Saya menganalisis pertanyaan berdasarkan data Twin yang tersedia.";

        if (relatedMemory.length) {

            result +=
                "\n\nMemory yang berkaitan:\n" +
                relatedMemory
                    .map(item => "• " + item.content)
                    .join("\n");
        }

        if (relatedKnowledge.length) {

            result +=
                "\n\nKnowledge yang berkaitan:\n" +
                relatedKnowledge
                    .map(item =>
                        "• " + item.title +
                        ": " + item.content
                    )
                    .join("\n");
        }

        if (!relatedMemory.length &&
            !relatedKnowledge.length) {

            result +=
                "\n\nBelum ditemukan data pribadi yang secara langsung berkaitan dengan pertanyaan tersebut.";
        }

        return result;
    },

    generalResponse(text, context) {

        const activeGoals =
            context.goals.filter(goal => !goal.completed);

        return `
Saya menerima: "${text}"

Sebagai Digital Twin, saya dapat menggunakan identitas,
memory, knowledge, aktivitas, tujuan dan relationship
yang tersimpan di sistem ini.

Saat ini terdapat:
• ${context.memories.length} memory
• ${context.knowledge.length} knowledge
• ${context.activities.length} aktivitas
• ${activeGoals.length} tujuan aktif

Anda dapat meminta saya melihat identitas, memory,
knowledge, aktivitas, tujuan, atau membuat analisis
berdasarkan data yang tersedia.
        `.trim();
    },

    async analyzeDecision(question) {

        const context = await this.getContext();

        const text = question.toLowerCase();

        const goals = context.goals
            .filter(goal => !goal.completed);

        const memories = context.memories;

        const knowledge = context.knowledge;

        const matchedGoals = goals.filter(goal =>
            text.includes(
                String(goal.title)
                    .toLowerCase()
                    .split(/\s+/)[0]
            )
        );

        const relevantMemory = memories.filter(item =>
            text.split(/\s+/).some(word =>
                word.length > 4 &&
                String(item.content)
                    .toLowerCase()
                    .includes(word)
            )
        ).slice(0, 5);

        const relevantKnowledge = knowledge.filter(item =>
            text.split(/\s+/).some(word =>
                word.length > 4 &&
                (
                    String(item.title) +
                    " " +
                    String(item.content)
                )
                .toLowerCase()
                .includes(word)
            )
        ).slice(0, 5);

        const decision = {
            question,
            goals: matchedGoals,
            memories: relevantMemory,
            knowledge: relevantKnowledge,
            createdAt: new Date().toISOString()
        };

        await dbAdd("decisions", decision);

        return decision;
    },

    async simulate(situation, scenarioA, scenarioB) {

        const context = await this.getContext();

        const keywords = situation
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 4);

        const relevantKnowledge =
            context.knowledge.filter(item =>
                keywords.some(word =>
                    (
                        item.title +
                        " " +
                        item.content
                    )
                    .toLowerCase()
                    .includes(word)
                )
            );

        const relevantMemory =
            context.memories.filter(item =>
                keywords.some(word =>
                    String(item.content)
                        .toLowerCase()
                        .includes(word)
                )
            );

        const result = {
            situation,
            scenarioA,
            scenarioB,
            relevantKnowledge,
            relevantMemory,
            createdAt: new Date().toISOString()
        };

        return result;
    }
};