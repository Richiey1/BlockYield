# BlockYield

> **The first lossless prediction game on Bitcoin's smart contract layer.**

[![Stacks](https://img.shields.io/badge/Stacks-L2-blue)](https://stacks.co)
[![Bitcoin](https://img.shields.io/badge/Secured_by-Bitcoin-orange)](https://bitcoin.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## The Problem
Prediction markets and GameFi often require users to risk their principal, leading to significant downside risk. At the same time, holding STX for passive PoX yield can be uneventful. There is a missing link that combines the excitement of gaming and prediction markets with the safety of principal-protected DeFi.

## The Solution
Stake STX, keep 100% of your principal, and compete for real DeFi yield with zero downside risk. **BlockYield** transforms passive blockchain observation into an interactive financial experience. It gamifies DeFi yield, explicitly encouraging user onboarding by providing a risk-free yield gaming experience. 

## How it Works
1. **Stake STX**: Deposit your STX into the smart contract. Your principal is 100% protected.
2. **Accrue Yield**: As blocks pass, your staked STX generates PoX yield credits (now integrated with real DeFi yield traits like Arkadiko).
3. **Play the Game**: Use your accrued yield credits to wager on blockchain prediction outcomes (such as BTC price). 
4. **Win or Keep Trying**: Winners take the pooled yield rewards, while losers only lose their yield credits — their original STX principal remains completely safe and can be withdrawn at any time.

## Live Contract Links (Stacks Mainnet)
- **BlockYield v3**: [`SP258BY8D71JCTV73A4V3ADPHCVWSBEM6G4FETPYF.blockyield-v3`](https://explorer.stacks.co/txid/SP258BY8D71JCTV73A4V3ADPHCVWSBEM6G4FETPYF.blockyield-v3?chain=mainnet)

## Roadmap
- **Phase 1 (Live)**: Lossless principal guarantee, yield credit accrual, and prediction mechanic integration. Upgraded with `yield-strategy-trait.clar` modular dispatch.
- **Phase 2 (Next)**: Replace generic prediction mechanics with a BTC price oracle prediction (Chainlink/Redstone). Upgrade yield accrual logic to use Clarity 4 / Nakamoto's `stacks-block-time` instead of block-height.
- **Phase 3 (Future)**: Security audit, full real yield integrations natively on frontend, and comprehensive analytics dashboard.
