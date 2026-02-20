use dep::std;

fn main(
    commitment: pub Field,
    attack_row: pub u8,
    attack_col: pub u8,
    hit: pub bool,
    ships: [Field; 17]
) {
    // Verify commitment matches ships
    let computed = std::hash::poseidon2::Poseidon2::hash(ships, 17);
    assert(computed == commitment);
    
    // Ships: [ship1_len, ship1_cells..., ship2_len, ship2_cells..., ...]
    let attack_pos = attack_row as Field * 10 + attack_col as Field;
    let mut found_hit = false;
    
    // Check if attack hits any ship cell
    let mut idx = 0;
    for _ in 0..5 {
        if idx >= 17 { break; }
        let ship_len = ships[idx] as u8;
        idx += 1;
        
        for _ in 0..ship_len {
            if idx >= 17 { break; }
            let cell_row = ships[idx] as u8;
            idx += 1;
            if idx >= 17 { break; }
            let cell_col = ships[idx] as u8;
            idx += 1;
            
            if (cell_row == attack_row) & (cell_col == attack_col) {
                found_hit = true;
            }
        }
    }
    
    assert(found_hit == hit);
}
