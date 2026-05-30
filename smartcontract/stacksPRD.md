# 📘 BlockYield — Lossless Yield-Backed Tournament Engine

## 🧠 One-Liner

A decentralized, Stacks-native prediction and competition engine where players stash STX safely to compound yield, and wager virtual yield credits on live blockchain outcomes.

---

## 🎯 Vision

Transform passive blockchain capital into active, decision-driven engagement. Users earn boosted yields through skill-based on-chain predictions without ever risking their underlying principal.

---

## 🚨 Problem

Traditional prediction games are risky:
- Users lose their hard-earned principal.
- Volatility creates massive friction.
- Passive staking is secure but lacks interactive engagement.

---

## 💡 Core Concept: BlockYield Lossless Loop

Instead of simple direct wagering, BlockYield turns PoX staking into an interactive tournament layer:
1. **STX Principal Vault**: Stash STX securely inside the on-chain vault adapter. Principal is always 100% protected and withdrawable at any block height.
2. **Accrue Stacking Yield**: Your principal simulated PoX staking compounding rate (~5% APY) generates virtual **Yield Credits** ("Yield Ammo") block-by-block.
3. **Lossless Prediction Tournaments**: Wager virtual yield credits on blockchain outcomes (e.g. block timestamp parity). 
4. **Jackpot Multipliers**: Winners claim the pooled wagers in yield credits (boosting their effective Stacking APY exponentially) and redeem them for liquid STX. Losers lose nothing but virtual yield credits!

---

## 🔐 Smart Contract Architecture (Stacks / Clarity)

### 1. `blockyield.clar`
- **Vault Stash Engine**: Controls `deposit-stx` and `withdraw-stx` principal custody.
- **Accrual Module**: Automatically tracks compounding yield credits linear block-by-block progression.
- **Tournament Pool Manager**: Governs virtual wagers and proportional splits.
- **Oracle Resolution**: Resolves block metrics directly from on-chain block header timestamps.
