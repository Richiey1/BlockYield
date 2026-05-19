# 📝 BlockBet Development TODO

> [!IMPORTANT]
> This document tracks the remaining pending tasks for the **BlockBet** prediction protocol.

## 🚀 Phase 1: Core Protocol Development
- [ ] **Automated Resolution Engine**: Build a bot or script that triggers `resolve-round` by fetching real-time block data from the Stacks API.
- [ ] **Multi-Mode Support**: Expand contract logic to support specific DeFi interaction predictions (e.g., DEX swaps).
- [ ] **Security Audit**: Ensure pool distribution logic is protected against edge cases (e.g., zero winners).

## 🖥️ Frontend & UX
- [ ] **Live Prediction Interface**: Build the active betting UI where users can see the current pool and select their outcome.
- [ ] **Network Feed**: Integrate a real-time WebSocket or polling feed of Stacks block data to inform player decisions.
- [ ] **Historical Performance**: Add a "My Bets" section to track previous predictions and rewards.

## 🧪 Testing & Validation
- [ ] **Unit Tests**: Refactor legacy StacksTacToe tests in `./tests` to cover the new prediction market logic.
- [ ] **Load Testing**: Simulate high-frequency betting rounds to ensure contract gas efficiency.
