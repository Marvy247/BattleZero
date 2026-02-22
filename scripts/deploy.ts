#!/usr/bin/env bun

/**
 * Deploy script for Soroban contracts to testnet
 *
 * Deploys Soroban contracts to testnet
 * Returns the deployed contract IDs
 */

import { $ } from "bun";
import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readEnvFile, getEnvValue } from './utils/env';
import { getWorkspaceContracts, listContractNames, selectContracts } from "./utils/contracts";

// Detect stellar CLI location
let stellarCmd = "stellar";
try {
  await $`stellar --version`.quiet();
} catch (error) {
  // Try common cargo bin location
  const cargoBinPath = `${process.env.HOME}/.cargo/bin/stellar`;
  try {
    await $`${cargoBinPath} --version`.quiet();
    stellarCmd = cargoBinPath;
  } catch (cargoError) {
    console.error("❌ Error: stellar CLI not found");
    console.error("Please install it: https://developers.stellar.org/docs/tools/developer-tools");
    process.exit(1);
  }
}

type StellarKeypair = {
  publicKey(): string;
  secret(): string;
};

type StellarKeypairFactory = {
  random(): StellarKeypair;
  fromSecret(secret: string): StellarKeypair;
};

async function loadKeypairFactory(): Promise<StellarKeypairFactory> {
  try {
    const sdk = await import("@stellar/stellar-sdk");
    return sdk.Keypair;
  } catch (error) {
    console.warn("⚠️  @stellar/stellar-sdk is not installed. Running `bun install`...");
    try {
      await $`bun install`;
      const sdk = await import("@stellar/stellar-sdk");
      return sdk.Keypair;
    } catch (installError) {
      console.error("❌ Failed to load @stellar/stellar-sdk.");
      console.error("Run `bun install` in the repository root, then retry.");
      process.exit(1);
    }
  }
}

function usage() {
  console.log(`
Usage: bun run deploy [contract-name...]

Examples:
  bun run deploy
  bun run deploy number-guess
  bun run deploy twenty-one number-guess
`);
}

console.log("🚀 Deploying contracts to Stellar testnet...\n");
const Keypair = await loadKeypairFactory();

const NETWORK = 'testnet';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const EXISTING_GAME_HUB_TESTNET_CONTRACT_ID = 'CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG';

async function testnetAccountExists(address: string): Promise<boolean> {
  const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`, { method: 'GET' });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`Horizon error ${res.status} checking ${address}`);
  return true;
}

async function ensureTestnetFunded(address: string): Promise<void> {
  if (await testnetAccountExists(address)) return;
  console.log(`💰 Funding ${address} via friendbot...`);
  const fundRes = await fetch(`https://friendbot.stellar.org?addr=${address}`, { method: 'GET' });
  if (!fundRes.ok) {
    throw new Error(`Friendbot funding failed (${fundRes.status}) for ${address}`);
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise((r) => setTimeout(r, 750));
    if (await testnetAccountExists(address)) return;
  }
  throw new Error(`Funded ${address} but it still doesn't appear on Horizon yet`);
}

async function testnetContractExists(contractId: string): Promise<boolean> {
  const tmpPath = join(tmpdir(), `stellar-contract-${contractId}.wasm`);
  try {
    await $`${stellarCmd} -q contract fetch --id ${contractId} --network ${NETWORK} --out-file ${tmpPath}`;
    return true;
  } catch {
    return false;
  } finally {
    try {
      await unlink(tmpPath);
    } catch {
      // Ignore missing temp file
    }
  }
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  usage();
  process.exit(0);
}

const allContracts = await getWorkspaceContracts();
const selection = selectContracts(allContracts, args);
if (selection.unknown.length > 0 || selection.ambiguous.length > 0) {
  console.error("❌ Error: Unknown or ambiguous contract names.");
  if (selection.unknown.length > 0) {
    console.error("Unknown:");
    for (const name of selection.unknown) console.error(`  - ${name}`);
  }
  if (selection.ambiguous.length > 0) {
    console.error("Ambiguous:");
    for (const entry of selection.ambiguous) {
      console.error(`  - ${entry.target}: ${entry.matches.join(", ")}`);
    }
  }
  console.error(`\nAvailable contracts: ${listContractNames(allContracts)}`);
  process.exit(1);
}

const contracts = selection.contracts;
const mock = allContracts.find((c) => c.isMockHub);
if (!mock) {
  console.error("❌ Error: mock-game-hub contract not found in workspace members");
  process.exit(1);
}

const needsMock = contracts.some((c) => !c.isMockHub);
const deployMockRequested = contracts.some((c) => c.isMockHub);
const shouldEnsureMock = deployMockRequested || needsMock;

// Check required WASM files exist for selected contracts (non-mock first)
const missingWasm: string[] = [];
for (const contract of contracts) {
  if (contract.isMockHub) continue;
  if (!await Bun.file(contract.wasmPath).exists()) missingWasm.push(contract.wasmPath);
}
if (missingWasm.length > 0) {
  console.error("❌ Error: Missing WASM build outputs:");
  for (const p of missingWasm) console.error(`  - ${p}`);
  console.error("\nRun 'bun run build [contract-name]' first");
  process.exit(1);
}

// Create three testnet identities: deployer, player1, player2
// Deployer signs deployments directly via secret key (no CLI identity required).
// Player1 and player2 are keypairs for frontend dev use.
// Admin can be set via USER_ADMIN_ADDRESS env var (for Freighter users)
const walletAddresses: Record<string, string> = {};
const walletSecrets: Record<string, string> = {};

// Load existing secrets from .env if available
let existingSecrets: Record<string, string | null> = {
  player1: null,
  player2: null,
};

const existingEnv = await readEnvFile('.env');
for (const identity of ['player1', 'player2']) {
  const key = `VITE_DEV_${identity.toUpperCase()}_SECRET`;
  const v = getEnvValue(existingEnv, key);
  if (v && v !== 'NOT_AVAILABLE') existingSecrets[identity] = v;
}

// Load existing deployment info so partial deploys can preserve other IDs.
const existingContractIds: Record<string, string> = {};
let existingDeployment: any = null;
if (existsSync("deployment.json")) {
  try {
    existingDeployment = await Bun.file("deployment.json").json();
    if (existingDeployment?.contracts && typeof existingDeployment.contracts === "object") {
      Object.assign(existingContractIds, existingDeployment.contracts);
    } else {
      // Backwards compatible fallback
      if (existingDeployment?.mockGameHubId) existingContractIds["mock-game-hub"] = existingDeployment.mockGameHubId;
      if (existingDeployment?.twentyOneId) existingContractIds["twenty-one"] = existingDeployment.twentyOneId;
      if (existingDeployment?.numberGuessId) existingContractIds["number-guess"] = existingDeployment.numberGuessId;
    }
  } catch (error) {
    console.warn("⚠️  Warning: Failed to parse deployment.json, continuing...");
  }
}

for (const contract of allContracts) {
  if (existingContractIds[contract.packageName]) continue;
  const envId = getEnvValue(existingEnv, `VITE_${contract.envKey}_CONTRACT_ID`);
  if (envId) existingContractIds[contract.packageName] = envId;
}

// Check for user-provided admin address (e.g., from Freighter)
const userAdminAddress = process.env.USER_ADMIN_ADDRESS;
let adminAddress: string;

if (userAdminAddress) {
  // Validate the address format (basic check for G... format)
  if (!userAdminAddress.startsWith('G') || userAdminAddress.length !== 56) {
    console.error(`❌ Invalid admin address format: ${userAdminAddress}`);
    console.error('Admin address must be a valid Stellar public key (56 characters starting with G)');
    process.exit(1);
  }
  adminAddress = userAdminAddress;
  console.log(`✅ Using provided admin address: ${adminAddress}`);
} else {
  // Generate admin keypair if not provided
  console.log('📝 No USER_ADMIN_ADDRESS provided, generating new admin identity...');
  const adminKeypair = Keypair.random();
  adminAddress = adminKeypair.publicKey();
  walletSecrets.admin = adminKeypair.secret();
  console.log(`📝 Generated admin: ${adminAddress}`);
}

walletAddresses.admin = adminAddress;

// Handle deployer identity (separate from admin - deployer pays for gas)
console.log('Setting up deployer identity...');
console.log('📝 Generating new deployer identity...');
const deployerKeypair = Keypair.random();
const deployerAddress = deployerKeypair.publicKey();
const deployerSecret = deployerKeypair.secret();

walletAddresses.deployer = deployerAddress;
walletSecrets.deployer = deployerSecret;

try {
  await ensureTestnetFunded(deployerAddress);
  console.log('✅ deployer funded');
} catch (error) {
  console.error('❌ Failed to ensure deployer is funded. Deployment cannot proceed.');
  process.exit(1);
}

// Handle player identities (don't need to be in CLI, just keypairs)
for (const identity of ['player1', 'player2']) {
  console.log(`Setting up ${identity}...`);

  let keypair: StellarKeypair;
  if (existingSecrets[identity]) {
    console.log(`✅ Using existing ${identity} from .env`);
    keypair = Keypair.fromSecret(existingSecrets[identity]!);
  } else {
    console.log(`📝 Generating new ${identity}...`);
    keypair = Keypair.random();
  }

  walletAddresses[identity] = keypair.publicKey();
  walletSecrets[identity] = keypair.secret();
  console.log(`✅ ${identity}: ${keypair.publicKey()}`);

  // Ensure player accounts exist on testnet (even if reusing keys from .env)
  try {
    await ensureTestnetFunded(keypair.publicKey());
    console.log(`✅ ${identity} funded\n`);
  } catch (error) {
    console.warn(`⚠️  Warning: Failed to ensure ${identity} is funded, continuing anyway...`);
  }
}

// Save to deployment.json and .env for setup script to use
console.log("🔐 Deployer and player secret keys will be saved to .env (gitignored)\n");

console.log("💼 Wallet addresses:");
console.log(`  Admin:    ${walletAddresses.admin} (contract owner)`);
console.log(`  Deployer: ${walletAddresses.deployer} (pays for deployment)`);
console.log(`  Player1:  ${walletAddresses.player1}`);
console.log(`  Player2:  ${walletAddresses.player2}\n`);

// Use deployer secret for contract deployment (admin may not have secret key if from Freighter)
// deployerAddress and deployerSecret are already declared above

const deployed: Record<string, string> = { ...existingContractIds };

// Ensure mock Game Hub exists so we can pass it into game constructors.
let mockGameHubId = existingContractIds[mock.packageName] || "";
if (shouldEnsureMock) {
  const candidateMockIds = [
    existingContractIds[mock.packageName],
    existingDeployment?.mockGameHubId,
    EXISTING_GAME_HUB_TESTNET_CONTRACT_ID,
  ].filter(Boolean) as string[];

  for (const candidate of candidateMockIds) {
    if (await testnetContractExists(candidate)) {
      mockGameHubId = candidate;
      break;
    }
  }

  if (mockGameHubId) {
    deployed[mock.packageName] = mockGameHubId;
    console.log(`✅ Using existing ${mock.packageName} on testnet: ${mockGameHubId}\n`);
  } else {
    if (!await Bun.file(mock.wasmPath).exists()) {
      console.error("❌ Error: Missing WASM build output for mock-game-hub:");
      console.error(`  - ${mock.wasmPath}`);
      console.error("\nRun 'bun run build mock-game-hub' first");
      process.exit(1);
    }

    console.warn(`⚠️  ${mock.packageName} not found on testnet (archived or reset). Deploying a new one...`);
    console.log(`Deploying ${mock.packageName}...`);
    try {
      const result =
        await $`${stellarCmd} contract deploy --wasm ${mock.wasmPath} --source-account ${deployerSecret} --network ${NETWORK}`.text();
      mockGameHubId = result.trim();
      deployed[mock.packageName] = mockGameHubId;
      console.log(`✅ ${mock.packageName} deployed: ${mockGameHubId}\n`);
    } catch (error) {
      console.error(`❌ Failed to deploy ${mock.packageName}:`, error);
      process.exit(1);
    }
  }
}

for (const contract of contracts) {
  if (contract.isMockHub) continue;

    console.log(`Deploying ${contract.packageName}...`);
    try {
      console.log("  Installing WASM...");
      const installResult =
        await $`${stellarCmd} contract install --wasm ${contract.wasmPath} --source-account ${deployerSecret} --network ${NETWORK}`.text();
      const wasmHash = installResult.trim();
      console.log(`  WASM hash: ${wasmHash}`);

      console.log("  Deploying and initializing...");
      const deployResult =
        await $`${stellarCmd} contract deploy --wasm-hash ${wasmHash} --source-account ${deployerSecret} --network ${NETWORK} -- --admin ${adminAddress} --game-hub ${mockGameHubId}`.text();
      const contractId = deployResult.trim();
      deployed[contract.packageName] = contractId;
      console.log(`✅ ${contract.packageName} deployed: ${contractId}\n`);
    } catch (error) {
      console.error(`❌ Failed to deploy ${contract.packageName}:`, error);
      process.exit(1);
    }

}

console.log("🎉 Deployment complete!\n");
console.log("Contract IDs:");
const outputContracts = new Set<string>();
for (const contract of contracts) outputContracts.add(contract.packageName);
if (shouldEnsureMock) outputContracts.add(mock.packageName);
for (const contract of allContracts) {
  if (!outputContracts.has(contract.packageName)) continue;
  const id = deployed[contract.packageName];
  if (id) console.log(`  ${contract.packageName}: ${id}`);
}

const twentyOneId = deployed["twenty-one"] || "";
const numberGuessId = deployed["number-guess"] || "";

const deploymentContracts = allContracts.reduce<Record<string, string>>((acc, contract) => {
  acc[contract.packageName] = deployed[contract.packageName] || "";
  return acc;
}, {});

const deploymentInfo = {
  mockGameHubId,
  twentyOneId,
  numberGuessId,
  contracts: deploymentContracts,
  network: NETWORK,
  rpcUrl: RPC_URL,
  networkPassphrase: NETWORK_PASSPHRASE,
  wallets: {
    admin: walletAddresses.admin,
    deployer: walletAddresses.deployer,
    player1: walletAddresses.player1,
    player2: walletAddresses.player2,
  },
  deployedAt: new Date().toISOString(),
};

await Bun.write('deployment.json', JSON.stringify(deploymentInfo, null, 2) + '\n');
console.log("\n✅ Wrote deployment info to deployment.json");

const contractEnvLines = allContracts
  .map((c) => `VITE_${c.envKey}_CONTRACT_ID=${deploymentContracts[c.packageName] || ""}`)
  .join("\n");

const envContent = `# Auto-generated by deploy script
# Do not edit manually - run 'bun run deploy' (or 'bun run setup') to regenerate
# WARNING: This file contains secret keys. Never commit to git!

VITE_SOROBAN_RPC_URL=${RPC_URL}
VITE_NETWORK_PASSPHRASE=${NETWORK_PASSPHRASE}
${contractEnvLines}

# Dev wallet addresses for testing
VITE_DEV_ADMIN_ADDRESS=${walletAddresses.admin}
VITE_DEV_DEPLOYER_ADDRESS=${walletAddresses.deployer}
VITE_DEV_PLAYER1_ADDRESS=${walletAddresses.player1}
VITE_DEV_PLAYER2_ADDRESS=${walletAddresses.player2}

# Dev wallet secret keys (WARNING: Never commit this file!)
VITE_DEV_DEPLOYER_SECRET=${walletSecrets.deployer}
VITE_DEV_PLAYER1_SECRET=${walletSecrets.player1}
VITE_DEV_PLAYER2_SECRET=${walletSecrets.player2}
`;

await Bun.write('.env', envContent + '\n');
console.log("✅ Wrote secrets to .env (gitignored)");

export { mockGameHubId, deployed };
