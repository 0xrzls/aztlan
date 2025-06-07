Aztlan Alpha Testnet Contracts :

ProfileRegistry : 0x2dc4889b4091dc91d37f103128ab68b17f0b37533bbe66ba4f69f32781b23468
PrivateSocials : 0x208719c6c69469c79fd098b79534f0218b1628e3bbbaffbedad7f52d57b2d154

Aztlan Compiled Contracts .json  :
https://github.com/0xrzls/aztlan/blob/master/AztlanProfileRegistry.json
https://github.com/0xrzls/aztlan/blob/master/AztlanPrivateSocial.json

Aztlan Contracts Code : 

https://github.com/0xrzls/aztlan/blob/master/contracts/AztlanProfileRegistry.nr
https://github.com/0xrzls/aztlan/blob/master/contracts/AztlanPrivateSocial.nr



# 🎯 AZTLAN PROFILE MINTER DAPP - FRONTEND GUIDE

## 🌟 DAPP CONCEPT: Decentralized Identity Profile Minter

**Aztlan** adalah platform untuk mint **Soulbound Identity Profiles** dengan sistem verifikasi sosial media yang privacy-focused.

---

## 🎨 MAIN FEATURES & UI FLOWS

### 🔐 1. PROFILE MINTING SYSTEM

**Tujuan**: User dapat mint soulbound profile NFT yang unik dan tidak dapat ditransfer

```javascript
// Profile Creation Flow
const ProfileMinter = () => {
    const [step, setStep] = useState(1);
    const [profileData, setProfileData] = useState({
        username: '',
        bio: '',
        avatar: null,
        visibility: 'public' // public, private, friends
    });

    // Step 1: Check username availability
    const checkUsername = async (username) => {
        const usernameHash = hashString(username);
        const available = await contract.is_username_available(usernameHash);
        return available;
    };

    // Step 2: Mint profile NFT
    const mintProfile = async () => {
        // Upload metadata to IPFS
        const metadata = {
            name: profileData.username,
            description: profileData.bio,
            image: profileData.avatar,
            attributes: [
                { trait_type: "Profile Type", value: "Soulbound" },
                { trait_type: "Created", value: Date.now() }
            ]
        };
        
        const tokenURI = await uploadToIPFS(metadata);
        const usernameHash = hashString(profileData.username);
        const tokenURIHash = hashString(tokenURI);
        
        // Mint on blockchain
        await registryContract.create_profile(usernameHash, tokenURIHash);
    };
};
```

### 🏆 2. VERIFICATION BADGES SYSTEM

**Tujuan**: User dapat verify social media accounts untuk mendapat badges

```javascript
// Verification Center Component
const VerificationCenter = ({ profileId }) => {
    const platforms = [
        { name: 'Twitter', icon: '🐦', verified: false },
        { name: 'Discord', icon: '💬', verified: false },
        { name: 'Telegram', icon: '📱', verified: false },
        { name: 'GitHub', icon: '🐙', verified: false },
        { name: 'Farcaster', icon: '🟣', verified: false },
        { name: 'Email', icon: '📧', verified: false }
    ];

    // Twitter Verification Flow
    const verifyTwitter = async (twitterHandle) => {
        // Step 1: Generate verification code
        const handleHash = hashString(twitterHandle);
        const verificationCode = await socialContract.prepare_twitter_verification(
            profileId, 
            handleHash
        );
        
        // Step 2: Show tweet prompt
        const tweetText = `Verifying my Aztlan profile: ${verificationCode}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`);
        
        // Step 3: User submits tweet URL
        const tweetURL = await promptTweetURL();
        
        // Step 4: Oracle verification (backend)
        const verified = await verifyWithOracle({
            platform: 'twitter',
            handle: twitterHandle,
            tweetURL: tweetURL,
            verificationCode: verificationCode
        });
        
        // Step 5: Complete on-chain if verified
        if (verified) {
            await socialContract.complete_twitter_verification(profileId, verificationCode);
        }
    };
};
```

### 📊 3. PROFILE DASHBOARD

**Tujuan**: Central hub untuk manage profile dan view stats

```javascript
// Profile Dashboard
const ProfileDashboard = ({ userAddress }) => {
    const [profileData, setProfileData] = useState(null);
    
    useEffect(() => {
        loadProfileData();
    }, [userAddress]);
    
    const loadProfileData = async () => {
        // Get profile info
        const profileId = await registryContract.get_profile_id(userAddress);
        const tokenURI = await registryContract.get_token_uri(userAddress);
        const visibility = await registryContract.get_profile_visibility(userAddress);
        
        // Get verification status
        const verifications = await socialContract.get_profile_verifications(profileId);
        const verificationCount = await socialContract.get_profile_verification_count(profileId);
        
        // Parse metadata from IPFS
        const metadata = await fetchFromIPFS(tokenURI);
        
        setProfileData({
            profileId,
            username: metadata.name,
            bio: metadata.description,
            avatar: metadata.image,
            visibility,
            verifications: {
                twitter: verifications[0],
                discord: verifications[1],
                telegram: verifications[2],
                github: verifications[3],
                farcaster: verifications[4],
                email: verifications[5]
            },
            totalVerifications: verificationCount
        });
    };
    
    return (
        <div className="profile-dashboard">
            <ProfileCard profile={profileData} />
            <VerificationBadges verifications={profileData?.verifications} />
            <ProfileStats stats={profileData} />
            <ProfileSettings profileId={profileData?.profileId} />
        </div>
    );
};
```

---

## 🎭 UI COMPONENTS ARCHITECTURE

### 🏠 1. LANDING PAGE

```javascript
// Hero Section dengan call-to-action
const LandingPage = () => (
    <div>
        <Hero 
            title="Mint Your Decentralized Identity"
            subtitle="Create soulbound profiles with verified social credentials"
            cta="Start Minting"
        />
        <Features />
        <GlobalStats /> {/* Total profiles, verifications */}
        <HowItWorks />
    </div>
);
```

### 🎨 2. PROFILE CREATION WIZARD

```javascript
// Multi-step profile creation
const ProfileWizard = () => {
    const steps = [
        { title: "Choose Username", component: <UsernameStep /> },
        { title: "Profile Details", component: <ProfileDetailsStep /> },
        { title: "Privacy Settings", component: <PrivacyStep /> },
        { title: "Mint Profile", component: <MintStep /> }
    ];
    
    return <StepWizard steps={steps} />;
};
```

### 🏆 3. VERIFICATION HUB

```javascript
// Platform verification interface
const VerificationHub = ({ profileId }) => (
    <div className="verification-hub">
        <VerificationProgress />
        <PlatformGrid platforms={socialPlatforms} />
        <VerificationHistory />
        <RewardsSection /> {/* Show badges/rewards */}
    </div>
);
```

### 📱 4. PROFILE EXPLORER

```javascript
// Browse all public profiles
const ProfileExplorer = () => {
    const [profiles, setProfiles] = useState([]);
    const [filters, setFilters] = useState({
        verificationLevel: 'all', // 0, 1-2, 3-4, 5-6
        sortBy: 'recent' // recent, verified, popular
    });
    
    // Load public profiles
    const loadProfiles = async () => {
        const totalProfiles = await registryContract.get_total_profiles();
        // Implement pagination and filtering
    };
    
    return (
        <div>
            <SearchBar />
            <FilterControls filters={filters} onChange={setFilters} />
            <ProfileGrid profiles={profiles} />
            <Pagination />
        </div>
    );
};
```

---

## 🔧 KEY FRONTEND FEATURES

### 💎 1. SOULBOUND NFT VISUALIZATION

```javascript
// Profile NFT Card Component
const ProfileNFTCard = ({ profile }) => (
    <div className="nft-card soulbound">
        <div className="soulbound-badge">🔒 Soulbound</div>
        <img src={profile.avatar} alt={profile.username} />
        <h3>@{profile.username}</h3>
        <p>{profile.bio}</p>
        <VerificationBadges badges={profile.verifications} />
        <div className="profile-stats">
            <stat>ID: #{profile.profileId}</stat>
            <stat>Verifications: {profile.totalVerifications}/6</stat>
        </div>
    </div>
);
```

### 🎯 2. VERIFICATION PROGRESS TRACKER

```javascript
// Visual progress for verifications
const VerificationProgress = ({ verifications }) => {
    const completed = Object.values(verifications).filter(Boolean).length;
    const total = 6;
    const percentage = (completed / total) * 100;
    
    return (
        <div className="verification-progress">
            <CircularProgress value={percentage} />
            <span>{completed}/{total} Platforms Verified</span>
            <RewardTier level={getRewardTier(completed)} />
        </div>
    );
};
```

### 🔐 3. PRIVACY CONTROLS

```javascript
// Privacy settings interface
const PrivacyControls = ({ profileId }) => {
    const [visibility, setVisibility] = useState('public');
    const [blockedUsers, setBlockedUsers] = useState([]);
    
    const updateVisibility = async (newVisibility) => {
        const visibilityCode = {
            'private': 0,
            'public': 1,
            'friends': 2
        }[newVisibility];
        
        await registryContract.set_profile_visibility(visibilityCode);
        setVisibility(newVisibility);
    };
    
    return (
        <div className="privacy-controls">
            <VisibilitySelector value={visibility} onChange={updateVisibility} />
            <BlockedUsersList users={blockedUsers} />
            <ProfileRecovery />
        </div>
    );
};
```

---

## 🎪 GAMIFICATION FEATURES

### 🏅 1. ACHIEVEMENT SYSTEM

```javascript
// Achievements based on verifications
const achievements = {
    'first_verification': 'First Step',
    'social_butterfly': '3+ Platforms',
    'verification_master': 'All 6 Platforms',
    'early_adopter': 'First 100 Users'
};

const AchievementDisplay = ({ profileData }) => {
    const earned = calculateAchievements(profileData);
    return (
        <div className="achievements">
            {earned.map(achievement => (
                <Badge key={achievement} achievement={achievement} />
            ))}
        </div>
    );
};
```

### 📈 2. LEADERBOARD

```javascript
// Global verification leaderboard
const Leaderboard = () => {
    const [topProfiles, setTopProfiles] = useState([]);
    
    // Load top verified profiles
    useEffect(() => {
        loadTopVerifiedProfiles();
    }, []);
    
    return (
        <div className="leaderboard">
            <h2>Top Verified Profiles</h2>
            {topProfiles.map((profile, index) => (
                <LeaderboardItem 
                    key={profile.id}
                    rank={index + 1}
                    profile={profile}
                />
            ))}
        </div>
    );
};
```

---

## 🔮 ADVANCED FEATURES

### 🎭 1. PROFILE THEMES & CUSTOMIZATION

```javascript
// Customizable profile themes
const ProfileThemes = ({ profileId }) => {
    const themes = [
        'cyberpunk', 'minimal', 'neon', 'classic', 'dark'
    ];
    
    return (
        <div className="theme-selector">
            {themes.map(theme => (
                <ThemePreview 
                    key={theme}
                    theme={theme}
                    onSelect={() => updateTheme(theme)}
                />
            ))}
        </div>
    );
};
```

### 🔄 2. PROFILE RECOVERY INTERFACE

```javascript
// Account recovery for lost keys
const ProfileRecovery = ({ profileId }) => {
    const [recoveryAddress, setRecoveryAddress] = useState('');
    
    const setupRecovery = async () => {
        await registryContract.set_recovery_address(recoveryAddress);
    };
    
    const initiateRecovery = async (lostAddress) => {
        await registryContract.initiate_recovery(lostAddress);
    };
    
    return (
        <div className="recovery-setup">
            <h3>Setup Recovery Address</h3>
            <AddressInput 
                value={recoveryAddress}
                onChange={setRecoveryAddress}
            />
            <Button onClick={setupRecovery}>Set Recovery</Button>
        </div>
    );
};
```

---

## 🎯 USER JOURNEY SUMMARY

1. **🔗 Connect Wallet** → User connects Web3 wallet
2. **✨ Mint Profile** → Create soulbound profile NFT
3. **🏆 Verify Socials** → Connect & verify social media accounts
4. **🎨 Customize** → Set themes, privacy, recovery
5. **📊 Explore** → Browse other profiles, leaderboards
6. **🔄 Manage** → Update profile, manage verifications

**Result**: Users have verifiable, soulbound digital identity with privacy controls and social proof!



**🚀 AZTLAN PROFILE MINTER DAPP - FRONTEND FLOW GUIDE!**

# 🎯 AZTLAN PROFILE MINTER DAPP - FRONTEND GUIDE

## 🌟 DAPP CONCEPT: Decentralized Identity Profile Minter

**Aztlan** adalah platform untuk mint **Soulbound Identity Profiles** dengan sistem verifikasi sosial media yang privacy-focused.

---

## 🎨 MAIN FEATURES & UI FLOWS

### 🔐 1. PROFILE MINTING SYSTEM

**Tujuan**: User dapat mint soulbound profile NFT yang unik dan tidak dapat ditransfer

```javascript
// Profile Creation Flow
const ProfileMinter = () => {
    const [step, setStep] = useState(1);
    const [profileData, setProfileData] = useState({
        username: '',
        bio: '',
        avatar: null,
        visibility: 'public' // public, private, friends
    });

    // Step 1: Check username availability
    const checkUsername = async (username) => {
        const usernameHash = hashString(username);
        const available = await contract.is_username_available(usernameHash);
        return available;
    };

    // Step 2: Mint profile NFT
    const mintProfile = async () => {
        // Upload metadata to IPFS
        const metadata = {
            name: profileData.username,
            description: profileData.bio,
            image: profileData.avatar,
            attributes: [
                { trait_type: "Profile Type", value: "Soulbound" },
                { trait_type: "Created", value: Date.now() }
            ]
        };
        
        const tokenURI = await uploadToIPFS(metadata);
        const usernameHash = hashString(profileData.username);
        const tokenURIHash = hashString(tokenURI);
        
        // Mint on blockchain
        await registryContract.create_profile(usernameHash, tokenURIHash);
    };
};
```

### 🏆 2. VERIFICATION BADGES SYSTEM

**Tujuan**: User dapat verify social media accounts untuk mendapat badges

```javascript
// Verification Center Component
const VerificationCenter = ({ profileId }) => {
    const platforms = [
        { name: 'Twitter', icon: '🐦', verified: false },
        { name: 'Discord', icon: '💬', verified: false },
        { name: 'Telegram', icon: '📱', verified: false },
        { name: 'GitHub', icon: '🐙', verified: false },
        { name: 'Farcaster', icon: '🟣', verified: false },
        { name: 'Email', icon: '📧', verified: false }
    ];

    // Twitter Verification Flow
    const verifyTwitter = async (twitterHandle) => {
        // Step 1: Generate verification code
        const handleHash = hashString(twitterHandle);
        const verificationCode = await socialContract.prepare_twitter_verification(
            profileId, 
            handleHash
        );
        
        // Step 2: Show tweet prompt
        const tweetText = `Verifying my Aztlan profile: ${verificationCode}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`);
        
        // Step 3: User submits tweet URL
        const tweetURL = await promptTweetURL();
        
        // Step 4: Oracle verification (backend)
        const verified = await verifyWithOracle({
            platform: 'twitter',
            handle: twitterHandle,
            tweetURL: tweetURL,
            verificationCode: verificationCode
        });
        
        // Step 5: Complete on-chain if verified
        if (verified) {
            await socialContract.complete_twitter_verification(profileId, verificationCode);
        }
    };
};
```

### 📊 3. PROFILE DASHBOARD

**Tujuan**: Central hub untuk manage profile dan view stats

```javascript
// Profile Dashboard
const ProfileDashboard = ({ userAddress }) => {
    const [profileData, setProfileData] = useState(null);
    
    useEffect(() => {
        loadProfileData();
    }, [userAddress]);
    
    const loadProfileData = async () => {
        // Get profile info
        const profileId = await registryContract.get_profile_id(userAddress);
        const tokenURI = await registryContract.get_token_uri(userAddress);
        const visibility = await registryContract.get_profile_visibility(userAddress);
        
        // Get verification status
        const verifications = await socialContract.get_profile_verifications(profileId);
        const verificationCount = await socialContract.get_profile_verification_count(profileId);
        
        // Parse metadata from IPFS
        const metadata = await fetchFromIPFS(tokenURI);
        
        setProfileData({
            profileId,
            username: metadata.name,
            bio: metadata.description,
            avatar: metadata.image,
            visibility,
            verifications: {
                twitter: verifications[0],
                discord: verifications[1],
                telegram: verifications[2],
                github: verifications[3],
                farcaster: verifications[4],
                email: verifications[5]
            },
            totalVerifications: verificationCount
        });
    };
    
    return (
        <div className="profile-dashboard">
            <ProfileCard profile={profileData} />
            <VerificationBadges verifications={profileData?.verifications} />
            <ProfileStats stats={profileData} />
            <ProfileSettings profileId={profileData?.profileId} />
        </div>
    );
};
```

---

## 🎭 UI COMPONENTS ARCHITECTURE

### 🏠 1. LANDING PAGE

```javascript
// Hero Section dengan call-to-action
const LandingPage = () => (
    <div>
        <Hero 
            title="Mint Your Decentralized Identity"
            subtitle="Create soulbound profiles with verified social credentials"
            cta="Start Minting"
        />
        <Features />
        <GlobalStats /> {/* Total profiles, verifications */}
        <HowItWorks />
    </div>
);
```

### 🎨 2. PROFILE CREATION WIZARD

```javascript
// Multi-step profile creation
const ProfileWizard = () => {
    const steps = [
        { title: "Choose Username", component: <UsernameStep /> },
        { title: "Profile Details", component: <ProfileDetailsStep /> },
        { title: "Privacy Settings", component: <PrivacyStep /> },
        { title: "Mint Profile", component: <MintStep /> }
    ];
    
    return <StepWizard steps={steps} />;
};
```

### 🏆 3. VERIFICATION HUB

```javascript
// Platform verification interface
const VerificationHub = ({ profileId }) => (
    <div className="verification-hub">
        <VerificationProgress />
        <PlatformGrid platforms={socialPlatforms} />
        <VerificationHistory />
        <RewardsSection /> {/* Show badges/rewards */}
    </div>
);
```

### 📱 4. PROFILE EXPLORER

```javascript
// Browse all public profiles
const ProfileExplorer = () => {
    const [profiles, setProfiles] = useState([]);
    const [filters, setFilters] = useState({
        verificationLevel: 'all', // 0, 1-2, 3-4, 5-6
        sortBy: 'recent' // recent, verified, popular
    });
    
    // Load public profiles
    const loadProfiles = async () => {
        const totalProfiles = await registryContract.get_total_profiles();
        // Implement pagination and filtering
    };
    
    return (
        <div>
            <SearchBar />
            <FilterControls filters={filters} onChange={setFilters} />
            <ProfileGrid profiles={profiles} />
            <Pagination />
        </div>
    );
};
```

---

## 🔧 KEY FRONTEND FEATURES

### 💎 1. SOULBOUND NFT VISUALIZATION

```javascript
// Profile NFT Card Component
const ProfileNFTCard = ({ profile }) => (
    <div className="nft-card soulbound">
        <div className="soulbound-badge">🔒 Soulbound</div>
        <img src={profile.avatar} alt={profile.username} />
        <h3>@{profile.username}</h3>
        <p>{profile.bio}</p>
        <VerificationBadges badges={profile.verifications} />
        <div className="profile-stats">
            <stat>ID: #{profile.profileId}</stat>
            <stat>Verifications: {profile.totalVerifications}/6</stat>
        </div>
    </div>
);
```

### 🎯 2. VERIFICATION PROGRESS TRACKER

```javascript
// Visual progress for verifications
const VerificationProgress = ({ verifications }) => {
    const completed = Object.values(verifications).filter(Boolean).length;
    const total = 6;
    const percentage = (completed / total) * 100;
    
    return (
        <div className="verification-progress">
            <CircularProgress value={percentage} />
            <span>{completed}/{total} Platforms Verified</span>
            <RewardTier level={getRewardTier(completed)} />
        </div>
    );
};
```

### 🔐 3. PRIVACY CONTROLS

```javascript
// Privacy settings interface
const PrivacyControls = ({ profileId }) => {
    const [visibility, setVisibility] = useState('public');
    const [blockedUsers, setBlockedUsers] = useState([]);
    
    const updateVisibility = async (newVisibility) => {
        const visibilityCode = {
            'private': 0,
            'public': 1,
            'friends': 2
        }[newVisibility];
        
        await registryContract.set_profile_visibility(visibilityCode);
        setVisibility(newVisibility);
    };
    
    return (
        <div className="privacy-controls">
            <VisibilitySelector value={visibility} onChange={updateVisibility} />
            <BlockedUsersList users={blockedUsers} />
            <ProfileRecovery />
        </div>
    );
};
```

---

## 🎪 GAMIFICATION FEATURES

### 🏅 1. ACHIEVEMENT SYSTEM

```javascript
// Achievements based on verifications
const achievements = {
    'first_verification': 'First Step',
    'social_butterfly': '3+ Platforms',
    'verification_master': 'All 6 Platforms',
    'early_adopter': 'First 100 Users'
};

const AchievementDisplay = ({ profileData }) => {
    const earned = calculateAchievements(profileData);
    return (
        <div className="achievements">
            {earned.map(achievement => (
                <Badge key={achievement} achievement={achievement} />
            ))}
        </div>
    );
};
```

### 📈 2. LEADERBOARD

```javascript
// Global verification leaderboard
const Leaderboard = () => {
    const [topProfiles, setTopProfiles] = useState([]);
    
    // Load top verified profiles
    useEffect(() => {
        loadTopVerifiedProfiles();
    }, []);
    
    return (
        <div className="leaderboard">
            <h2>Top Verified Profiles</h2>
            {topProfiles.map((profile, index) => (
                <LeaderboardItem 
                    key={profile.id}
                    rank={index + 1}
                    profile={profile}
                />
            ))}
        </div>
    );
};
```

---

## 🔮 ADVANCED FEATURES

### 🎭 1. PROFILE THEMES & CUSTOMIZATION

```javascript
// Customizable profile themes
const ProfileThemes = ({ profileId }) => {
    const themes = [
        'cyberpunk', 'minimal', 'neon', 'classic', 'dark'
    ];
    
    return (
        <div className="theme-selector">
            {themes.map(theme => (
                <ThemePreview 
                    key={theme}
                    theme={theme}
                    onSelect={() => updateTheme(theme)}
                />
            ))}
        </div>
    );
};
```

### 🔄 2. PROFILE RECOVERY INTERFACE

```javascript
// Account recovery for lost keys
const ProfileRecovery = ({ profileId }) => {
    const [recoveryAddress, setRecoveryAddress] = useState('');
    
    const setupRecovery = async () => {
        await registryContract.set_recovery_address(recoveryAddress);
    };
    
    const initiateRecovery = async (lostAddress) => {
        await registryContract.initiate_recovery(lostAddress);
    };
    
    return (
        <div className="recovery-setup">
            <h3>Setup Recovery Address</h3>
            <AddressInput 
                value={recoveryAddress}
                onChange={setRecoveryAddress}
            />
            <Button onClick={setupRecovery}>Set Recovery</Button>
        </div>
    );
};
```

---

## 🎯 USER JOURNEY SUMMARY

1. **🔗 Connect Wallet** → User connects Web3 wallet
2. **✨ Mint Profile** → Create soulbound profile NFT
3. **🏆 Verify Socials** → Connect & verify social media accounts
4. **🎨 Customize** → Set themes, privacy, recovery
5. **📊 Explore** → Browse other profiles, leaderboards
6. **🔄 Manage** → Update profile, manage verifications

**Result**: Users have verifiable, soulbound digital identity with privacy controls and social proof!

## **🎯 CORE DAPP CONCEPT SUMMARY:**

### **🔥 AZTLAN = "Soulbound Identity Minter with Social Proof"**

**Think of it as:**
- 🎭 **Profile NFT Minter** (tapi soulbound, ga bisa dijual)
- 🏆 **Social Verification Hub** (connect & verify Twitter, Discord, etc)
- 🔐 **Privacy-First Identity** (users control visibility)
- 🎮 **Gamified Experience** (badges, achievements, leaderboards)

---

## **💡 KEY DIFFERENTIATORS:**

### **🔒 SOULBOUND APPROACH:**
- Profile NFT **tied to wallet address**
- **Cannot be transferred or sold**
- **Right to be forgotten** (burn function)
- **Recovery system** for lost keys

### **🏆 VERIFICATION SYSTEM:**
- **6 platforms**: Twitter, Discord, Telegram, GitHub, Farcaster, Email
- **Privacy-preserving** (hashed handles)
- **Oracle-based verification**
- **Progressive rewards** (more verifications = higher status)

### **🎨 UI/UX FOCUS:**
- **Clean profile cards** with verification badges
- **Step-by-step wizard** for profile creation
- **Real-time verification progress**
- **Social discovery** (browse verified profiles)

---

## **🚀 MAIN VALUE PROPOSITION:**

**"Create your permanent, verified digital identity that you own and control - connect your social accounts privately while building reputation through verification badges."**

**Perfect for communities, DAOs, and platforms that need verified but privacy-preserving user identities!** 🎯
