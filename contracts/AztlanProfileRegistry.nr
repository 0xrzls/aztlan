use dep::aztec::macros::aztec;

// CONTRACT 1: SOULBOUND PROFILE REGISTRY
// Privacy-focused, non-transferable identity system
#[aztec]
pub contract AztlanProfileRegistry {
    use dep::aztec::macros::{functions::{public}, storage::storage};
    use dep::aztec::prelude::{AztecAddress, Map, PublicMutable};
    use dep::aztec::protocol_types::traits::FromField;

    #[storage]
    struct Storage<Context> {
        // Core mappings
        username_to_address: Map<Field, PublicMutable<AztecAddress, Context>, Context>,
        profile_id_of: Map<AztecAddress, PublicMutable<Field, Context>, Context>,
        
        // Soulbound NFT data
        token_uri: Map<AztecAddress, PublicMutable<Field, Context>, Context>,
        profile_burned: Map<AztecAddress, PublicMutable<bool, Context>, Context>,
        
        // Privacy settings
        profile_visibility: Map<AztecAddress, PublicMutable<Field, Context>, Context>, // 0=private, 1=public, 2=friends
        blocked_addresses: Map<AztecAddress, Map<AztecAddress, PublicMutable<bool, Context>, Context>, Context>,
        
        // Metadata
        has_profile: Map<AztecAddress, PublicMutable<bool, Context>, Context>,
        profile_created_at: Map<AztecAddress, PublicMutable<Field, Context>, Context>,
        profile_last_updated: Map<AztecAddress, PublicMutable<Field, Context>, Context>,
        
        // Username change tracking
        username_last_changed: Map<AztecAddress, PublicMutable<Field, Context>, Context>,
        username_change_count: Map<AztecAddress, PublicMutable<Field, Context>, Context>,
        
        // Recovery system
        recovery_address: Map<AztecAddress, PublicMutable<AztecAddress, Context>, Context>,
        recovery_requested_at: Map<AztecAddress, PublicMutable<Field, Context>, Context>,
        
        // Contract references
        social_verifier_contract: PublicMutable<AztecAddress, Context>,
        quest_points_contract: PublicMutable<AztecAddress, Context>,
        privacy_settings_contract: PublicMutable<AztecAddress, Context>,
        kyc_verifier_contract: PublicMutable<AztecAddress, Context>, // NEW!
        
        // Admin
        admin: PublicMutable<AztecAddress, Context>,
        admin_initialized: PublicMutable<bool, Context>, // NEW: Track if admin is set
        
        // Stats
        total_profiles: PublicMutable<Field, Context>,
        total_burned_profiles: PublicMutable<Field, Context>,
        next_profile_id: PublicMutable<Field, Context>,
        
        // Config
        username_change_cooldown: PublicMutable<Field, Context>,
        recovery_delay: PublicMutable<Field, Context>,
        profile_creation_paused: PublicMutable<bool, Context>,
        burn_enabled: PublicMutable<bool, Context>,
    }

    #[public]
    fn constructor() {
        // Initialize basic settings without admin
        storage.total_profiles.write(0);
        storage.total_burned_profiles.write(0);
        storage.next_profile_id.write(1);
        storage.username_change_cooldown.write(30);
        storage.recovery_delay.write(259200); // 3 days in blocks
        storage.profile_creation_paused.write(false);
        storage.burn_enabled.write(true);
        storage.admin_initialized.write(false); // Admin not set yet
        
        // Initialize contract addresses as zero
        storage.social_verifier_contract.write(AztecAddress::zero());
        storage.quest_points_contract.write(AztecAddress::zero());
        storage.privacy_settings_contract.write(AztecAddress::zero());
        storage.kyc_verifier_contract.write(AztecAddress::zero());
        storage.admin.write(AztecAddress::zero());
    }

    // NEW: MANUAL ADMIN INITIALIZATION (Only callable once!)
    #[public]
    fn initialize_admin() {
        assert(!storage.admin_initialized.read(), "Admin already initialized");
        
        // Method 1: Using FromField trait
        let admin_address = AztecAddress::from_field(
            0x30390871bfa13ca49d58be1741dfb724562db24b52ca967a1d4a7d0b08faced4
        );
        
        storage.admin.write(admin_address);
        storage.admin_initialized.write(true);
    }

    // ALTERNATIVE: Set admin with parameter (safer approach)
    #[public] 
    fn set_initial_admin(admin_address: AztecAddress) {
        assert(!storage.admin_initialized.read(), "Admin already initialized");
        assert(admin_address != AztecAddress::zero(), "Invalid admin address");
        
        storage.admin.write(admin_address);
        storage.admin_initialized.write(true);
    }

    // NEW: EMERGENCY ADMIN SETTER (Anyone can call, but only works if admin is zero)
    #[public]
    fn emergency_set_admin(new_admin: AztecAddress) {
        let current_admin = storage.admin.read();
        assert(current_admin == AztecAddress::zero(), "Admin already set");
        
        storage.admin.write(new_admin);
        storage.admin_initialized.write(true);
    }

    // PROFILE CREATION - SOULBOUND
    
    #[public]
    fn create_profile(
        username_hash: Field,
        token_uri_hash: Field
    ) {
        let caller = context.msg_sender();
        
        assert(!storage.profile_creation_paused.read(), "Profile creation paused");
        assert(!storage.has_profile.at(caller).read(), "Profile exists");
        assert(!storage.profile_burned.at(caller).read(), "Profile was burned");
        assert(
            storage.username_to_address.at(username_hash).read() == AztecAddress::zero(),
            "Username taken"
        );
        
        let profile_id = storage.next_profile_id.read();
        
        // Create soulbound profile
        storage.username_to_address.at(username_hash).write(caller);
        storage.profile_id_of.at(caller).write(profile_id);
        storage.token_uri.at(caller).write(token_uri_hash);
        storage.has_profile.at(caller).write(true);
        storage.profile_created_at.at(caller).write(1); // Block number
        storage.profile_last_updated.at(caller).write(1);
        storage.username_last_changed.at(caller).write(1);
        storage.username_change_count.at(caller).write(0);
        storage.profile_visibility.at(caller).write(1); // Default public
        storage.recovery_address.at(caller).write(AztecAddress::zero());
        
        storage.total_profiles.write(storage.total_profiles.read() + 1);
        storage.next_profile_id.write(profile_id + 1);
    }

    // BURN FUNCTIONALITY - Right to be forgotten
    
    #[public]
    fn burn_profile() {
        let caller = context.msg_sender();
        
        assert(storage.burn_enabled.read(), "Burn disabled");
        assert(storage.has_profile.at(caller).read(), "No profile");
        assert(!storage.profile_burned.at(caller).read(), "Already burned");
        
        // Mark as burned (keep data for username uniqueness)
        storage.profile_burned.at(caller).write(true);
        storage.has_profile.at(caller).write(false);
        
        // Clear sensitive data
        storage.token_uri.at(caller).write(0);
        storage.profile_visibility.at(caller).write(0);
        storage.recovery_address.at(caller).write(AztecAddress::zero());
        
        // Update stats
        storage.total_burned_profiles.write(
            storage.total_burned_profiles.read() + 1
        );
    }

    // RECOVERY SYSTEM
    
    #[public]
    fn set_recovery_address(recovery: AztecAddress) {
        let caller = context.msg_sender();
        assert(storage.has_profile.at(caller).read(), "No profile");
        assert(!storage.profile_burned.at(caller).read(), "Profile burned");
        
        storage.recovery_address.at(caller).write(recovery);
    }

    #[public]
    fn initiate_recovery(lost_address: AztecAddress) {
        let caller = context.msg_sender();
        assert(
            storage.recovery_address.at(lost_address).read() == caller,
            "Not recovery address"
        );
        assert(storage.has_profile.at(lost_address).read(), "No profile");
        
        storage.recovery_requested_at.at(lost_address).write(1); // Should be block
    }

    #[public]
    fn complete_recovery(
        lost_address: AztecAddress,
        new_address: AztecAddress
    ) {
        let caller = context.msg_sender();
        assert(
            storage.recovery_address.at(lost_address).read() == caller,
            "Not recovery address"
        );
        
        let requested_at = storage.recovery_requested_at.at(lost_address).read();
        assert(requested_at != 0, "Recovery not initiated");
        
        // Transfer profile (but keep it soulbound to new address)
        let profile_id = storage.profile_id_of.at(lost_address).read();
        storage.profile_id_of.at(lost_address).write(0);
        storage.profile_id_of.at(new_address).write(profile_id);
        storage.has_profile.at(lost_address).write(false);
        storage.has_profile.at(new_address).write(true);
        
        // Clear recovery
        storage.recovery_requested_at.at(lost_address).write(0);
    }

    // PRIVACY SETTINGS
    
    #[public]
    fn set_profile_visibility(visibility: Field) {
        let caller = context.msg_sender();
        assert(storage.has_profile.at(caller).read(), "No profile");
        assert(
            (visibility == 0) | (visibility == 1) | (visibility == 2), 
            "Invalid visibility"
        );
        
        storage.profile_visibility.at(caller).write(visibility);
        storage.profile_last_updated.at(caller).write(1); // Should be block
    }

    #[public]
    fn block_address(address_to_block: AztecAddress) {
        let caller = context.msg_sender();
        assert(storage.has_profile.at(caller).read(), "No profile");
        
        storage.blocked_addresses.at(caller).at(address_to_block).write(true);
    }

    #[public]
    fn unblock_address(address_to_unblock: AztecAddress) {
        let caller = context.msg_sender();
        
        storage.blocked_addresses.at(caller).at(address_to_unblock).write(false);
    }

    // USERNAME MANAGEMENT
    
    #[public]
    fn update_username(
        old_username_hash: Field,
        new_username_hash: Field
    ) {
        let caller = context.msg_sender();
        
        assert(
            storage.username_to_address.at(old_username_hash).read() == caller,
            "Not your username"
        );
        assert(
            storage.username_to_address.at(new_username_hash).read() == AztecAddress::zero(),
            "New username taken"
        );
        
        // Update mappings
        storage.username_to_address.at(old_username_hash).write(AztecAddress::zero());
        storage.username_to_address.at(new_username_hash).write(caller);
        
        storage.username_last_changed.at(caller).write(1);
        let change_count = storage.username_change_count.at(caller).read();
        storage.username_change_count.at(caller).write(change_count + 1);
        storage.profile_last_updated.at(caller).write(1);
    }

    #[public]
    fn update_token_uri(new_uri_hash: Field) {
        let caller = context.msg_sender();
        assert(storage.has_profile.at(caller).read(), "No profile");
        assert(!storage.profile_burned.at(caller).read(), "Profile burned");
        
        storage.token_uri.at(caller).write(new_uri_hash);
        storage.profile_last_updated.at(caller).write(1);
    }

    // ADMIN FUNCTIONS
    
    #[public]
    fn set_social_verifier_contract(social_verifier: AztecAddress) {
        let caller = context.msg_sender();
        assert(caller == storage.admin.read(), "Only admin");
        storage.social_verifier_contract.write(social_verifier);
    }

    #[public]
    fn set_quest_points_contract(quest_points: AztecAddress) {
        let caller = context.msg_sender();
        assert(caller == storage.admin.read(), "Only admin");
        storage.quest_points_contract.write(quest_points);
    }

    #[public]
    fn set_privacy_settings_contract(privacy_settings: AztecAddress) {
        let caller = context.msg_sender();
        assert(caller == storage.admin.read(), "Only admin");
        storage.privacy_settings_contract.write(privacy_settings);
    }

    #[public]
    fn set_kyc_verifier_contract(kyc_verifier: AztecAddress) {
        let caller = context.msg_sender();
        assert(caller == storage.admin.read(), "Only admin");
        storage.kyc_verifier_contract.write(kyc_verifier);
    }

    #[public]
    fn toggle_burn_enabled() {
        let caller = context.msg_sender();
        assert(caller == storage.admin.read(), "Only admin");
        storage.burn_enabled.write(!storage.burn_enabled.read());
    }

    #[public]
    fn pause_profile_creation() {
        let caller = context.msg_sender();
        assert(caller == storage.admin.read(), "Only admin");
        storage.profile_creation_paused.write(true);
    }

    #[public]
    fn unpause_profile_creation() {
        let caller = context.msg_sender();
        assert(caller == storage.admin.read(), "Only admin");
        storage.profile_creation_paused.write(false);
    }

    #[public]
    fn transfer_admin(new_admin: AztecAddress) {
        let caller = context.msg_sender();
        assert(caller == storage.admin.read(), "Only admin");
        storage.admin.write(new_admin);
    }

    // NEW: CHANGE ADMIN FUNCTION (Better than transfer)
    #[public]
    fn change_admin(new_admin: AztecAddress) {
        let caller = context.msg_sender();
        assert(caller == storage.admin.read(), "Only admin");
        assert(new_admin != AztecAddress::zero(), "Invalid admin address");
        
        storage.admin.write(new_admin);
    }

    // VIEW FUNCTIONS
    
    #[public]
    fn get_profile_id(user: AztecAddress) -> Field {
        storage.profile_id_of.at(user).read()
    }

    #[public]
    fn get_address_by_username(username_hash: Field) -> AztecAddress {
        storage.username_to_address.at(username_hash).read()
    }

    #[public]
    fn get_token_uri(user: AztecAddress) -> Field {
        storage.token_uri.at(user).read()
    }

    #[public]
    fn has_profile(user: AztecAddress) -> bool {
        storage.has_profile.at(user).read()
    }

    #[public]
    fn is_profile_burned(user: AztecAddress) -> bool {
        storage.profile_burned.at(user).read()
    }

    #[public]
    fn get_profile_visibility(user: AztecAddress) -> Field {
        storage.profile_visibility.at(user).read()
    }

    #[public]
    fn is_blocked(profile_owner: AztecAddress, blocked_address: AztecAddress) -> bool {
        storage.blocked_addresses.at(profile_owner).at(blocked_address).read()
    }

    #[public]
    fn get_recovery_address(user: AztecAddress) -> AztecAddress {
        storage.recovery_address.at(user).read()
    }

    #[public]
    fn is_username_available(username_hash: Field) -> bool {
        storage.username_to_address.at(username_hash).read() == AztecAddress::zero()
    }

    #[public]
    fn get_social_verifier_contract() -> AztecAddress {
        storage.social_verifier_contract.read()
    }

    #[public]
    fn get_quest_points_contract() -> AztecAddress {
        storage.quest_points_contract.read()
    }

    #[public]
    fn get_privacy_settings_contract() -> AztecAddress {
        storage.privacy_settings_contract.read()
    }

    #[public]
    fn get_kyc_verifier_contract() -> AztecAddress {
        storage.kyc_verifier_contract.read()
    }

    #[public]
    fn get_total_profiles() -> Field {
        storage.total_profiles.read()
    }

    #[public]
    fn get_total_burned_profiles() -> Field {
        storage.total_burned_profiles.read()
    }

    #[public]
    fn get_admin() -> AztecAddress {
        storage.admin.read()
    }

    #[public]
    fn is_burn_enabled() -> bool {
        storage.burn_enabled.read()
    }

    // NEW: Check if admin is initialized
    #[public]
    fn is_admin_initialized() -> bool {
        storage.admin_initialized.read()
    }
}
