# Firestore security rules

This project stores every game document inside the `artifacts/{appId}/public/data/*` subtree. The new `firestore.rules` file keeps the data readable for everyone in a room while restricting writes to authenticated users.

## Collections and permissions

| Collection | Path example | Who can read | Who can write |
| --- | --- | --- | --- |
| Game state | artifacts/rgb-guess-game-master/public/data/rgb_game_state/{gameId} | Anyone | Only the host (adminId recorded in the document) |
| Players | artifacts/rgb-guess-game-master/public/data/rgb_players/{gameId}-{userId} | Anyone | Player can update their own record; host can update any player |
| Guesses | artifacts/rgb-guess-game-master/public/data/rgb_guesses/{gameId}-{userId}-{round} | Anyone | Player can create/update their guess until the host scores it; host can write any guess |
| Round history | artifacts/rgb-guess-game-master/public/data/rgb_round_history/{gameId}-{round} | Anyone | Host only |

Key rule helpers:

- `isGameAdmin(appId, gameId)` checks whether the authenticated user matches the `adminId` in the game-state doc.
- `preserved("field")` ensures players cannot change identity fields such as `userId` or `gameId` on their own documents.
- `targetGameId()` exposes the `gameId` for whichever document is being touched, even if the request omits it (e.g., a merge update).

## Deploying the rules

1. Authenticate with Firebase CLI (once per machine):
   ```bash
   firebase login
   ```
2. Select the project you deploy to (`rgb-guess-v2` in production):
   ```bash
   firebase use rgb-guess-v2
   ```
3. Deploy only the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

The root `firebase.json` already points to `firestore.rules`, so future `firebase deploy` commands will pick up changes automatically.

## Verifying after deploy

1. Reload the game in two tabs (host + player) with DevTools open.
2. Start a room, submit a round, and watch for Firestore permission errors. None should appear if the rules were published.
3. If you need to tweak permissions (for example, to allow spectators), update `firestore.rules`, commit, and redeploy.
