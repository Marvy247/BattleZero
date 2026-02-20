import * as StellarSdk from '@stellar/stellar-sdk';
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
const CONTRACT_ID = 'DEPLOY_AND_UPDATE_THIS'; // Update after deployment

export async function connectWallet(): Promise<string> {
  const connected = await isConnected();
  if (!connected) {
    throw new Error('Freighter wallet not installed');
  }
  return await getPublicKey();
}

export async function initializeGame(
  sessionId: number,
  player1: string,
  player2: string,
  commit1: string,
  commit2: string
): Promise<string> {
  const server = new StellarSdk.SorobanRpc.Server(RPC_URL);
  const sourceAccount = await server.getAccount(player1);
  
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'initialize',
        StellarSdk.nativeToScVal(sessionId, { type: 'u32' }),
        new StellarSdk.Address(player1).toScVal(),
        new StellarSdk.Address(player2).toScVal(),
        StellarSdk.xdr.ScVal.scvBytes(Buffer.from(commit1, 'hex').slice(0, 32)),
        StellarSdk.xdr.ScVal.scvBytes(Buffer.from(commit2, 'hex').slice(0, 32))
      )
    )
    .setTimeout(300)
    .build();

  const prepared = await server.prepareTransaction(tx);
  const xdr = prepared.toXDR();
  const signedXdr = await signTransaction(xdr, { networkPassphrase: NETWORK_PASSPHRASE });
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  
  const result = await server.sendTransaction(signedTx);
  return result.hash;
}

export async function submitAttack(
  sessionId: number,
  player: string,
  row: number,
  col: number,
  proof: Uint8Array
): Promise<boolean> {
  const server = new StellarSdk.SorobanRpc.Server(RPC_URL);
  const sourceAccount = await server.getAccount(player);
  
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'attack',
        StellarSdk.nativeToScVal(sessionId, { type: 'u32' }),
        StellarSdk.nativeToScVal(row, { type: 'u8' }),
        StellarSdk.nativeToScVal(col, { type: 'u8' }),
        StellarSdk.xdr.ScVal.scvBytes(Buffer.from(proof))
      )
    )
    .setTimeout(300)
    .build();

  const prepared = await server.prepareTransaction(tx);
  const xdr = prepared.toXDR();
  const signedXdr = await signTransaction(xdr, { networkPassphrase: NETWORK_PASSPHRASE });
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  
  const result = await server.sendTransaction(signedTx);
  
  let response = await server.getTransaction(result.hash);
  while (response.status === 'NOT_FOUND') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    response = await server.getTransaction(result.hash);
  }
  
  if (response.status === 'SUCCESS' && response.returnValue) {
    return StellarSdk.scValToBool(response.returnValue);
  }
  
  return false;
}

export async function claimWin(
  sessionId: number,
  player: string,
  revealProof: Uint8Array
): Promise<string> {
  const server = new StellarSdk.SorobanRpc.Server(RPC_URL);
  const sourceAccount = await server.getAccount(player);
  
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'claim_win',
        StellarSdk.nativeToScVal(sessionId, { type: 'u32' }),
        StellarSdk.xdr.ScVal.scvBytes(Buffer.from(revealProof))
      )
    )
    .setTimeout(300)
    .build();

  const prepared = await server.prepareTransaction(tx);
  const xdr = prepared.toXDR();
  const signedXdr = await signTransaction(xdr, { networkPassphrase: NETWORK_PASSPHRASE });
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  
  const result = await server.sendTransaction(signedTx);
  return result.hash;
}
