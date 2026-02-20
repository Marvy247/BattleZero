#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracting, Address, Bytes, BytesN, Env, Vec, vec};

#[contractclient(name = "GameHubClient")]
pub trait GameHub {
    fn start_game(
        env: Env,
        game_id: Address,
        session_id: u32,
        player1: Address,
        player2: Address,
        player1_points: i128,
        player2_points: i128,
    );
    fn end_game(env: Env, session_id: u32, player1_won: bool);
}

#[contracttype]
#[derive(Clone)]
pub struct GameState {
    pub session_id: u32,
    pub player1: Address,
    pub player2: Address,
    pub commit1: BytesN<32>,
    pub commit2: BytesN<32>,
    pub attacks1: Vec<(u8, u8, bool)>,
    pub attacks2: Vec<(u8, u8, bool)>,
    pub turn: Address,
    pub winner: Option<Address>,
}

#[contracttype]
pub enum DataKey {
    Admin,
    GameHub,
    Game(u32),
}

const DAY_IN_LEDGERS: u32 = 17280;
const LEDGERS_30_DAYS: u32 = 30 * DAY_IN_LEDGERS;

#[contract]
pub struct ZKBattleshipContract;

#[contractimpl]
impl ZKBattleshipContract {
    pub fn __constructor(env: Env, admin: Address, game_hub: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::GameHub, &game_hub);
        env.storage().instance().extend_ttl(LEDGERS_30_DAYS, LEDGERS_30_DAYS);
    }

    pub fn initialize(
        env: Env,
        session_id: u32,
        player1: Address,
        player2: Address,
        commit1: BytesN<32>,
        commit2: BytesN<32>,
    ) -> Result<(), u32> {
        player1.require_auth();
        player2.require_auth();

        if env.storage().temporary().has(&DataKey::Game(session_id)) {
            return Err(1);
        }

        let game_hub: Address = env.storage().instance().get(&DataKey::GameHub).unwrap();
        let hub_client = GameHubClient::new(&env, &game_hub);
        
        hub_client.start_game(
            &env.current_contract_address(),
            &session_id,
            &player1,
            &player2,
            &0,
            &0,
        );

        let game = GameState {
            session_id,
            player1: player1.clone(),
            player2: player2.clone(),
            commit1,
            commit2,
            attacks1: vec![&env],
            attacks2: vec![&env],
            turn: player1,
            winner: None,
        };

        env.storage().temporary().set(&DataKey::Game(session_id), &game);
        env.storage().temporary().extend_ttl(&DataKey::Game(session_id), LEDGERS_30_DAYS, LEDGERS_30_DAYS);

        Ok(())
    }

    pub fn attack(
        env: Env,
        session_id: u32,
        row: u8,
        col: u8,
        proof: Bytes,
    ) -> Result<bool, u32> {
        let mut game: GameState = env.storage().temporary().get(&DataKey::Game(session_id)).ok_or(2)?;
        
        if game.winner.is_some() {
            return Err(3);
        }

        game.turn.require_auth();

        if proof.len() < 32 {
            return Err(4);
        }

        let hit = proof.get(0).unwrap_or(0) > 0;

        if game.turn == game.player1 {
            game.attacks1.push_back((row, col, hit));
            game.turn = game.player2.clone();
        } else {
            game.attacks2.push_back((row, col, hit));
            game.turn = game.player1.clone();
        }

        env.storage().temporary().set(&DataKey::Game(session_id), &game);
        env.storage().temporary().extend_ttl(&DataKey::Game(session_id), LEDGERS_30_DAYS, LEDGERS_30_DAYS);

        Ok(hit)
    }

    pub fn claim_win(
        env: Env,
        session_id: u32,
        reveal_proof: Bytes,
    ) -> Result<(), u32> {
        let mut game: GameState = env.storage().temporary().get(&DataKey::Game(session_id)).ok_or(2)?;
        
        if game.winner.is_some() {
            return Err(3);
        }

        let claimer = if game.attacks1.len() > game.attacks2.len() {
            game.player1.clone()
        } else {
            game.player2.clone()
        };
        
        claimer.require_auth();

        if reveal_proof.len() < 32 {
            return Err(5);
        }

        game.winner = Some(claimer.clone());
        
        let game_hub: Address = env.storage().instance().get(&DataKey::GameHub).unwrap();
        let hub_client = GameHubClient::new(&env, &game_hub);
        
        let player1_won = claimer == game.player1;
        hub_client.end_game(&session_id, &player1_won);

        env.storage().temporary().set(&DataKey::Game(session_id), &game);
        env.storage().temporary().extend_ttl(&DataKey::Game(session_id), LEDGERS_30_DAYS, LEDGERS_30_DAYS);

        Ok(())
    }

    pub fn get_game(env: Env, session_id: u32) -> Option<GameState> {
        env.storage().temporary().get(&DataKey::Game(session_id))
    }
}
