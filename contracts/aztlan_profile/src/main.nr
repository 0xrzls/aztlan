use dep::aztec::macros::aztec;

// CONTRACT 2: MULTI-PLATFORM PRIVATE SOCIAL VERIFIER
// Supports: Twitter, Discord, Telegram, GitHub, Farcaster, Email
#[aztec]
pub contract AztlanPrivateSocial {
    use dep::aztec::macros::{functions::{public, private}, storage::storage};
    use dep::aztec::prelude::{AztecAddress, PublicMutable};
    use dep::aztec::protocol_types::traits::FromField;
    
    #[storage]
    struct Storage<Context> {
        // Contract references
        profile_registry: PublicMutable<AztecAddress, Context>,
        oracle: PublicMutable<AztecAddress, Context>,
        
        // Verification counters for each platform
        twitter_verification_count: PublicMutable<Field, Context>,
        discord_verification_count: PublicMutable<Field, Context>,
        telegram_verification_count: PublicMutable<Field, Context>,
        github_verification_count: PublicMutable<Field, Context>,
        farcaster_verification_count: PublicMutable<Field, Context>,
        email_verification_count: PublicMutable<Field, Context>,
        
        // Total verifications across all platforms
        total_verifications: PublicMutable<Field, Context>,
    }

    #[public]
    fn constructor(oracle: AztecAddress) {
        // HARDCODED YOUR REGISTRY ADDRESS!
        storage.profile_registry.write(
            AztecAddress::from_field(0x2ec8bbff14a6b5347b3db46dcd1544abf99e9546839a740b9e37b648bc5e176f)
        );
        storage.oracle.write(oracle);
        storage.twitter_verification_count.write(0);
        storage.discord_verification_count.write(0);
        storage.telegram_verification_count.write(0);
        storage.github_verification_count.write(0);
        storage.farcaster_verification_count.write(0);
        storage.email_verification_count.write(0);
        storage.total_verifications.write(0);
    }

    // PRIVATE FUNCTIONS - Process data privately on user's device
    
    #[private]
    fn prepare_twitter_verification(
        profile_id: Field,
        handle_hash: Field
    ) -> Field {
        // Private computation - Twitter uses base offset 1000000
        let verification_hash = handle_hash + profile_id + 1000000;
        verification_hash
    }

    #[private]
    fn prepare_discord_verification(
        profile_id: Field,
        handle_hash: Field  
    ) -> Field {
        // Discord uses base offset 2000000
        let verification_hash = handle_hash + profile_id + 2000000;
        verification_hash
    }

    #[private]
    fn prepare_telegram_verification(
        profile_id: Field,
        handle_hash: Field
    ) -> Field {
        // Telegram uses base offset 3000000
        let verification_hash = handle_hash + profile_id + 3000000;
        verification_hash
    }

    #[private]
    fn prepare_github_verification(
        profile_id: Field,
        handle_hash: Field
    ) -> Field {
        // GitHub uses base offset 4000000
        let verification_hash = handle_hash + profile_id + 4000000;
        verification_hash
    }

    #[private]
    fn prepare_farcaster_verification(
        profile_id: Field,
        handle_hash: Field
    ) -> Field {
        // Farcaster uses base offset 5000000
        let verification_hash = handle_hash + profile_id + 5000000;
        verification_hash
    }

    #[private]
    fn prepare_email_verification(
        profile_id: Field,
        email_hash: Field
    ) -> Field {
        // Email uses base offset 6000000
        let verification_hash = email_hash + profile_id + 6000000;
        verification_hash
    }

    // PUBLIC FUNCTIONS - Store verification results
    
    #[public]
    fn complete_twitter_verification(
        _verification_hash: Field
    ) {
        let caller = context.msg_sender();
        assert(caller == storage.oracle.read(), "Only oracle");
        
        let count = storage.twitter_verification_count.read();
        storage.twitter_verification_count.write(count + 1);
        
        let total = storage.total_verifications.read();
        storage.total_verifications.write(total + 1);
    }

    #[public]
    fn complete_discord_verification(
        _verification_hash: Field
    ) {
        let caller = context.msg_sender();
        assert(caller == storage.oracle.read(), "Only oracle");
        
        let count = storage.discord_verification_count.read();
        storage.discord_verification_count.write(count + 1);
        
        let total = storage.total_verifications.read();
        storage.total_verifications.write(total + 1);
    }

    #[public]
    fn complete_telegram_verification(
        _verification_hash: Field
    ) {
        let caller = context.msg_sender();
        assert(caller == storage.oracle.read(), "Only oracle");
        
        let count = storage.telegram_verification_count.read();
        storage.telegram_verification_count.write(count + 1);
        
        let total = storage.total_verifications.read();
        storage.total_verifications.write(total + 1);
    }

    #[public]
    fn complete_github_verification(
        _verification_hash: Field
    ) {
        let caller = context.msg_sender();
        assert(caller == storage.oracle.read(), "Only oracle");
        
        let count = storage.github_verification_count.read();
        storage.github_verification_count.write(count + 1);
        
        let total = storage.total_verifications.read();
        storage.total_verifications.write(total + 1);
    }

    #[public]
    fn complete_farcaster_verification(
        _verification_hash: Field
    ) {
        let caller = context.msg_sender();
        assert(caller == storage.oracle.read(), "Only oracle");
        
        let count = storage.farcaster_verification_count.read();
        storage.farcaster_verification_count.write(count + 1);
        
        let total = storage.total_verifications.read();
        storage.total_verifications.write(total + 1);
    }

    #[public]
    fn complete_email_verification(
        _verification_hash: Field
    ) {
        let caller = context.msg_sender();
        assert(caller == storage.oracle.read(), "Only oracle");
        
        let count = storage.email_verification_count.read();
        storage.email_verification_count.write(count + 1);
        
        let total = storage.total_verifications.read();
        storage.total_verifications.write(total + 1);
    }

    // VIEW FUNCTIONS - Get verification stats
    
    #[public]
    fn get_twitter_verification_count() -> Field {
        storage.twitter_verification_count.read()
    }

    #[public]
    fn get_discord_verification_count() -> Field {
        storage.discord_verification_count.read()
    }

    #[public]
    fn get_telegram_verification_count() -> Field {
        storage.telegram_verification_count.read()
    }

    #[public]
    fn get_github_verification_count() -> Field {
        storage.github_verification_count.read()
    }

    #[public]
    fn get_farcaster_verification_count() -> Field {
        storage.farcaster_verification_count.read()
    }

    #[public]
    fn get_email_verification_count() -> Field {
        storage.email_verification_count.read()
    }

    #[public]
    fn get_total_verifications() -> Field {
        storage.total_verifications.read()
    }

    #[public]
    fn get_all_verification_counts() -> [Field; 6] {
        [
            storage.twitter_verification_count.read(),
            storage.discord_verification_count.read(),
            storage.telegram_verification_count.read(),
            storage.github_verification_count.read(),
            storage.farcaster_verification_count.read(),
            storage.email_verification_count.read()
        ]
    }

    #[public]
    fn get_oracle() -> AztecAddress {
        storage.oracle.read()
    }

    #[public]
    fn get_profile_registry() -> AztecAddress {
        storage.profile_registry.read()
    }
}
