
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, onAuthStateChanged, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, setDoc, onSnapshot, collection, query, where, getDocs, runTransaction, getDoc, writeBatch, orderBy, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";

        const firebaseConfig = {
          apiKey: "AIzaSyCM-WlWhbhI3mxWXm9uXMQBa8mfFWoIoTA",
          authDomain: "rgb-guess-v2.firebaseapp.com",
          projectId: "rgb-guess-v2",
          storageBucket: "rgb-guess-v2.firebasestorage.app",
          messagingSenderId: "708736577431",
          appId: "1:708736577431:web:678622192b3ebb0d7b1ed2",
          measurementId: "G-3SW56Q6VSR"
        };

        const appId = "rgb-guess-game-master";
        const ROOM_CODE_LENGTH = 6;
        if (sessionStorage.getItem("rgbIsHost") === null) {
            sessionStorage.setItem("rgbIsHost", "false");
        }
        let gameId = null;
        let isHost = false;
        let sessionInitialized = false;

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        getAnalytics(app);

        const GUESS_TIME_LIMIT_MS = 30000;

        const targetColorBox = document.getElementById("target-color-box");
        const targetColorWrapper = document.getElementById("target-color-wrapper");
        const roomCodeWrapper = document.getElementById("room-code-wrapper");
        const redSlider = document.getElementById("red-slider");
        const greenSlider = document.getElementById("green-slider");
        const blueSlider = document.getElementById("blue-slider");
        const redValue = document.getElementById("red-value");
        const greenValue = document.getElementById("green-value");
        const blueValue = document.getElementById("blue-value");
        const submitGuessBtn = document.getElementById("submit-guess-btn");
        const startNewRoundBtn = document.getElementById("start-new-round-btn");
        const feedbackMessage = document.getElementById("feedback-message");
        const correctAnswer = document.getElementById("correct-answer");
        const userIdDisplay = document.getElementById("user-id-display");
        const roleDisplay = document.getElementById("role-display");
        const roundNumberDisplay = document.getElementById("round-number");
        const resultsRoundNumberDisplay = document.getElementById("results-round-number");
        const guessesTableBody = document.getElementById("guesses-table-body");
        const winnerAnnouncement = document.getElementById("winner-announcement");
        const guessControls = document.getElementById("guess-controls");
        const playerActionBtns = document.getElementById("player-action-btns");
        const roundOverlay = document.getElementById("round-overlay");
        const histogramContainer = document.getElementById("histogram-container");
        const roundSummaryColors = document.getElementById("round-summary-colors");
        const overlayNextRoundBtn = document.getElementById("overlay-next-round-btn");
        const overlayWaitingMsg = document.getElementById("overlay-waiting-msg");
        const hostPanel = document.getElementById("host-panel");
        const playerPanel = document.getElementById("player-panel");
        const playerInfoWrapper = document.getElementById("player-info-wrapper");
        const entryScreen = document.getElementById("entry-screen");
        const gameScreen = document.getElementById("game-screen");
        const hostStartBtn = document.getElementById("host-start-btn");
        const joinGameBtn = document.getElementById("join-game-btn");
        const joinCodeInput = document.getElementById("join-code-input");
        const entryError = document.getElementById("entry-error");
        const roomCodeDisplay = document.getElementById("room-code-display");
        const playerRoomCodeDisplay = document.getElementById("player-room-code");
        const showWinnerBtn = document.getElementById("show-winner-btn");
        const waitingRoomDemo = document.getElementById("waiting-room-demo");
        const demoRedSlider = document.getElementById("demo-red-slider");
        const demoGreenSlider = document.getElementById("demo-green-slider");
        const demoBlueSlider = document.getElementById("demo-blue-slider");
        const demoPreview = document.getElementById("demo-preview");
        const demoPreviewLabel = document.getElementById("demo-preview-label");
        const practiceBoard = document.getElementById("player-practice-board");
        const practiceRedSlider = document.getElementById("practice-red-slider");
        const practiceGreenSlider = document.getElementById("practice-green-slider");
        const practiceBlueSlider = document.getElementById("practice-blue-slider");
        const practicePreview = document.getElementById("practice-preview");
        const practicePreviewLabel = document.getElementById("practice-preview-label");
        const hostScoreboardList = document.getElementById("host-scoreboard-list");
        const hostRoundNumberDisplay = document.getElementById("host-round-number");
        const roundCountInput = document.getElementById("round-count");
        const roundConfig = document.getElementById("round-config");
        const roundCountError = document.getElementById("round-count-error");
        const confirmRoundCountBtn = document.getElementById("confirm-round-count-btn");
        const roundTotalDisplay = document.getElementById("round-total");

        const nicknameModal = document.getElementById("nickname-modal");
        const nicknameInput = document.getElementById("nickname-input");
        const saveNicknameBtn = document.getElementById("save-nickname-btn");
        const cancelNicknameBtn = document.getElementById("cancel-nickname-btn");
        const changeNicknameBtn = document.getElementById("change-nickname-btn");
        const nicknameError = document.getElementById("nickname-error");

        const playersCollectionRef = collection(db, "artifacts", appId, "public", "data", "rgb_players");
        const guessesCollectionRef = collection(db, "artifacts", appId, "public", "data", "rgb_guesses");
        const roundHistoryCollectionRef = collection(db, "artifacts", appId, "public", "data", "rgb_round_history");
        let gameDocRef = null;

        let userId = null;
        let isAdmin = false;
        let playerNickname = null;
        let allPlayersData = {};
        let targetColor = { r: 0, g: 0, b: 0 };
        let currentRound = 0;
        let hasGuessed = false;
        let roundStatus = "WAITING";
        let gameStatus = "WAITING";
        let guessEndTime = 0;
        let timerInterval = null;
        let isFinalizingRound = false;
        let playerDocExists = false;
        let lastHistogramRound = null;
        let roundLimit = Infinity;
        let summaryHasNextRound = false;
        let pendingGuessSaveTimeout = null;
        let currentRoundSubmissions = new Set();
        let musicEnabled = true;
        let sfxEnabled = true;
        let currentMusic = null;
        let warningBellPlayed = false;
        const waitingMusic = new Audio("music/Waiting Room Jumps.mp3"); waitingMusic.loop = true; waitingMusic.volume = 0.3;
        const gameMusic = new Audio("music/Quiz Time Thrills.mp3"); gameMusic.loop = true; gameMusic.volume = 0.3;
        const winnerMusic = new Audio("music/Victory Royale.mp3"); winnerMusic.loop = true; winnerMusic.volume = 0.35;

        // Lightweight SFX placeholders. If you add short SFX files to `music/`,
        // update these to point to the real files. Leaving as `null` is safe
        // because `playSfx` already ignores falsy values.
        const submitSfx = null;
        const warningBellSfx = null;
        const winnerSfx = winnerMusic;

        function showEntryError(message) {
            if (!entryError) return;
            entryError.textContent = message;
            entryError.classList.remove("hidden");
        }

        function hideEntryError() {
            entryError?.classList.add("hidden");
        }

        function getRandomColorValue() {
            return Math.floor(Math.random() * 256);
        }

        function calculateScore(rTarget, gTarget, bTarget, rGuess, gGuess, bGuess) {
            const diffR = Math.abs(rTarget - rGuess);
            const diffG = Math.abs(gTarget - gGuess);
            const diffB = Math.abs(bTarget - bGuess);
            const totalDiff = diffR + diffG + diffB;
            const maxDiff = 255 * 3;
            const score = Math.max(0, Math.round(100 * (1 - totalDiff / maxDiff)));
            return score;
        }

        function openNicknameModal(prefill = "") {
            nicknameInput.value = prefill;
            nicknameError.classList.add("hidden");
            nicknameModal.classList.remove("hidden");
            nicknameInput.focus();
        }

        async function claimUniqueRoomCode() {
            let attempts = 0;
            while (attempts < 10) {
                const candidate = generateRoomCode();
                const candidateRef = doc(db, "artifacts", appId, "public", "data", "rgb_game_state", candidate);
                const snapshot = await getDoc(candidateRef);
                if (!snapshot.exists()) {
                    setActiveGameCode(candidate);
                    return candidate;
                }
                attempts += 1;
            }
            throw new Error("Unable to allocate a room code. Please try again.");
        }

        function stopAllMusic() {
            // pause and rewind all known music tracks and clear currentMusic reference
            [waitingMusic, gameMusic, winnerMusic].forEach((audio) => {
                try {
                    audio.pause();
                    audio.currentTime = 0;
                } catch (e) {
                    // ignore
                }
            });
            currentMusic = null;
        }

        async function playMusic(track) {
            // Play a music track for all clients (if music enabled). Ensure only one track is audible at once.
            if (!musicEnabled || !track) return;
            try {
                // if another track is playing, stop and reset it
                if (currentMusic && currentMusic !== track) {
                    try { currentMusic.pause(); currentMusic.currentTime = 0; } catch (e) {}
                }
                // if this track is already playing, do nothing
                if (currentMusic === track && !track.paused) return;
                await track.play();
                currentMusic = track;
            } catch (e) {
                // play may be blocked by browser autoplay policies; ignore silently
                currentMusic = track;
            }
        }

        function playWaitingMusic() {
            playMusic(waitingMusic);
        }

        function playGameMusic() {
            playMusic(gameMusic);
        }

        function playWinnerMusic() {
            playMusic(winnerMusic);
        }

        function playSfx(audio) {
            // Allow SFX for everyone (no host-only guard). Clone node so multiple sfx can overlap.
            if (!sfxEnabled || !audio) return;
            try {
                const instance = audio.cloneNode(true);
                instance.volume = audio.volume;
                instance.play().catch(() => {});
            } catch (e) {
                // ignore
            }
        }

        function startTimer() {
            stopTimer();
            timerInterval = setInterval(async () => {
                const timeLeft = guessEndTime - Date.now();
                const secondsLeft = Math.max(0, Math.ceil(timeLeft / 1000));
                // Warn all players when time is almost up (remove host-only gating)
                if (!warningBellPlayed && secondsLeft <= 10 && secondsLeft > 0) {
                    playSfx(warningBellSfx);
                    warningBellPlayed = true;
                }
                if (secondsLeft <= 0) {
                    stopTimer();
                    if (isAdmin) {
                        feedbackMessage.textContent = "Time is up! Finalizing results...";
                        await finalizeRound();
                    } else {
                        feedbackMessage.textContent = "Time is up! Waiting for the host to reveal results.";
                        if (!hasGuessed && roundStatus === "GUESSING") {
                            submitGuess(true).catch((error) => console.error("Auto-submit failed:", error));
                        }
                    }
                } else {
                    feedbackMessage.textContent = `Hurry! ${secondsLeft} seconds left to submit your guess.`;
                    feedbackMessage.className = `h-16 text-center text-xl font-medium flex items-center justify-center p-2 rounded-lg text-white ${secondsLeft <= 10 ? "bg-red-800/50" : "bg-teal-600/50"}`;
                }
            }, 1000);
        }

        function updateUIForRoleAndStatus() {
            roleDisplay.textContent = isAdmin ? "Host" : "Player";
            userIdDisplay.textContent = playerNickname || (userId ? `${userId.slice(0, 8)}...` : "Loading...");

            const isGuessingActive = roundStatus === "GUESSING" && !hasGuessed && guessEndTime > Date.now();
            const allowGuessing = isGuessingActive && !isAdmin;
            redSlider.disabled = !allowGuessing;
            greenSlider.disabled = !allowGuessing;
            blueSlider.disabled = !allowGuessing;
            submitGuessBtn.disabled = !allowGuessing;
            playerActionBtns.classList.toggle("hidden", isAdmin);

            if (isGuessingActive && !isAdmin) {
                submitGuessBtn.textContent = "Submit guess";
            } else if (roundStatus === "GUESSING" && hasGuessed) {
                submitGuessBtn.textContent = "Guess submitted (waiting...)";
            } else if (isAdmin) {
                submitGuessBtn.textContent = "Hosts do not submit guesses";
            } else {
                submitGuessBtn.textContent = "Guesses are locked right now";
            }

            const isPreGame = roundStatus === "WAITING" && currentRound === 0;
            targetColorWrapper?.classList.toggle("hidden", isPreGame);
            roomCodeWrapper?.classList.toggle("hidden", !isPreGame);
            if (playerRoomCodeDisplay) {
                playerRoomCodeDisplay.classList.toggle("hidden", !isPreGame);
            }

            if (isAdmin) {
                guessControls.classList.remove("hidden");
                startNewRoundBtn.classList.toggle("hidden", isPreGame);
                waitingRoomDemo?.classList.toggle("hidden", !isPreGame);

                if (!isPreGame) {
                    if (roundStatus === "GUESSING") {
                        startNewRoundBtn.textContent = "Waiting for submissions...";
                        startNewRoundBtn.disabled = true;
                        startNewRoundBtn.classList.add("opacity-60");
                    } else if (roundStatus === "SCORED") {
                        startNewRoundBtn.textContent = currentRound >= roundLimit ? "Game complete" : "Start next round";
                        startNewRoundBtn.disabled = currentRound >= roundLimit;
                        startNewRoundBtn.classList.remove("opacity-60");
                    } else {
                        startNewRoundBtn.textContent = "Start first round";
                        startNewRoundBtn.disabled = false;
                        startNewRoundBtn.classList.remove("opacity-60");
                    }
                }
            } else {
                guessControls.classList.remove("hidden");
                startNewRoundBtn.classList.add("hidden");
                waitingRoomDemo?.classList.add("hidden");
            }
            if (!isAdmin) {
                guessControls.classList.toggle("hidden", isPreGame);
                playerActionBtns.classList.toggle("hidden", isPreGame);
                practiceBoard?.classList.toggle("hidden", !isPreGame);
            } else {
                practiceBoard?.classList.add("hidden");
            }

            hostPanel.classList.toggle("hidden", !isAdmin);
            playerPanel.classList.toggle("hidden", isAdmin);
            playerInfoWrapper.classList.toggle("hidden", isAdmin);
            if (showWinnerBtn) {
                const canShowWinner = isAdmin && gameStatus === "AWAITING_WINNER";
                showWinnerBtn.classList.toggle("hidden", !canShowWinner);
                showWinnerBtn.disabled = !canShowWinner;
            }
        }

        function showHistogram(results) {
            lastHistogramRound = currentRound;
            const hasMoreRounds = Number.isFinite(roundLimit) ? currentRound < roundLimit : true;
            summaryHasNextRound = hasMoreRounds;
            if (isAdmin) {
                overlayNextRoundBtn.textContent = "Close summary";
                overlayNextRoundBtn.classList.remove("hidden");
                overlayWaitingMsg.textContent = hasMoreRounds
                    ? "Use the host panel to start the next round when you're ready."
                    : "This was the final round. When you close this summary the winner screen will appear.";
                overlayWaitingMsg.classList.remove("hidden");
            } else {
                overlayNextRoundBtn.classList.add("hidden");
                overlayWaitingMsg.textContent = hasMoreRounds
                    ? "Waiting for host to start next round..."
                    : "Game complete. Waiting for host to reveal the winner.";
                overlayWaitingMsg.classList.remove("hidden");
            }

            if (!results || results.length === 0) {
                histogramContainer.innerHTML = `<p class="text-gray-300 text-sm w-full text-center">No scores available for this round.</p>`;
                roundSummaryColors.innerHTML = `
                    <div class="text-center text-xs text-gray-400">No guesses have been recorded yet.</div>
                `;
            } else {
                const maxScore = Math.max(...results.map((r) => r.score ?? 0), 1);
                const barWidth = Math.max(48, Math.floor(300 / Math.max(results.length, 1)));
                const columnHeight = 200;
                const histogramData = results.slice(0, 8);
                histogramContainer.innerHTML = histogramData
                    .map((result) => {
                        const score = result.score ?? 0;
                        const nickname = result.nickname ?? (result.userId ? `${result.userId.slice(0, 8)}...` : "Player");
                        const barHeight = Math.max(12, Math.round((score / maxScore) * columnHeight));
                        const barColor = `rgb(${result.r}, ${result.g}, ${result.b})`;
                        return `
                            <div class="flex flex-col items-center justify-end" style="width:${barWidth}px">
                                <div class="flex items-end justify-center w-full" style="height:${columnHeight}px">
                                    <div class="w-8 rounded-t-md shadow-lg border border-gray-300/40" style="height:${barHeight}px; background:${barColor};"></div>
                                </div>
                                <div class="mt-2 text-xs text-gray-200 leading-tight text-center overflow-hidden text-ellipsis whitespace-nowrap w-full">${nickname}</div>
                                <div class="text-[10px] text-gray-400 leading-tight text-center whitespace-nowrap">RGB(${result.r}, ${result.g}, ${result.b})</div>
                                <div class="text-xs font-semibold text-teal-300">${score}</div>
                            </div>
                        `;
                    })
                    .join("");

                const leaderboardEntries = Object.values(allPlayersData)
                    .filter((player) => player && !player.isHost)
                    .map((player) => ({
                        nickname: player.nickname ?? (player.userId ? `${player.userId.slice(0, 8)}...` : "Player"),
                        totalScore: Number(player.totalScore ?? 0)
                    }))
                    .sort((a, b) => b.totalScore - a.totalScore);

                const leaderboardHtml = leaderboardEntries.length
                    ? leaderboardEntries.slice(0, 8)
                          .map((entry, index) => `
                            <div class="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-700 bg-gray-900/60 text-sm text-gray-200">
                                <span>#${index + 1} ${entry.nickname}</span>
                                <span class="font-semibold text-cyan-300">${entry.totalScore}</span>
                            </div>
                        `)
                          .join("")
                    : `<div class="text-sm text-gray-400 text-center">No leaderboard data yet.</div>`;

                roundSummaryColors.innerHTML = `
                    <div class="space-y-5">
                        <div class="flex items-center justify-between rounded-xl border border-gray-600 bg-gray-900/60 px-4 py-3">
                            <div>
                                <p class="text-xs uppercase tracking-widest text-gray-400">Target</p>
                                <p class="text-sm text-gray-200 font-semibold">RGB(${targetColor.r}, ${targetColor.g}, ${targetColor.b})</p>
                            </div>
                            <div class="w-16 h-8 rounded border border-gray-500" style="background-color: rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b});"></div>
                        </div>

                        <div>
                            <h5 class="text-sm font-semibold text-gray-200 mb-2">Total leaderboard</h5>
                            <div class="space-y-2 max-h-48 overflow-y-auto">
                                ${leaderboardHtml}
                            </div>
                        </div>
                    </div>
                `;
            }

            summaryHasNextRound = hasMoreRounds;
            if (isAdmin) {
                overlayNextRoundBtn.textContent = hasMoreRounds ? "Start next round" : "Close summary";
                overlayNextRoundBtn.classList.remove("hidden");
                overlayWaitingMsg.classList.add("hidden");
            } else {
                overlayNextRoundBtn.classList.add("hidden");
                overlayWaitingMsg.textContent = hasMoreRounds ? "Waiting for host to start next round..." : "Game complete. Waiting for host.";
                overlayWaitingMsg.classList.remove("hidden");
            }

            roundOverlay.classList.remove("hidden");
            roundOverlay.classList.add("flex");
        }

        async function submitGuess(isAuto = false) {
            if (!userId) {
                feedbackMessage.textContent = "Please wait until you are signed in.";
                return;
            }
            if (isAdmin) {
                feedbackMessage.textContent = "Hosts do not submit guesses.";
                return;
            }
            if (roundStatus !== "GUESSING" || hasGuessed || guessEndTime <= Date.now()) {
                feedbackMessage.textContent = "Guesses are closed for this round.";
                return;
            }

            const guess = {
                userId,
                r: parseInt(redSlider.value, 10),
                g: parseInt(greenSlider.value, 10),
                b: parseInt(blueSlider.value, 10),
                round: currentRound,
                gameId,
                timestamp: Date.now()
            };

            try {
                await setDoc(doc(guessesCollectionRef, `${gameId}-${userId}-${currentRound}`), guess);
                await setDoc(doc(playersCollectionRef, `${gameId}-${userId}`), {
                    pendingGuessR: guess.r,
                    pendingGuessG: guess.g,
                    pendingGuessB: guess.b,
                    lastGuessR: guess.r,
                    lastGuessG: guess.g,
                    lastGuessB: guess.b,
                    timestamp: Date.now()
                }, { merge: true });
                hasGuessed = true;
                if (!isAuto) {
                    feedbackMessage.textContent = "Your guess was submitted!";
                    playSfx(submitSfx);
                }
            } finally {
                updateUIForRoleAndStatus();
            }
        }

        async function checkAndSetNickname() {
            const playerDocRef = doc(playersCollectionRef, `${gameId}-${userId}`);
            try {
                const snapshot = await getDoc(playerDocRef);
                if (snapshot.exists()) {
                    playerDocExists = true;
                    const data = snapshot.data();
                    if (isHost && !data.isHost) {
                        await setDoc(playerDocRef, { isHost: true }, { merge: true });
                        data.isHost = true;
                    }
                    playerNickname = data.nickname;
                    userIdDisplay.textContent = playerNickname;
                    nicknameInput.value = playerNickname ?? "";
                    changeNicknameBtn.classList.toggle("hidden", isHost);
                    nicknameModal.classList.add("hidden");
                } else {
                    playerDocExists = false;
                    if (isHost) {
                        const hostName = "Host";
                        await setDoc(playerDocRef, {
                            nickname: hostName,
                            userId,
                            gameId,
                            totalScore: 0,
                            lastScore: 0,
                             pendingGuessR: 128,
                             pendingGuessG: 128,
                             pendingGuessB: 128,
                             lastGuessR: 128,
                             lastGuessG: 128,
                             lastGuessB: 128,
                            timestamp: Date.now(),
                            isHost: true
                        });
                        playerNickname = hostName;
                        userIdDisplay.textContent = playerNickname;
                        nicknameModal.classList.add("hidden");
                    } else {
                        changeNicknameBtn.classList.add("hidden");
                        openNicknameModal();
                    }
                }
            } catch (error) {
                console.error("Error checking nickname:", error);
            }
        }

        async function saveNickname() {
            const nickname = nicknameInput.value.trim();
            if (nickname.length < 2 || nickname.length > 15) {
                nicknameError.classList.remove("hidden");
                return;
            }
            nicknameError.classList.add("hidden");
            saveNicknameBtn.disabled = true;

            try {
                const dataToSet = {
                    nickname,
                    userId,
                    gameId,
                    timestamp: Date.now()
                };
                if (!playerDocExists) {
                    dataToSet.totalScore = 0;
                    dataToSet.lastScore = 0;
                    dataToSet.pendingGuessR = 128;
                    dataToSet.pendingGuessG = 128;
                    dataToSet.pendingGuessB = 128;
                    dataToSet.lastGuessR = 128;
                    dataToSet.lastGuessG = 128;
                    dataToSet.lastGuessB = 128;
                }
                await setDoc(doc(playersCollectionRef, `${gameId}-${userId}`), dataToSet, { merge: true });
                playerDocExists = true;
                playerNickname = nickname;
                userIdDisplay.textContent = playerNickname;
                changeNicknameBtn.classList.remove("hidden");
                nicknameModal.classList.add("hidden");
            } catch (error) {
                console.error("Error saving nickname:", error);
                nicknameError.textContent = "Unable to save nickname. Try again.";
                nicknameError.classList.remove("hidden");
            } finally {
                saveNicknameBtn.disabled = false;
            }
        }

        function listenToPlayers() {
            if (!gameId) return;
            const playersQuery = query(playersCollectionRef, where("gameId", "==", gameId));
            onSnapshot(playersQuery, (snapshot) => {
                const data = {};
                snapshot.forEach((docSnap) => {
                    const player = docSnap.data();
                    if (!player.userId) {
                        player.userId = player.userId ?? docSnap.id.replace(`${gameId}-`, "");
                    }
                    data[player.userId] = player;
                });
                allPlayersData = data;
                renderScoreboard();
                updateUIForRoleAndStatus();
                checkForAutoFinalize();
            });
        }

        function listenToGuesses() {
            if (!gameId) return;
            const guessesQuery = query(guessesCollectionRef, where("gameId", "==", gameId));
            onSnapshot(guessesQuery, (snapshot) => {
                let myGuessFound = false;
                const submissions = new Set();
                snapshot.forEach((docSnap) => {
                    const guess = docSnap.data();
                    if (guess.round === currentRound) {
                        submissions.add(guess.userId);
                        if (guess.userId === userId) {
                            myGuessFound = true;
                        }
                    }
                });
                currentRoundSubmissions = submissions;
                hasGuessed = myGuessFound;
                updateUIForRoleAndStatus();
                checkForAutoFinalize();
            });
        }

        function listenToGameState() {
            if (!gameDocRef) return;
            onSnapshot(gameDocRef, (docSnap) => {
                if (!docSnap.exists()) {
                    if (isHost) {
                        ensureGameStateDocument();
                    } else {
                        feedbackMessage.textContent = "Waiting for the host to create the game...";
                    }
                    return;
                }

                const data = docSnap.data();
                isAdmin = userId === data.adminId;
                targetColor = data.targetColor;
                const incomingRound = data.round ?? 0;
                if (incomingRound !== currentRound) {
                    currentRound = incomingRound;
                    currentRoundSubmissions = new Set();
                    hasGuessed = false;
                    warningBellPlayed = false;
                } else {
                    currentRound = incomingRound;
                }
                roundStatus = data.roundStatus;
                gameStatus = data.gameStatus ?? "WAITING";

                // Play winner music for all clients if awaiting final winner
                if (gameStatus === "AWAITING_WINNER") {
                    playWinnerMusic();
                }

                guessEndTime = data.guessEndTime ?? 0;
                if (data.gameStatus === "SHOW_WINNER") {
                    if (isHost || isAdmin) {
                        stopAllMusic();
                    }
                    window.location.href = `/winner.html?game=${encodeURIComponent(gameId)}`;
                    return;
                }
                if (typeof data.roundLimit === "number" && data.roundLimit > 0) {
                    roundLimit = data.roundLimit;
                }
                roundTotalDisplay.textContent = Number.isFinite(roundLimit) ? roundLimit : "âˆž";

                targetColorBox.style.backgroundColor = `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`;
                roundNumberDisplay.textContent = currentRound;
                const displayedResultsRound = roundStatus === "GUESSING" ? Math.max(currentRound - 1, 0) : currentRound;
                resultsRoundNumberDisplay.textContent = displayedResultsRound;
                hostRoundNumberDisplay.textContent = Math.max(currentRound, 1);
                correctAnswer.textContent = `Correct color: RGB(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`;

                if (roundStatus === "GUESSING") {
                    correctAnswer.classList.add("hidden");
                    winnerAnnouncement.classList.add("hidden");
                    roundOverlay.classList.add("hidden");
                    roundOverlay.classList.remove("flex");
                    if (isAdmin) {
                        feedbackMessage.textContent = "Round in progress. End the round whenever you're ready.";
                        feedbackMessage.className = "h-16 text-center text-xl font-medium flex items-center justify-center p-2 rounded-lg text-white bg-cyan-700/60";
                        // removed playWaitingMusic() here to avoid overlapping with gameplay music
                    } else {
                        feedbackMessage.textContent = "Adjust the sliders and submit your guess!";
                        feedbackMessage.className = "h-16 text-center text-xl font-medium flex items-center justify-center p-2 rounded-lg text-white bg-teal-600/50";
                    }
                    startTimer();
                    // play gameplay music for everyone
                    playGameMusic();
                } else if (roundStatus === "SCORED") {
                    stopTimer();
                    feedbackMessage.textContent = "Round finished! Scores have been calculated.";
                    feedbackMessage.className = "h-16 text-center text-xl font-medium flex items-center justify-center p-2 rounded-lg text-white bg-yellow-600";
                    correctAnswer.classList.remove("hidden");
                    // switch to waiting/summary music
                    stopAllMusic();
                    playWaitingMusic();

                    if (Array.isArray(data.lastRoundResults) && data.round !== lastHistogramRound) {
                        showHistogram(data.lastRoundResults);
                    }
                } else {
                    // WAITING / pre-game state â€” make sure waiting music is playing for everyone
                    stopTimer();
                    correctAnswer.classList.add("hidden");
                    winnerAnnouncement.classList.add("hidden");
                    if (isAdmin) {
                        if (!Number.isFinite(roundLimit)) {
                            feedbackMessage.textContent = "Set the number of rounds to begin.";
                            roundConfig.classList.remove("hidden");
                            startNewRoundBtn.disabled = true;
                        } else {
                            roundConfig.classList.add("hidden");
                            feedbackMessage.textContent = currentRound >= roundLimit ? "Game complete." : "Click \"Start first round\" when you are ready.";
                            startNewRoundBtn.disabled = currentRound >= roundLimit;
                        }
                        feedbackMessage.className = "h-16 text-center text-xl font-medium flex items-center justify-center p-2 rounded-lg text-white bg-cyan-700/60";
                    } else {
                        roundConfig.classList.add("hidden");
                        feedbackMessage.textContent = "Waiting for the host to start the round.";
                        feedbackMessage.className = "h-16 text-center text-xl font-medium flex items-center justify-center p-2 rounded-lg text-white bg-gray-700/50";
                    }
                    // ensure waiting music plays in this state
                    playWaitingMusic();
                }

                hasGuessed = false;
                updateUIForRoleAndStatus();
            }, (error) => {
                console.error("Error listening to game state:", error);
                feedbackMessage.textContent = "Connection problem. Please refresh.";
            });
        }

        async function finalizeRound() {
            if (!isAdmin || roundStatus !== "GUESSING" || isFinalizingRound) return;
            isFinalizingRound = true;
            try {
                const guessesSnapshot = await getDocs(query(guessesCollectionRef, where("gameId", "==", gameId), where("round", "==", currentRound)));
                const results = [];
                const roundDeadline = guessEndTime || Date.now();
                const computeBonus = (timestamp) => {
                    const msRemaining = Math.max(0, roundDeadline - timestamp);
                    return Math.min(10, Math.floor(msRemaining / 3000));
                };
                const batch = writeBatch(db);
                guessesSnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    const score = calculateScore(targetColor.r, targetColor.g, targetColor.b, data.r, data.g, data.b);
                    const guessTimestamp = data.timestamp ?? Date.now();
                    const bonus = computeBonus(guessTimestamp);
                    const totalScoreForRound = score + bonus;
                    results.push({
                        userId: data.userId,
                        nickname: allPlayersData[data.userId]?.nickname ?? `${data.userId.slice(0, 8)}...`,
                        score,
                        bonus,
                        totalScore: totalScoreForRound,
                        r: data.r,
                        g: data.g,
                        b: data.b,
                        timestamp: guessTimestamp
                    });
                    batch.update(docSnap.ref, { score });
                });

                const participantIds = new Set(results.map((r) => r.userId));
                Object.values(allPlayersData).forEach((player) => {
                    if (!player || !player.userId || player.isHost || participantIds.has(player.userId)) return;
                    const fallback = {
                        r: Number.isFinite(player.pendingGuessR) ? Number(player.pendingGuessR) : Number.isFinite(player.lastGuessR) ? Number(player.lastGuessR) : 128,
                        g: Number.isFinite(player.pendingGuessG) ? Number(player.pendingGuessG) : Number.isFinite(player.lastGuessG) ? Number(player.lastGuessG) : 128,
                        b: Number.isFinite(player.pendingGuessB) ? Number(player.pendingGuessB) : Number.isFinite(player.lastGuessB) ? Number(player.lastGuessB) : 128
                    };
                    const autoTimestamp = Date.now();
                    const score = calculateScore(targetColor.r, targetColor.g, targetColor.b, fallback.r, fallback.g, fallback.b);
                    const bonus = 0;
                    const totalScoreForRound = score + bonus;
                    const autoPayload = {
                        userId: player.userId,
                        gameId,
                        round: currentRound,
                        r: fallback.r,
                        g: fallback.g,
                        b: fallback.b,
                        timestamp: autoTimestamp,
                        autoFilled: true,
                        score,
                        bonus
                    };
                    batch.set(doc(guessesCollectionRef, `${gameId}-${player.userId}-${currentRound}`), autoPayload, { merge: true });
                    results.push({
                        userId: player.userId,
                        nickname: player.nickname ?? (player.userId ? `${player.userId.slice(0, 8)}...` : "Player"),
                        score,
                        bonus,
                        totalScore: totalScoreForRound,
                        r: fallback.r,
                        g: fallback.g,
                        b: fallback.b,
                        timestamp: autoTimestamp,
                        autoFilled: true
                    });
                    participantIds.add(player.userId);
                });

                results.forEach((result) => {
                    const playerNicknameFromMemory = allPlayersData[result.userId]?.nickname;
                    batch.set(doc(playersCollectionRef, `${gameId}-${result.userId}`), {
                        userId: result.userId,
                        gameId,
                        nickname: playerNicknameFromMemory ?? result.nickname ?? (result.userId ? `${result.userId.slice(0, 8)}...` : "Player"),
                        totalScore: increment(result.totalScore),
                        lastScore: result.totalScore,
                        lastGuessR: result.r,
                        lastGuessG: result.g,
                        lastGuessB: result.b,
                        timestamp: Date.now()
                    }, { merge: true });
                });

                if (results.length === 0) {
                    await setDoc(gameDocRef, { roundStatus: "SCORED", guessEndTime: Date.now(), timestamp: Date.now(), lastRoundResults: [] }, { merge: true });
                    winnerAnnouncement.textContent = "No guesses were submitted this round.";
                    winnerAnnouncement.dataset.mode = "round";
                    winnerAnnouncement.classList.remove("hidden");
                    showHistogram([]);
                    isFinalizingRound = false;
                    return;
                }

                results.sort((a, b) => b.totalScore - a.totalScore || a.timestamp - b.timestamp);
                const winner = results[0];
                const historyDocRef = doc(roundHistoryCollectionRef, `${gameId}-${currentRound}`);
                batch.set(historyDocRef, {
                    gameId,
                    round: currentRound,
                    winner,
                    topResults: results.slice(0, 10),
                    timestamp: Date.now()
                });

                const projectedTotals = {};
                Object.values(allPlayersData).forEach((player) => {
                    if (!player || player.isHost) return;
                    projectedTotals[player.userId] = {
                        userId: player.userId,
                        nickname: player.nickname ?? (player.userId ? `${player.userId.slice(0, 8)}...` : "Player"),
                        totalScore: Number(player.totalScore ?? 0)
                    };
                });
                results.forEach((r) => {
                    if (!projectedTotals[r.userId]) {
                        projectedTotals[r.userId] = {
                            userId: r.userId,
                            nickname: r.nickname ?? (r.userId ? `${r.userId.slice(0, 8)}...` : "Player"),
                            totalScore: 0
                        };
                    }
                    projectedTotals[r.userId].totalScore = Number(projectedTotals[r.userId].totalScore ?? 0) + Number(r.totalScore ?? r.score ?? 0);
                });
                const finalStandings = Object.values(projectedTotals).sort((a, b) => b.totalScore - a.totalScore);
                const topThree = finalStandings.slice(0, 3);

                const gameUpdate = {
                    roundStatus: "SCORED",
                    guessEndTime: Date.now(),
                    timestamp: Date.now(),
                    lastRoundResults: results
                };
                if (Number.isFinite(roundLimit)) {
                    gameUpdate.roundsRemaining = Math.max(0, roundLimit - currentRound);
                    gameUpdate.roundLimit = roundLimit;
                    if (gameUpdate.roundsRemaining <= 0) {
                        gameUpdate.finalStandings = finalStandings;
                        gameUpdate.gameStatus = "AWAITING_WINNER";
                    } else {
                        gameUpdate.gameStatus = "RUNNING";
                    }
                } else {
                    gameUpdate.gameStatus = "RUNNING";
                }
                batch.set(gameDocRef, gameUpdate, { merge: true });
                await batch.commit();
                await pruneRoundHistory();

                winnerAnnouncement.textContent = `Round ${currentRound} winner: ${winner.nickname} with ${winner.totalScore} pts (bonus +${winner.bonus ?? 0}).`;
                winnerAnnouncement.dataset.mode = "round";
                winnerAnnouncement.classList.remove("hidden");
                showHistogram(results);
                playSfx(winnerSfx);
                if (Number.isFinite(roundLimit) && roundLimit - currentRound <= 0) {
                    roundOverlay.classList.add("hidden");
                    roundOverlay.classList.remove("flex");
                    await setDoc(gameDocRef, { gameStatus: "SHOW_WINNER" }, { merge: true });
                    playWinnerMusic();
                    window.location.href = `/winner.html?game=${encodeURIComponent(gameId)}`;
                    return;
                }
            } catch (error) {
                console.error("Error finalizing round:", error);
                feedbackMessage.textContent = `Error finalizing round: ${error.message}`;
            } finally {
                isFinalizingRound = false;
            }
        }

        async function pruneRoundHistory() {
            try {
                const historySnapshot = await getDocs(query(roundHistoryCollectionRef, where("gameId", "==", gameId), orderBy("round", "desc")));
                let index = 0;
                const batch = writeBatch(db);
                historySnapshot.forEach((docSnap) => {
                    index += 1;
                    if (index > 10) {
                        batch.delete(docSnap.ref);
                    }
                });
                if (index > 10) {
                    await batch.commit();
                }
            } catch (error) {
                console.error("Error pruning round history:", error);
            }
        }

        async function startNextRound() {
            if (!Number.isFinite(roundLimit)) {
                feedbackMessage.textContent = "Set the number of rounds before starting.";
                return;
            }
            try {
                await runTransaction(db, async (transaction) => {
                    const snapshot = await transaction.get(gameDocRef);
                    if (!snapshot.exists()) {
                        throw new Error("Game state does not exist yet.");
                    }
                    const data = snapshot.data();
                    const nextRound = (data.round ?? 0) + 1;
                    const newTarget = { r: getRandomColorValue(), g: getRandomColorValue(), b: getRandomColorValue() };
                    const newGuessEndTime = Date.now() + GUESS_TIME_LIMIT_MS;
                    const gameUpdate = {
                        adminId: userId,
                        targetColor: newTarget,
                        round: nextRound,
                        roundStatus: "GUESSING",
                        guessEndTime: newGuessEndTime,
                        timestamp: Date.now(),
                        lastRoundResults: [],
                        finalStandings: [],
                        gameStatus: "RUNNING"
                    };
                    if (Number.isFinite(roundLimit)) {
                        gameUpdate.roundLimit = roundLimit;
                        gameUpdate.roundsRemaining = Math.max(0, roundLimit - nextRound);
                    }
                    transaction.set(gameDocRef, gameUpdate);
                });
                hasGuessed = false;
                winnerAnnouncement.classList.add("hidden");
                roundOverlay.classList.add("hidden");
                roundOverlay.classList.remove("flex");
            } catch (error) {
                console.error("Error starting next round:", error);
                feedbackMessage.textContent = `Error starting round: ${error.message}`;
                throw error;
            }
        }

        setPersistence(auth, browserSessionPersistence)
            .then(() => {
                onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        userId = user.uid;
                        hideEntryError();
                    } else {
                        await signInAnonymously(auth);
                    }
                });
            })
            .catch((error) => {
                console.error("Error setting persistence or signing in:", error);
                feedbackMessage.textContent = `Authentication error: ${error.message}`;
            });

        hostStartBtn?.addEventListener("click", startHostFlow);
        joinGameBtn?.addEventListener("click", startJoinFlow);
        joinCodeInput?.addEventListener("keyup", (event) => {
            if (event.key === "Enter") {
                startJoinFlow();
            }
        });
        redSlider.addEventListener("input", updateCurrentColor);
        greenSlider.addEventListener("input", updateCurrentColor);
        blueSlider.addEventListener("input", updateCurrentColor);
        demoRedSlider?.addEventListener("input", updateDemoPreview);
        demoGreenSlider?.addEventListener("input", updateDemoPreview);
        demoBlueSlider?.addEventListener("input", updateDemoPreview);
        updateDemoPreview();
        practiceRedSlider?.addEventListener("input", updatePracticePreview);
        practiceGreenSlider?.addEventListener("input", updatePracticePreview);
        practiceBlueSlider?.addEventListener("input", updatePracticePreview);
        updatePracticePreview();
        submitGuessBtn.addEventListener("click", () => submitGuess(false));
        startNewRoundBtn.addEventListener("click", async () => {
            startNewRoundBtn.disabled = true;
            if (!isAdmin) {
                feedbackMessage.textContent = "Only the host can control rounds.";
                startNewRoundBtn.disabled = false;
                return;
            }
            if (roundStatus === "GUESSING") {
                await finalizeRound();
            } else {
                await startNextRound();
            }
            startNewRoundBtn.disabled = false;
        });
        overlayNextRoundBtn.addEventListener("click", async () => {
            if (!isAdmin) return;
            overlayNextRoundBtn.disabled = true;
            try {
                roundOverlay.classList.add("hidden");
                roundOverlay.classList.remove("flex");
                if (summaryHasNextRound) {
                    await startNextRound();
                    playGameMusic();
                } else {
                    await setDoc(gameDocRef, { gameStatus: "SHOW_WINNER" }, { merge: true });
                    playWinnerMusic();
                    window.location.href = `/winner.html?game=${encodeURIComponent(gameId)}`;
                }
            } finally {
                overlayNextRoundBtn.disabled = false;
            }
        });

        showWinnerBtn?.addEventListener("click", async () => {
            if (!isAdmin) return;
            showWinnerBtn.disabled = true;
            try {
                await setDoc(gameDocRef, { gameStatus: "SHOW_WINNER" }, { merge: true });
                roundOverlay.classList.add("hidden");
                roundOverlay.classList.remove("flex");
                playWinnerMusic();
            } finally {
                showWinnerBtn.disabled = false;
            }
        });

        saveNicknameBtn.addEventListener("click", saveNickname);
        cancelNicknameBtn.addEventListener("click", () => {
            nicknameModal.classList.add("hidden");
            nicknameError.classList.add("hidden");
            nicknameInput.value = playerNickname || "";
        });
        changeNicknameBtn.addEventListener("click", () => openNicknameModal(playerNickname || ""));

        confirmRoundCountBtn.addEventListener("click", async () => {
            const desiredRounds = parseInt(roundCountInput.value, 10);
            if (Number.isNaN(desiredRounds) || desiredRounds < 1 || desiredRounds > 99) {
                roundCountError.classList.remove("hidden");
                return;
            }
            roundCountError.classList.add("hidden");
            const previousLimit = roundLimit;
            roundLimit = desiredRounds;
            roundTotalDisplay.textContent = roundLimit;
            feedbackMessage.textContent = "Starting the game...";
            confirmRoundCountBtn.disabled = true;
            let startError = null;
            try {
                await startNextRound();
                roundConfig.classList.add("hidden");
                waitingRoomDemo?.classList.add("hidden");
                feedbackMessage.textContent = "Round in progress. End the round whenever you're ready.";
            } catch (error) {
                startError = error;
                roundLimit = previousLimit;
                roundTotalDisplay.textContent = Number.isFinite(previousLimit) ? previousLimit : "âˆž";
                roundConfig.classList.remove("hidden");
                waitingRoomDemo?.classList.remove("hidden");
            } finally {
                confirmRoundCountBtn.disabled = false;
                if (startError) {
                    const message = startError?.message ? `Could not start: ${startError.message}` : "Could not start. Please try again.";
                    feedbackMessage.textContent = message;
                }
            }
        });

        // TEMP: set deploy-check timestamp so deployments are visibly different
        (function showDeployTimestamp() {
            try {
                const el = document.getElementById('deploy-ts');
                if (!el) return;
                // Use build-time stamp fallback to runtime timestamp so the badge always changes on deploy.
                // You can replace this with a compiled-in build variable in CI to be even more explicit.
                const ts = new Date().toLocaleString();
                el.textContent = ts;
            } catch (e) {
                // ignore
            }
        })();

        renderScoreboard();
        updateCurrentColor();

    
