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
    
    // Check if attack hits any ship cell
    let mut found_hit = false;
    
    // Iterate through ship data (fixed iterations for constraints)
    for i in 0..17 {
        let val = ships[i] as u8;
        // Check if this is a coordinate that matches attack
        if (i % 2 == 1) & (i > 0) {
            let prev_val = ships[i - 1] as u8;
            if (prev_val == attack_row) & (val == attack_col) {
                found_hit = true;
            }
        }
    }
    
    assert(found_hit == hit);
}
