# BlockYield — Stacks Mainnet Smart Contract

Clarity smart contract implementation for **BlockYield** — a decentralized, lossless yield-backed tournament and competition engine on the Stacks L2 blockchain.

---

## 🟩 Live Deployed Mainnet Contract

The BlockYield smart contract is fully deployed on the **Stacks Mainnet**:
*   **Contract Principal**: `SP258BY8D71JCTV73A4V3ADPHCVWSBEM6G4FETPYF.blockyield`
*   **Explorer Link**: [View on Hiro Stacks Explorer](https://explorer.hiro.so/txid/SP258BY8D71JCTV73A4V3ADPHCVWSBEM6G4FETPYF.blockyield?chain=mainnet) 🔍

---

## 📊 Core Architecture & Features

The contract governs a lossless Proof-of-Transfer (PoX) simulated staking vault, dynamic yield accrual, risk-free wagering credits, and tournament resolutions:

1. **Lossless Staking Vault**: Users deposit principal STX securely to compound risk-free virtual yield credits, with 100% safe custody. Principal can be withdrawn instantly at any time.
2. **Accrue Yield Credits**: Tracks user deposits and compiles compounding yield credits block-by-block (~5% APY rate).
3. **Risk-Free Wagering**: Wagers are placed using virtual yield credits ("Yield Ammo") on future block heights, protecting the user's principal STX from risk.
4. **Jackpot Splits**: Winners claim the pooled wagers in yield credits and can redeem accumulated yield credits back into liquid STX from the contract reserve.

---

## 📜 Contract API Reference

### Public functions
- `deposit-stx(amount uint)` — Deposit STX principal into the vault (accrues pending yield first).
- `withdraw-stx(amount uint)` — Withdraw STX principal safely from the vault (accrues pending yield first).
- `redeem-yield-credits(amount uint)` — Redeem virtual yield credits for real STX from the contract reserve.
- `place-yield-bet(target-height uint, amount uint, prediction uint)` — Deploy virtual yield credits on block timestamp parity (1 for Even, 2 for Odd).
- `resolve-block(target-height uint)` — Resolve target block outcome parity permissionlessly from on-chain block time info.
- `claim-reward(target-height uint)` — Claim proportional share of won yield credits pool (less 2% fee).
- `fund-yield-reserve(amount uint)` — Admin function to seed the contract reserve with STX for yield redemptions.

### Read-Only Helper functions
- `get-vault-data(user principal)` — Returns principal amount and last updated block height.
- `get-yield-balance(user principal)` — Queries user's total yield credits balance (accumulated + pending ticking yield).
- `get-block-pool(height uint)` — Returns total pool size and option splits backing a specific block height.
- `get-user-stake(height uint, user principal)` — Queries user's prediction selection and bet amount.
- `get-outcome(height uint)` — Queries the resolved outcome parity for a target block height.
- `has-user-claimed(height uint, user principal)` — Checks if player has claimed reward for a specific block height.
