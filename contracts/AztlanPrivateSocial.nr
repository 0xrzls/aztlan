use dep::aztec::macros::aztec;

// CONTRACT 2: PRIVATE SOCIAL VERIFIER - FLEXIBLE DEPLOYMENT
// Registry address can be set after deployment!
#[aztec]
pub contract AztlanPrivateSocial {
    use dep::aztec::macros::{functions::{public, private}, storage::storage};
    use dep::aztec::prelude::{AztecAddress, PublicMutable, Map};
    use dep::aztec::protocol_types::traits::FromField;
    
    #[storage]
    struct Storage<Context> {
        // Contract references - can be updated!
        profile_registry: PublicMutable<AztecAddress, Context>,
        oracle: PublicMutable<AztecAddress, Context>,
        admin: PublicMutable<AztecAddress, Context>,
        admin_initialized: PublicMutable<bool, Context>, // NEW: Track if admin is set
        
        // Individual verification tracking per profile
        twitter_verified: Map<Field, PublicMutable<bool, Context>, Context>,
        discord_verified: Map<Field, PublicMutable<bool, Context>, Context>,
        telegram_verified: Map<Field, PublicMutable<bool, Context>, Context>,
        github_verified: Map<Field, PublicMutable<bool, Context>, Context>,
        farcaster_verified: Map<Field, PublicMutable<bool, Context>, Context>,
        email_verified: Map<Field, PublicMutable<bool, Context>, Context>,
        
        // Verification timestamps (block numbers)
        twitter_verified_at: Map<Field, PublicMutable<Field, Context>, Context>,
        discord_verified_at: Map<Field, PublicMutable<Field, Context>, Context>,
        telegram_verified_at: Map<Field, PublicMutable<Field, Context>, Context>,
        github_verified_at: Map<Field, PublicMutable<Field, Context>, Context>,
        farcaster_verified_at: Map<Field, PublicMutable<Field, Context>, Context>,
        email_verified_at: Map<Field, PublicMutable<Field, Context>, Context>,
        
        // Verification count per profile
        verification_count: Map<Field, PublicMutable<Field, Context>, Context>,
        
        // Global counters (for stats)
        total_twitter_verifications: PublicMutable<Field, Context>,
        total_discord_verifications: PublicMutable<Field, Context>,
        total_telegram_verifications: PublicMutable<Field, Context>,
        total_github_verifications: PublicMutable<Field, Context>,
        total_farcaster_verifications: PublicMutable<Field, Context>,
        total_email_verifications: PublicMutable<Field, Context>,
        total_verifications: PublicMutable<Field, Context>,
    }

    #[public]
    fn constructor() {
        // Initialize without admin parameter
        storage.admin.write(AztecAddress::zero());
        storage.admin_initialized.write(false);
        storage.oracle.write(AztecAddress::zero()); // Will be set after admin
        storage.profile_registry.write(AztecAddress::zero()); // Will be set later
        
        // Initialize global counters
        storage.total_twitter_verifications.write(0);
        storage.total_discord_verifications.write(0);
        storage.total_telegram_verifications.write(0);
        storage.total_github_verifications.write(0);
        storage.total_farcaster_verifications.write(0);
        storage.total_email_verifications.write(0);
        storage.total_verifications.write(0);
    }

    // NEW: MANUAL ADMIN INITIALIZATION FUNCTIONS
    
    #[public]
    fn initialize_admin() {
        assert(!storage.admin_initialized.read(), "Admin already initialized");
        
        // HARDCODED YOUR ADDRESS
        let admin_address = AztecAddress::from_field(
            0x30390871bfa13ca49d58be1741dfb724562db24b52ca967a1d4a7d0b08faced4
        );
        
        storage.admin.write(admin_address);
        storage.oracle.write(admin_address); // Default oracle = admin
        storage.admin_initialized.write(true);
    }

    #[public] 
    fn set_initial_admin(admin_address: AztecAddress) {
        assert(!storage.admin_initialized.read(), "Admin already initialized");
        assert(admin_address != AztecAddress::zero(), "Invalid admin address");
        
        storage.admin.write(admin_address);
        storage.oracle.write(admin_address); // Default oracle = admin
        storage.admin_initialized.write(true);
    }

    #[public]
    fn emergency_set_admin(new_admin: AztecAddress) {
        let current_admin = storage.admin.read();
        assert(current_admin == AztecAddress::zero(), "Admin already set");
        assert(new_admin != AztecAddress::zero(), "Invalid admin address");
        
        storage.admin.write(new_admin);
        storage.oracle.write(new_admin); // Default oracle = admin
        storage.admin_initialized.write(true);
    }

    // ADMIN FUNCTIONS - Set addresses after deployment
    
    #[public]
    fn set_profile_registry(registry: AztecAddress) {
        let caller = context.msg_sender();
        assert(caller == storage.admin.read(), "Only admin");
        assert(registry != AztecAddress::zero(), "Invalid registry address");
        storage.profile_registry.write(registry);
    }

    #[public]
    fn set_oracle(oracle: AztecAddress) {
        let caller = context.msg_sender();
        assert(caller == storage.admin.read(), "Only admin");
        assert(oracle != AztecAddress::zero(), "Invalid oracle address");
        storage.oracle.write(oracle);
    }

    #[public]
    fn transfer_admin(new_admin: AztecAddress) {
        let caller = context.msg_sender();
        assert(caller == storage.admin.read(), "Only admin");
        assert(new_admin != AztecAddress::zero(), "Invalid admin address");
        storage.admin.write(new_admin);
    }

    // NEW: Better change admin function
    #[public]
    fn change_admin(new_admin: AztecAddress) {
        let caller = context.msg_sender();
        assert(caller == storage.admin.read(), "Only admin");
        assert(new_admin != AztecAddress::zero(), "Invalid admin address");
        
        storage.admin.write(new_admin);
    }

    // PRIVATE FUNCTIONS - Process data privately
    
    #[private]
    fn prepare_twitter_verification(
        profile_id: Field,
        handle_hash: Field
    ) -> Field {
        let verification_hash = handle_hash + profile_id + 1000000;
        verification_hash
    }

    #[private]
    fn prepare_discord_verification(
        profile_id: Field,
        handle_hash: Field  
    ) -> Field {
        let verification_hash = handle_hash + profile_id + 2000000;
        verification_hash
    }

    #[private]
    fn prepare_telegram_verification(
        profile_id: Field,
        handle_hash: Field
    ) -> Field {
        let verification_hash = handle_hash + profile_id + 3000000;
        verification_hash
    }

    #[private]
    fn prepare_github_verification(
        profile_id: Field,
        handle_hash: Field
    ) -> Field {
        let verification_hash = handle_hash + profile_id + 4000000;
        verification_hash
    }

    #[private]
    fn prepare_farcaster_verification(
        profile_id: Field,
        handle_hash: Field
    ) -> Field {
        let verification_hash = handle_hash + profile_id + 5000000;
        verification_hash
    }

    #[private]
    fn prepare_email_verification(
        profile_id: Field,
        email_hash: Field
    ) -> Field {
        let verification_hash = email_hash + profile_id + 6000000;
        verification_hash
    }

    // PUBLIC FUNCTIONS - Store verification with profile tracking
    
    #[public]
    fn complete_twitter_verification(
        profile_id: Field,
        _verification_hash: Field
    ) {
        let caller = context.msg_sender();
        assert(caller == storage.oracle.read(), "Only oracle");
        assert(!storage.twitter_verified.at(profile_id).read(), "Already verified");
        
        // Set individual verification
        storage.twitter_verified.at(profile_id).write(true);
        storage.twitter_verified_at.at(profile_id).write(1); // Should be block.number
        
        // Update profile verification count
        let current_count = storage.verification_count.at(profile_id).read();
        storage.verification_count.at(profile_id).write(current_count + 1);
        
        // Update global counters
        storage.total_twitter_verifications.write(
            storage.total_twitter_verifications.read() + 1
        );
        storage.total_verifications.write(
            storage.total_verifications.read() + 1
        );
    }

    #[public]
    fn complete_discord_verification(
        profile_id: Field,
        _verification_hash: Field
    ) {
        let caller = context.msg_sender();
        assert(caller == storage.oracle.read(), "Only oracle");
        assert(!storage.discord_verified.at(profile_id).read(), "Already verified");
        
        storage.discord_verified.at(profile_id).write(true);
        storage.discord_verified_at.at(profile_id).write(1);
        
        let current_count = storage.verification_count.at(profile_id).read();
        storage.verification_count.at(profile_id).write(current_count + 1);
        
        storage.total_discord_verifications.write(
            storage.total_discord_verifications.read() + 1
        );
        storage.total_verifications.write(
            storage.total_verifications.read() + 1
        );
    }

    #[public]
    fn complete_telegram_verification(
        profile_id: Field,
        _verification_hash: Field
    ) {
        let caller = context.msg_sender();
        assert(caller == storage.oracle.read(), "Only oracle");
        assert(!storage.telegram_verified.at(profile_id).read(), "Already verified");
        
        storage.telegram_verified.at(profile_id).write(true);
        storage.telegram_verified_at.at(profile_id).write(1);
        
        let current_count = storage.verification_count.at(profile_id).read();
        storage.verification_count.at(profile_id).write(current_count + 1);
        
        storage.total_telegram_verifications.write(
            storage.total_telegram_verifications.read() + 1
        );
        storage.total_verifications.write(
            storage.total_verifications.read() + 1
        );
    }

    #[public]
    fn complete_github_verification(
        profile_id: Field,
        _verification_hash: Field
    ) {
        let caller = context.msg_sender();
        assert(caller == storage.oracle.read(), "Only oracle");
        assert(!storage.github_verified.at(profile_id).read(), "Already verified");
        
        storage.github_verified.at(profile_id).write(true);
        storage.github_verified_at.at(profile_id).write(1);
        
        let current_count = storage.verification_count.at(profile_id).read();
        storage.verification_count.at(profile_id).write(current_count + 1);
        
        storage.total_github_verifications.write(
            storage.total_github_verifications.read() + 1
        );
        storage.total_verifications.write(
            storage.total_verifications.read() + 1
        );
    }

    #[public]
    fn complete_farcaster_verification(
        profile_id: Field,
        _verification_hash: Field
    ) {
        let caller = context.msg_sender();
        assert(caller == storage.oracle.read(), "Only oracle");
        assert(!storage.farcaster_verified.at(profile_id).read(), "Already verified");
        
        storage.farcaster_verified.at(profile_id).write(true);
        storage.farcaster_verified_at.at(profile_id).write(1);
        
        let current_count = storage.verification_count.at(profile_id).read();
        storage.verification_count.at(profile_id).write(current_count + 1);
        
        storage.total_farcaster_verifications.write(
            storage.total_farcaster_verifications.read() + 1
        );
        storage.total_verifications.write(
            storage.total_verifications.read() + 1
        );
    }

    #[public]
    fn complete_email_verification(
        profile_id: Field,
        _verification_hash: Field
    ) {
        let caller = context.msg_sender();
        assert(caller == storage.oracle.read(), "Only oracle");
        assert(!storage.email_verified.at(profile_id).read(), "Already verified");
        
        storage.email_verified.at(profile_id).write(true);
        storage.email_verified_at.at(profile_id).write(1);
        
        let current_count = storage.verification_count.at(profile_id).read();
        storage.verification_count.at(profile_id).write(current_count + 1);
        
        storage.total_email_verifications.write(
            storage.total_email_verifications.read() + 1
        );
        storage.total_verifications.write(
            storage.total_verifications.read() + 1
        );
    }

    // INDIVIDUAL VERIFICATION CHECKERS
    
    #[public]
    fn is_twitter_verified(profile_id: Field) -> bool {
        storage.twitter_verified.at(profile_id).read()
    }

    #[public]
    fn is_discord_verified(profile_id: Field) -> bool {
        storage.discord_verified.at(profile_id).read()
    }

    #[public]
    fn is_telegram_verified(profile_id: Field) -> bool {
        storage.telegram_verified.at(profile_id).read()
    }

    #[public]
    fn is_github_verified(profile_id: Field) -> bool {
        storage.github_verified.at(profile_id).read()
    }

    #[public]
    fn is_farcaster_verified(profile_id: Field) -> bool {
        storage.farcaster_verified.at(profile_id).read()
    }

    #[public]
    fn is_email_verified(profile_id: Field) -> bool {
        storage.email_verified.at(profile_id).read()
    }

    // GET ALL VERIFICATIONS FOR A PROFILE
    
    #[public]
    fn get_profile_verifications(profile_id: Field) -> [bool; 6] {
        [
            storage.twitter_verified.at(profile_id).read(),
            storage.discord_verified.at(profile_id).read(),
            storage.telegram_verified.at(profile_id).read(),
            storage.github_verified.at(profile_id).read(),
            storage.farcaster_verified.at(profile_id).read(),
            storage.email_verified.at(profile_id).read()
        ]
    }

    #[public]
    fn get_profile_verification_count(profile_id: Field) -> Field {
        storage.verification_count.at(profile_id).read()
    }

    // GLOBAL VIEW FUNCTIONS
    
    #[public]
    fn get_total_verifications() -> Field {
        storage.total_verifications.read()
    }

    #[public]
    fn get_all_global_counts() -> [Field; 6] {
        [
            storage.total_twitter_verifications.read(),
            storage.total_discord_verifications.read(),
            storage.total_telegram_verifications.read(),
            storage.total_github_verifications.read(),
            storage.total_farcaster_verifications.read(),
            storage.total_email_verifications.read()
        ]
    }

    #[public]
    fn get_admin() -> AztecAddress {
        storage.admin.read()
    }

    #[public]
    fn get_oracle() -> AztecAddress {
        storage.oracle.read()
    }

    #[public]
    fn get_profile_registry() -> AztecAddress {
        storage.profile_registry.read()
    }

    // NEW: Check if admin is initialized
    #[public]
    fn is_admin_initialized() -> bool {
        storage.admin_initialized.read()
    }
}
