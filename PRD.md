# 📘 BlockYield — Product Requirements Document (PRD)

## 🟠 Product Name

BlockYield

A real-time on-chain prediction game where players stake STX on verifiable blockchain outcomes and win based on correct predictions.

## 🧠 One-Line Summary

Predict the next block, share the pool, win on-chain.

---

## 🎯 Problem Statement

Current crypto interactions are mostly passive (holding/staking). Prediction markets are often slow, depend on external oracles, and focus on long-term price speculation.

Users want:
- Immediate feedback
- Direct interaction with blockchain data
- Trustless, oracle-free resolution

---

## 💡 Solution

A smart contract system that creates "prediction pools" for specific on-chain events (e.g., "Will the next block have > 50 transactions?").

---

## ⚙️ Core Features

1. **Prediction Market Engine**: Create and manage rounds with deterministic outcomes.
2. **Dynamic Staking**: Proportional pool distribution for winners.
3. **Automated Resolver**: Logic that pulls block data to finalize rounds.
4. **Real-time Dashboard**: Live feed of network stats to inform predictions.

---

## 🏗️ Technical Architecture

### Smart Contracts (Clarity)
- `blockyields.clar`: Handles the lifecycle of prediction rounds and staking.

---

### Frontend
- Next.js with Stacks.js integration.
- High-impact UI for fast-paced interaction.

---

## 🚀 Roadmap

- **Phase 1**: Block Pulse (Tx count & Block size predictions).
- **Phase 2**: Activity Watch (Contract interaction predictions).
- **Phase 3**: Leaderboards and Streaks.
