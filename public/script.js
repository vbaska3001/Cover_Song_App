let currentPair = null;
let currentUser = null;

const statusEl = document.getElementById('status-message');
const originalTitleEl = document.getElementById('original-title');
const candidateTitleEl = document.getElementById('candidate-title');
const originalEmbed = document.getElementById('original-embed');
const candidateEmbed = document.getElementById('candidate-embed');
const btnYes = document.getElementById('btn-yes');
const btnNo = document.getElementById('btn-no');

const loginModal = document.getElementById('login-modal');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');

loginBtn.addEventListener('click', async () => {
    const name = usernameInput.value;
    if (!name) return;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await response.json();
        currentUser = data.user;
        loginModal.style.display = 'none';
        loadPair();
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed");
    }
});

async function loadPair() {
    if (!currentUser) return;
    try {
        statusEl.textContent = "Loading next pair...";
        btnYes.disabled = true;
        btnNo.disabled = true;

        const response = await fetch(`/api/pair?user=${encodeURIComponent(currentUser)}`);
        const data = await response.json();

        if (data.message) {
            statusEl.textContent = data.message;
            originalEmbed.src = "";
            candidateEmbed.src = "";
            originalTitleEl.textContent = "";
            candidateTitleEl.textContent = "";
            return;
        }

        currentPair = data;

        originalTitleEl.textContent = data.original_title;
        candidateTitleEl.textContent = data.candidate.title;

        originalEmbed.src = `https://www.youtube.com/embed/${data.original_id}`;
        candidateEmbed.src = `https://www.youtube.com/embed/${data.candidate.id}`;

        statusEl.textContent = `Validating Pair: ${data.original_index} - ${data.candidate_index}`;
        btnYes.disabled = false;
        btnNo.disabled = false;

    } catch (error) {
        console.error("Error loading pair:", error);
        statusEl.textContent = "Error loading data.";
    }
}

async function sendVote(isCover) {
    if (!currentPair) return;

    try {
        statusEl.textContent = "Saving vote...";
        btnYes.disabled = true;
        btnNo.disabled = true;

        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user: currentUser,
                original_index: currentPair.original_index,
                candidate_index: currentPair.candidate_index,
                is_cover: isCover
            })
        });

        const result = await response.json();
        if (result.success) {
            loadPair();
        } else {
            alert("Failed to save vote.");
            btnYes.disabled = false;
            btnNo.disabled = false;
        }
    } catch (error) {
        console.error("Error sending vote:", error);
        alert("Error sending vote.");
        btnYes.disabled = false;
        btnNo.disabled = false;
    }
}

btnYes.addEventListener('click', () => sendVote(true));
btnNo.addEventListener('click', () => sendVote(false));

// Initial load handled by login
