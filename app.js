let currentPage = "dashboard";

const $ = id => document.getElementById(id);

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(date) {

    if (!date) {
        return "";
    }

    return new Date(date).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function toast(message) {

    const element = $("toast");

    element.textContent = message;
    element.classList.add("show");

    setTimeout(() => {
        element.classList.remove("show");
    }, 2500);
}

function showPage(page) {

    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    const target = $(page);

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });

    currentPage = page;

    const titles = {
        dashboard: ["Dashboard", "Pusat Personal Digital Twin"],
        identity: ["Identity", "Identitas digital Anda"],
        memory: ["Memory", "Memori jangka panjang"],
        knowledge: ["Knowledge", "Personal Knowledge Base"],
        activity: ["Activity", "Riwayat aktivitas"],
        decisions: ["Decision", "Decision Engine"],
        simulation: ["Simulation", "Simulation Engine"],
        relationships: ["Relationships", "Hubungan antar entitas"]
    };

    const info = titles[page];

    if (info) {
        $("pageTitle").textContent = info[0];
        $("pageSubtitle").textContent = info[1];
    }

    refreshPage(page);
}

async function refreshPage(page) {

    try {

        if (page === "dashboard") {
            await renderDashboard();
        }

        if (page === "identity") {
            await renderIdentity();
        }

        if (page === "memory") {
            await renderMemory();
        }

        if (page === "knowledge") {
            await renderKnowledge();
        }

        if (page === "activity") {
            await renderActivity();
        }

        if (page === "decisions") {
            await renderDecisions();
        }

        if (page === "relationships") {
            await renderRelationships();
        }

    } catch (error) {

        console.error(error);
        toast("Terjadi kesalahan saat memuat data.");
    }
}

async function renderDashboard() {

    const [
        memories,
        knowledge,
        activities,
        decisions,
        goals
    ] = await Promise.all([
        MemoryEngine.all(),
        KnowledgeEngine.all(),
        ActivityEngine.all(),
        dbGetAll("decisions"),
        GoalEngine.all()
    ]);

    $("statMemory").textContent = memories.length;
    $("statKnowledge").textContent = knowledge.length;
    $("statActivity").textContent = activities.length;
    $("statDecision").textContent = decisions.length;

    const identity = await Twin.getIdentity();

    $("heroName").textContent =
        identity.name ?
        `Digital Twin — ${identity.name}` :
        "Digital Twin Anda";

    $("twinSummary").textContent =
        await Twin.summary();

    renderGoals(goals);
}

function renderGoals(goals) {

    if (!goals.length) {

        $("goalList").innerHTML =
            `<div class="empty">Belum ada tujuan.</div>`;

        return;
    }

    $("goalList").innerHTML =
        goals.map(goal => `
            <div class="goal-item">

                <input
                    type="checkbox"
                    ${goal.completed ? "checked" : ""}
                    onchange="toggleGoal(${goal.id})"
                >

                <span style="${
                    goal.completed
                    ? "text-decoration:line-through;color:#9ca3af"
                    : ""
                }">
                    ${escapeHTML(goal.title)}
                </span>

                <button
                    class="delete-btn"
                    onclick="deleteGoal(${goal.id})"
                >
                    Hapus
                </button>

            </div>
        `).join("");
}

async function renderIdentity() {

    const identity = await Twin.getIdentity();

    $("identityName").value = identity.name || "";
    $("identityRole").value = identity.role || "";
    $("identitySkills").value = identity.skills || "";
    $("identityInterests").value = identity.interests || "";
    $("identityPreferences").value =
        identity.preferences || "";
    $("identityValues").value =
        identity.values || "";
}

async function renderMemory() {

    const query = $("memorySearch").value || "";

    const data =
        await MemoryEngine.search(query);

    const container = $("memoryList");

    if (!data.length) {

        container.innerHTML =
            `<div class="empty">Belum ada memory.</div>`;

        return;
    }

    container.innerHTML =
        data.map(item => `
            <div class="record">

                <div class="record-head">

                    <div>
                        <div class="record-title">
                            ${escapeHTML(item.type)}
                        </div>

                        <div class="record-meta">
                            ${formatDate(item.createdAt)}
                        </div>
                    </div>

                    <button
                        class="delete-btn"
                        onclick="deleteMemory(${item.id})"
                    >
                        Hapus
                    </button>

                </div>

                <div class="record-content">
                    ${escapeHTML(item.content)}
                </div>

            </div>
        `).join("");
}

async function renderKnowledge() {

    const query = $("knowledgeSearch").value || "";

    const data =
        await KnowledgeEngine.search(query);

    const container = $("knowledgeList");

    if (!data.length) {

        container.innerHTML =
            `<div class="empty">Belum ada knowledge.</div>`;

        return;
    }

    container.innerHTML =
        data.map(item => `
            <div class="record">

                <div class="record-head">

                    <div>
                        <div class="record-title">
                            ${escapeHTML(item.title)}
                        </div>

                        <div class="record-meta">
                            ${escapeHTML(item.category)}
                            · ${formatDate(item.createdAt)}
                        </div>
                    </div>

                    <button
                        class="delete-btn"
                        onclick="deleteKnowledge(${item.id})"
                    >
                        Hapus
                    </button>

                </div>

                <div class="record-content">
                    ${escapeHTML(item.content)}
                </div>

            </div>
        `).join("");
}

async function renderActivity() {

    const data = await ActivityEngine.all();

    const container = $("activityList");

    if (!data.length) {

        container.innerHTML =
            `<div class="empty">Belum ada aktivitas.</div>`;

        return;
    }

    container.innerHTML =
        data.map(item => `
            <div class="record">

                <div class="record-head">

                    <div>
                        <div class="record-title">
                            ${escapeHTML(item.title)}
                        </div>

                        <div class="record-meta">
                            ${escapeHTML(item.category)}
                            · ${formatDate(item.createdAt)}
                        </div>
                    </div>

                    <button
                        class="delete-btn"
                        onclick="deleteActivity(${item.id})"
                    >
                        Hapus
                    </button>

                </div>

                <div class="record-content">
                    ${escapeHTML(item.detail)}
                </div>

            </div>
        `).join("");
}

async function renderDecisions() {

    const data = await dbGetAll("decisions");

    const container = $("decisionList");

    if (!data.length) {

        container.innerHTML =
            `<div class="empty">Belum ada decision.</div>`;

        return;
    }

    container.innerHTML =
        data.map(item => `

            <div class="record">

                <div class="record-head">

                    <div class="record-title">
                        ${escapeHTML(item.question)}
                    </div>

                    <div class="record-meta">
                        ${formatDate(item.createdAt)}
                    </div>

                </div>

                <div class="record-content">

                    Memory terkait:
                    ${item.memories?.length || 0}

                    <br>

                    Knowledge terkait:
                    ${item.knowledge?.length || 0}

                    <br>

                    Tujuan terkait:
                    ${item.goals?.length || 0}

                </div>

            </div>

        `).join("");
}

async function renderRelationships() {

    const data =
        await RelationshipEngine.all();

    const container =
        $("relationshipList");

    if (!data.length) {

        container.innerHTML =
            `<div class="empty">Belum ada relationship.</div>`;

        return;
    }

    container.innerHTML =
        data.map(item => `

            <div class="record">

                <div class="record-head">

                    <div class="record-title">

                        ${escapeHTML(item.from)}
                        <span style="color:#6366f1">
                            → ${escapeHTML(item.relation)} →
                        </span>
                        ${escapeHTML(item.to)}

                    </div>

                    <button
                        class="delete-btn"
                        onclick="deleteRelationship(${item.id})"
                    >
                        Hapus
                    </button>

                </div>

                <div class="record-meta">
                    ${formatDate(item.createdAt)}
                </div>

            </div>

        `).join("");
}


/* NAVIGATION */

document.querySelectorAll(".nav-btn")
    .forEach(button => {

        button.addEventListener("click", () => {
            showPage(button.dataset.page);
        });

    });


/* IDENTITY */

$("identityForm").addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        try {

            await Twin.saveIdentity({

                name: $("identityName").value,
                role: $("identityRole").value,
                skills: $("identitySkills").value,
                interests: $("identityInterests").value,
                preferences:
                    $("identityPreferences").value,
                values:
                    $("identityValues").value

            });

            toast("Identity berhasil disimpan.");

            await renderDashboard();

        } catch (error) {

            console.error(error);
            toast(error.message);
        }
    }
);


/* MEMORY */

$("memoryForm").addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        try {

            await MemoryEngine.add(
                $("memoryContent").value,
                $("memoryType").value
            );

            $("memoryContent").value = "";

            toast("Memory berhasil disimpan.");

            await renderMemory();
            await renderDashboard();

        } catch (error) {

            toast(error.message);
        }
    }
);


$("memorySearch").addEventListener(
    "input",
    renderMemory
);


/* KNOWLEDGE */

$("knowledgeForm").addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        try {

            await KnowledgeEngine.add(
                $("knowledgeTitle").value,
                $("knowledgeContent").value,
                $("knowledgeCategory").value
            );

            $("knowledgeTitle").value = "";
            $("knowledgeContent").value = "";
            $("knowledgeCategory").value = "";

            toast("Knowledge berhasil disimpan.");

            await renderKnowledge();
            await renderDashboard();

        } catch (error) {

            toast(error.message);
        }
    }
);


$("knowledgeSearch").addEventListener(
    "input",
    renderKnowledge
);


/* ACTIVITY */

$("activityForm").addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        try {

            await ActivityEngine.add(
                $("activityTitle").value,
                $("activityDetail").value,
                $("activityCategory").value
            );

            $("activityTitle").value = "";
            $("activityDetail").value = "";
            $("activityCategory").value = "";

            toast("Aktivitas berhasil dicatat.");

            await renderActivity();
            await renderDashboard();

        } catch (error) {

            toast(error.message);
        }
    }
);


/* GOAL */

$("goalForm").addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        try {

            await GoalEngine.add(
                $("goalInput").value
            );

            $("goalInput").value = "";

            toast("Tujuan berhasil ditambahkan.");

            await renderDashboard();

        } catch (error) {

            toast(error.message);
        }
    }
);


async function toggleGoal(id) {

    await GoalEngine.toggle(id);

    toast("Status tujuan diperbarui.");

    await renderDashboard();
}


async function deleteGoal(id) {

    await GoalEngine.remove(id);

    toast("Tujuan dihapus.");

    await renderDashboard();
}


/* CHAT */

$("chatForm").addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const input = $("chatInput");
        const text = input.value.trim();

        if (!text) {
            return;
        }

        addChatMessage("user", text);

        input.value = "";

        const typing = addChatMessage(
            "twin",
            "Sedang menganalisis..."
        );

        try {

            const response =
                await Twin.respond(text);

            typing.querySelector("p").textContent =
                response;

            await renderDashboard();

        } catch (error) {

            console.error(error);

            typing.querySelector("p").textContent =
                "Terjadi kesalahan saat memproses permintaan.";
        }
    }
);


function addChatMessage(type, text) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        `message ${type}`;

    const title =
        type === "user"
        ? "Anda"
        : "Digital Twin";

    wrapper.innerHTML = `
        <strong>${title}</strong>
        <p>${escapeHTML(text)}</p>
    `;

    $("chatMessages").appendChild(wrapper);

    $("chatMessages").scrollTop =
        $("chatMessages").scrollHeight;

    return wrapper;
}


/* DECISION */

$("decisionForm").addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const question =
            $("decisionQuestion").value.trim();

        if (!question) {

            toast("Pertanyaan keputusan wajib diisi.");
            return;
        }

        try {

            const result =
                await Twin.analyzeDecision(question);

            renderDecisionResult(result);

            $("decisionQuestion").value = "";

            await renderDecisions();
            await renderDashboard();

            toast("Analisis selesai.");

        } catch (error) {

            console.error(error);
            toast("Analisis gagal.");
        }
    }
);


function renderDecisionResult(result) {

    const goals =
        result.goals.length
        ? result.goals
            .map(item => `• ${escapeHTML(item.title)}`)
            .join("<br>")
        : "Tidak ada tujuan yang secara langsung terhubung.";

    const memories =
        result.memories.length
        ? result.memories
            .map(item =>
                `• ${escapeHTML(item.content)}`
            )
            .join("<br>")
        : "Tidak ditemukan memory terkait.";

    const knowledge =
        result.knowledge.length
        ? result.knowledge
            .map(item =>
                `• ${escapeHTML(item.title)}`
            )
            .join("<br>")
        : "Tidak ditemukan knowledge terkait.";

    $("decisionResult").classList.remove("hidden");

    $("decisionResult").innerHTML = `

        <h4>Hasil Analisis</h4>

        <div class="analysis-section">
            <strong>Pertanyaan</strong>
            ${escapeHTML(result.question)}
        </div>

        <div class="analysis-section">
            <strong>Tujuan yang terkait</strong>
            ${goals}
        </div>

        <div class="analysis-section">
            <strong>Memory yang terkait</strong>
            ${memories}
        </div>

        <div class="analysis-section">
            <strong>Knowledge yang terkait</strong>
            ${knowledge}
        </div>

        <div class="analysis-section">
            <strong>Catatan</strong>
            Hasil ini merupakan analisis berdasarkan data
            yang tersimpan dalam Personal Digital Twin.
            Sistem tidak mengambil kesimpulan dari data
            yang tidak tersedia.
        </div>
    `;
}


/* SIMULATION */

$("simulationForm").addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const situation =
            $("simulationSituation").value.trim();

        const scenarioA =
            $("scenarioA").value.trim();

        const scenarioB =
            $("scenarioB").value.trim();

        if (!situation ||
            !scenarioA ||
            !scenarioB) {

            toast("Semua bagian simulation wajib diisi.");
            return;
        }

        try {

            const result =
                await Twin.simulate(
                    situation,
                    scenarioA,
                    scenarioB
                );

            renderSimulationResult(result);

            toast("Simulation selesai.");

        } catch (error) {

            console.error(error);
            toast("Simulation gagal.");
        }
    }
);


function renderSimulationResult(result) {

    const knowledge =
        result.relevantKnowledge.length
        ? result.relevantKnowledge
            .map(item =>
                `• ${escapeHTML(item.title)}`
            )
            .join("<br>")
        : "Tidak ditemukan knowledge terkait.";

    const memory =
        result.relevantMemory.length
        ? result.relevantMemory
            .map(item =>
                `• ${escapeHTML(item.content)}`
            )
            .join("<br>")
        : "Tidak ditemukan memory terkait.";

    $("simulationResult").classList.remove("hidden");

    $("simulationResult").innerHTML = `

        <h4>Hasil Simulation</h4>

        <div class="analysis-section">
            <strong>Situasi</strong>
            ${escapeHTML(result.situation)}
        </div>

        <div class="analysis-section">
            <strong>Skenario A</strong>
            ${escapeHTML(result.scenarioA)}
        </div>

        <div class="analysis-section">
            <strong>Skenario B</strong>
            ${escapeHTML(result.scenarioB)}
        </div>

        <div class="analysis-section">
            <strong>Knowledge yang berkaitan</strong>
            ${knowledge}
        </div>

        <div class="analysis-section">
            <strong>Memory yang berkaitan</strong>
            ${memory}
        </div>

        <div class="analysis-section">
            <strong>Status</strong>
            Kedua skenario telah diproses berdasarkan
            konteks yang tersedia dalam Digital Twin.
            Sistem tidak mengklaim memprediksi masa depan.
        </div>
    `;
}


/* RELATIONSHIP */

$("relationshipForm").addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        try {

            await RelationshipEngine.add(
                $("relationFrom").value,
                $("relationType").value,
                $("relationTo").value
            );

            $("relationFrom").value = "";
            $("relationType").value = "";
            $("relationTo").value = "";

            toast("Relationship berhasil disimpan.");

            await renderRelationships();
            await renderDashboard();

        } catch (error) {

            toast(error.message);
        }
    }
);


/* DELETE */

async function deleteMemory(id) {

    await MemoryEngine.remove(id);

    toast("Memory dihapus.");

    await renderMemory();
    await renderDashboard();
}


async function deleteKnowledge(id) {

    await KnowledgeEngine.remove(id);

    toast("Knowledge dihapus.");

    await renderKnowledge();
    await renderDashboard();
}


async function deleteActivity(id) {

    await ActivityEngine.remove(id);

    toast("Aktivitas dihapus.");

    await renderActivity();
    await renderDashboard();
}


async function deleteRelationship(id) {

    await RelationshipEngine.remove(id);

    toast("Relationship dihapus.");

    await renderRelationships();
    await renderDashboard();
}


/* START APPLICATION */

async function startApplication() {

    try {

        await dbInit();

        await renderDashboard();

    } catch (error) {

        console.error(error);

        document.body.innerHTML = `
            <div style="
                padding:40px;
                font-family:Arial;
                color:#991b1b;
            ">
                <h2>Personal Digital Twin gagal dimulai.</h2>
                <p>
                    Browser tidak dapat membuka penyimpanan
                    IndexedDB untuk aplikasi ini.
                </p>
            </div>
        `;
    }
}

startApplication();