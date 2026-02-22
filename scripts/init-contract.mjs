#!/usr/bin/env node

/**
 * Initialize BattleZero Contract with Game Hub Address
 * This calls the __constructor function to set up the contract
 */

import pkg from '@stellar/stellar-sdk';
const { Soroban, Keypair, TransactionBuilder, Networks, Contract, Address } = pkg;

const CONTRACT_ID = 'CCVL2EVEX4M7QVD7PBYV5B4WRIUI6O563GXNEZU6XJOHDE5UIXPHHZUE';
const GAME_HUB = 'CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG';
const ADMIN_SECRET = 'SC4AYIIETDIWO3OLG5XQLBRSJJ3S4JTBRGT4FJ4YGRBHS7GX2PG4PBHI';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

async function initializeContract() {
  console.log('🚀 Initializing BattleZero Contract');
  console.log('=====================================\n');
  
  try {
    const server = new Soroban.Server(RPC_URL);
    const sourceKeypair = Keypair.fromSecret(ADMIN_SECRET);
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    
    console.log('📋 Configuration:');
    console.log(`   Contract: ${CONTRACT_ID}`);
    console.log(`   Admin: ${sourceKeypair.publicKey()}`);
    console.log(`   Game Hub: ${GAME_HUB}\n`);
    
    const contract = new Contract(CONTRACT_ID);
    
    console.log('🔧 Building transaction...');
    const tx = new TransactionBuilder(sourceAccount, {
      fee: '100000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          '__constructor',
          new Address(sourceKeypair.publicKey()).toScVal(),
          new Address(GAME_HUB).toScVal()
        )
      )
      .setTimeout(300)
      .build();
    
    console.log('📝 Preparing transaction...');
    const prepared = await server.prepareTransaction(tx);
    prepared.sign(sourceKeypair);
    
    console.log('📤 Submitting to testnet...');
    const result = await server.sendTransaction(prepared);
    
    console.log(`✅ Transaction submitted!`);
    console.log(`   Hash: ${result.hash}\n`);
    
    console.log('⏳ Waiting for confirmation...');
    let response = await server.getTransaction(result.hash);
    while (response.status === 'NOT_FOUND') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      response = await server.getTransaction(result.hash);
    }
    
    if (response.status === 'SUCCESS') {
      console.log('✅ Contract initialized successfully!\n');
      console.log('🔗 View on Explorer:');
      console.log(`   https://stellar.expert/explorer/testnet/tx/${result.hash}\n`);
      console.log('✨ Ready for gameplay with real transactions!');
    } else {
      console.error('❌ Transaction failed:', response.status);
      if (response.resultXdr) {
        console.error('   Result:', response.resultXdr);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Details:', error.response);
    }
    process.exit(1);
  }
}

initializeContract();
