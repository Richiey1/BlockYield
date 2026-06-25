import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;

// The Clarinet.toml contract name for the main contract
const CONTRACT_NAME = "blockyield-v3";
// Mock strategy contract (registered in Clarinet.toml)
const MOCK_STRATEGY = "mock-yield-strategy";

describe("BlockYields Lossless Yield Betting Engine", () => {
  it("should execute the full lossless yield staking, virtual betting, and withdrawal loop", () => {
    // 1. Initial Deposit (10,000 STX = 10,000,000,000 micro-STX)
    const depositAmount = 10000000000;
    const depositRes = simnet.callPublicFn(
      CONTRACT_NAME,
      "deposit-stx",
      [
        Cl.uint(depositAmount),
        Cl.contractPrincipal(deployer, MOCK_STRATEGY),
      ],
      alice
    );
    expect(depositRes.result).toBeOk(Cl.bool(true));

    // Get current height after deposit
    const heightAfterDeposit = simnet.blockHeight;

    // Check Vault
    const vaultRes = simnet.callReadOnlyFn(
      CONTRACT_NAME,
      "get-vault-data",
      [Cl.principal(alice)],
      alice
    );
    expect(vaultRes.result).toBeSome(
      Cl.tuple({
        "principal-amount": Cl.uint(depositAmount),
        "last-yield-block": Cl.uint(heightAfterDeposit),
      })
    );

    // 2. Mine blocks to accrue yield
    simnet.mineEmptyBlocks(10);
    const heightAfterMining = simnet.blockHeight;
    const blocksElapsed = heightAfterMining - heightAfterDeposit; // Should be 10

    // Get yield balance
    const yieldRes = simnet.callReadOnlyFn(
      CONTRACT_NAME,
      "get-yield-balance",
      [Cl.principal(alice)],
      alice
    );
    // Yield = principal (10,000,000,000) * blocks elapsed (10) * rate (95) / scale (1,000,000,000) = 9,500 micro-STX
    const expectedYield = Math.floor((depositAmount * blocksElapsed * 95) / 1000000000);
    expect(yieldRes.result).toBeUint(expectedYield);

    // 3. Place prediction bet using virtual yield credits only
    const betAmount = 5000;
    const targetBlockHeight = heightAfterMining + 5;
    const prediction = 2; // Odd

    const betRes = simnet.callPublicFn(
      CONTRACT_NAME,
      "place-yield-bet",
      [Cl.uint(targetBlockHeight), Cl.uint(betAmount), Cl.uint(prediction)],
      alice
    );
    expect(betRes.result).toBeOk(Cl.bool(true));

    // Alice's yield balance should be reduced. (Remaining is expectedYield - betAmount)
    const yieldResAfter = simnet.callReadOnlyFn(
      CONTRACT_NAME,
      "get-yield-balance",
      [Cl.principal(alice)],
      alice
    );
    // Since place-yield-bet is a public transaction, it mines 1 block. So block height is heightAfterMining + 1.
    // That means Alice also accrued yield for 1 more block on her 10,000,000,000 principal!
    // Additional yield for 1 block = (10,000,000,000 * 1 * 95) / 1,000,000,000 = 950 micro-STX.
    // So final expected yield = (expectedYield + 950) - betAmount = (9,500 + 950) - 5,000 = 5,450.
    expect(yieldResAfter.result).toBeUint(expectedYield + 950 - betAmount);

    // Vault principal should remain completely untouched
    const vaultResAfterBet = simnet.callReadOnlyFn(
      CONTRACT_NAME,
      "get-vault-data",
      [Cl.principal(alice)],
      alice
    );
    expect(vaultResAfterBet.result).toBeSome(
      Cl.tuple({
        "principal-amount": Cl.uint(depositAmount),
        "last-yield-block": Cl.uint(heightAfterMining + 1),
      })
    );

    // 4. Safely withdraw principal STX
    const withdrawAmount = 5000000000; // 5,000 STX
    const withdrawRes = simnet.callPublicFn(
      CONTRACT_NAME,
      "withdraw-stx",
      [
        Cl.uint(withdrawAmount),
        Cl.contractPrincipal(deployer, MOCK_STRATEGY),
      ],
      alice
    );
    expect(withdrawRes.result).toBeOk(Cl.bool(true));

    // Principal should now be depositAmount - withdrawAmount = 5,000,000,000
    const vaultResAfterWithdraw = simnet.callReadOnlyFn(
      CONTRACT_NAME,
      "get-vault-data",
      [Cl.principal(alice)],
      alice
    );
    expect(vaultResAfterWithdraw.result).toBeSome(
      Cl.tuple({
        "principal-amount": Cl.uint(depositAmount - withdrawAmount),
        "last-yield-block": Cl.uint(heightAfterMining + 2), // 1 block mined for withdraw-stx
      })
    );
  });
});
