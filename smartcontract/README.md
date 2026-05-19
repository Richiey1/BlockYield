# BlockBet — Stacks Mainnet Smart Contract

Clarity smart contract implementation for **BlockBet** — a real-time, on-chain behavioral prediction game anchored directly to Bitcoin via the Stacks L2 blockchain.

---

## 🟩 Live Deployed Mainnet Contract

The BlockBet smart contract is fully deployed on the **Stacks Mainnet**:
*   **Contract Principal**: `SP258BY8D71JCTV73A4V3ADPHCVWSBEM6G4FETPYF.blockbet`
*   **Explorer Link**: [View on Hiro Stacks Explorer](https://explorer.hiro.so/txid/SP258BY8D71JCTV73A4V3ADPHCVWSBEM6G4FETPYF.blockbet?chain=mainnet) 🔍

---

## 📊 Core Architecture & Features

The contract governs prediction rounds, STX pooled stakes, on-chain payouts, and dynamic pool splits:

1. **Prediction Rounds**: Allows the administrator to create outcome-based block behavior predictions.
2. **Pooled Stakes**: Players lock STX behind prediction outcomes.
3. **Proportional Claims**: Implements on-chain mathematical calculations to distribute the complete pooled stakes proportionally among winning participants (with a standard 2% protocol fee).

---

## 📜 Contract API Reference

### Public functions
- `create-round(target-block uint, outcome-type (string-ascii 20))` — Creates a future block behavior prediction.
- `place-stake(round-id uint, amount uint, prediction uint)` — Stake STX to back your outcome selection.
- `resolve-round(round-id uint, final-outcome uint)` — Finalize target block outcome.
- `claim-reward(round-id uint)` — Withdraw proportional share of won pool (less 2% fee).

### Read-Only Helper functions
- `get-round(round-id uint)` — Returns round parameters.
- `get-user-stake(round-id uint, user principal)` — Queries user stake size and prediction selection.
- `get-prediction-pool(round-id uint, prediction uint)` — Returns total pool size backing a specific option.
- `has-user-claimed(round-id uint, user principal)` — Checks if player has claimed reward.
- `get-latest-round-id` — Returns current round nonce.

---

## 🤖 Automated Resolution Bot

The off-chain Node.js resolution engine script resides at:
📄 `smartcontract/scripts/resolver.ts`

To execute the resolution engine locally, configure environment parameters and run:
```bash
cd smartcontract
npm install
npx ts-node scripts/resolver.ts
```
