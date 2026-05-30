# BlockYield — Stacks Mainnet Deployment Plan Guide

This guide details how to customize and deploy the checked and verified `blockyield.clar` smart contract to the Stacks Mainnet.

---

## 🛠️ Step 1: Customize Your Deployment Plan
Before deploying, open [default.mainnet-plan.yaml](file:///home/babalola/Desktop/x-talent/damilareK/BlockYield/smartcontract/deployments/default.mainnet-plan.yaml) and verify the `expected-sender` field (line 13) matches your active Stacks Mainnet deployer wallet address:

```yaml
# deployments/default.mainnet-plan.yaml
- contract-publish:
    contract-name: blockyield
    expected-sender: SP258BY8D71JCTV73A4V3ADPHCVWSBEM6G4FETPYF  # <-- Your deployer wallet address
```

---

## 🚀 Step 2: Run the Deployment Command

Open your terminal, navigate to the `smartcontract` directory, and run the following Clarinet command to deploy the contract:

```bash
cd /home/babalola/Desktop/x-talent/damilareK/BlockYield/smartcontract

# Run the deployment plan on Stacks Mainnet
clarinet deployment apply -p deployments/default.mainnet-plan.yaml
```

*Note: You will be prompted by Clarinet to securely provide the private key for your deployer address to sign and broadcast the transaction.*

---

## 🚦 Step 3: Verify the Contract on Explorer
Once broadcasted, monitor the Stacks transaction on the Hiro Explorer:
- **Contract Name**: `blockyield`
- **Mainnet Explorer**: [Hiro Stacks Explorer](https://explorer.hiro.so)

Once the transaction is confirmed, update the contract address (`DEPLOYER_ADDRESS` and `CONTRACT_NAME`) inside `/frontend/lib/constants/contracts.ts` to fully point your production website to your live mainnet instance!
