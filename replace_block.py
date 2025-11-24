from pathlib import Path
path = Path('index.html')
text = path.read_text()
start_token = '    <div class= w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 mt-10>'
end_token = '        <div id=round-overlay'
start = text.find(start_token)
end = text.find(end_token)
if start == -1 or end == -1:
    raise SystemExit('markers not found')
new_block = '''    <div class=w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 mt-10>
        <h1 class=text-3xl font-bold text-center text-white mb-4>Guess the RGB</h1>
        <p class=text-xs text-center text-gray-400 mb-4>Round <span id=round-number>1</span> of <span id=round-total>--</span></p>
        <div id=player-info-wrapper class=space-y-1 mb-4>
            <p class=text-xs text-center text-gray-500 mb-0>
                Player: <span id=user-id-display class=font-mono text-cyan-400>Loading...</span>
                (<span id=role-display class=font-bold text-yellow-400>Player</span>)
                <button id=change-nickname-btn class=text-xs text-cyan-400 hover:text-cyan-300 underline align-middle hidden>Change nickname</button>
            </p>
        </div>

        <div class=mb-6>
            <h2 class=text-lg font-medium text-gray-300 mb-2 text-center>Target color (shared)</h2>
            <div id=target-color-box class=w-full h-32 md:h-40 rounded-lg border-4 border-gray-700 color-box></div>
        </div>

        <div id=host-panel class=hidden mb-6>
            <div class=bg-gradient-to-br from-gray-900/60 via-gray-900/80 to-gray-800/80 border border-cyan-500 rounded-2xl p-6 space-y-6 shadow-[0_0_30px_rgba 14 165 233 0.35 ] >
                <div class= flex flex-col gap-4 md:flex-row md:items-end md:justify-between>
                    <div class=space-y-1>
                        <p class=text-xs uppercase tracking-widest text-cyan-300>Host view</p>
                        <p class=text-3xl font-bold text-white>Round <span id=host-round-number>1</span></p>
                        <p class=text-xs text-gray-400>Only the shared target is visible to players.</p>
                    </div>
                    <button id=start-new-round-btn class=w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 rounded-lg text-lg transition-colors shadow-lg>
                        Start next round
                    </button>
                </div>

                <div id=host-scoreboard class=bg-gray-900/70 border border-gray-700 rounded-2xl p-4 space-y-3>
                    <div class=flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider>
                        <span>Player</span>
                        <span>Total</span>
                    </div>
                    <ul id=host-scoreboard-list class=space-y-2 max-h-52 overflow-y-auto pr-1 text-sm text-gray-300>
                        <li class=text-center text-gray-500>Waiting for players...</li>
                    </ul>
                </div>

                <div id=round-config class=space-y-3>
                    <label for=round-count class=block text-sm font-medium text-gray-300>Rounds to play</label>
                    <input id=round-count type=number min=1 max=99 value=5 class=w-full bg-gray-900 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 />
                    <button id=confirm-round-count-btn class=w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-md transition-colors>Confirm rounds</button>
                    <p id=round-count-error class=text-red-400 text-xs mt-2 hidden>Please enter a number between 1 and 99.</p>
                </div>
            </div>
        </div>

        <div id=feedback-message class=h-16 text-center text-xl font-medium text-gray-200 flex items-center justify-center p-2 rounded-lg bg-gray-700/50 mb-6>
            Waiting for the host to start the game...
        </div>

        <div id=player-panel>
            <div id=player-share-section class=text-xs text-center text-cyan-300 mb-6 space-y-1>
                <p>Share this room (copy & paste):</p>
                <input id=share-link type=text readonly class=w-full text-center bg-gray-900 text-cyan-200 border border-cyan-600 rounded-md px-2 py-1 font-mono text-[11px] select-all value=Generating link... />
            </div>

            <h2 class=text-xl font-semibold text-white mt-8 mb-4 border-b border-gray-700 pb-2>My guess</h2>

            <div id=guess-controls class=space-y-5 mb-6>
                <div>
                    <div class=flex justify-between items-center mb-1>
                        <label for=red-slider class=text-lg font-medium text-red-400>Red (R)</label>
                        <span id=red-value class=text-lg font-semibold text-white bg-red-600 px-3 py-1 rounded-md>128</span>
                    </div>
                    <input type=range id=red-slider min=0 max=255 value=128 class=slider disabled />
                </div>
                <div>
                    <div class=flex justify-between items-center mb-1>
                        <label for=green-slider class=text-lg font-medium text-green-400>Green (G)</label>
                        <span id=green-value class=text-lg font-semibold text-white bg-green-600 px-3 py-1 rounded-md>128</span>
                    </div>
                    <input type=range id=green-slider min=0 max=255 value=128 class=slider disabled />
                </div>
                <div>
                    <div class=flex justify-between items-center mb-1>
                        <label for=blue-slider class=text-lg font-medium text-blue-400>Blue (B)</label>
                        <span id=blue-value class=text-lg font-semibold text-white bg-blue-600 px-3 py-1 rounded-md>128</span>
                    </div>
                    <input type=range id=blue-slider min=0 max=255 value=128 class=slider disabled />
                </div>
            </div>

            <div id=player-action-btns class=space-y-4 mb-6>
                <button id=submit-guess-btn class=w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-colors duration-200 shadow-lg disabled:bg-cyan-800 disabled:opacity-50>
                    Submit guess
                </button>
            </div>

            <h2 class=text-xl font-semibold text-white mt-8 mb-4 border-b border-gray-700 pb-2>Scoreboard <span id=results-round-number>1</span></h2>
            <div id=guesses-table-container class=overflow-x-auto bg-gray-700 rounded-lg p-3>
                <table class=min-w-full divide-y divide-gray-600>
                    <thead>
                        <tr>
                            <th class=px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider>Player</th>
                            <th class=px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider>Total score</th>
                        </tr>
                    </thead>
                    <tbody id=guesses-table-body class=divide-y divide-gray-700>
                        <tr class=text-center>
                            <td colspan=2 class=py-4 text-gray-400>Scores will appear here once the first round is complete.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div id=correct-answer class=text-center text-md text-gray-400 mt-3 hidden></div>
            <div id=winner-announcement class=text-center text-lg font-semibold text-cyan-300 mt-4 hidden></div>
        </div>
    </div>
'''
text = text[:start] + new_block + text[end:]
path.write_text(text)
