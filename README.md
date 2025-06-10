Aztlan Alpha Testnet Contracts :

ProfileRegistry : 0x2dc4889b4091dc91d37f103128ab68b17f0b37533bbe66ba4f69f32781b23468
PrivateSocials : 0x208719c6c69469c79fd098b79534f0218b1628e3bbbaffbedad7f52d57b2d154

Aztlan Compiled Contracts .json  :
https://github.com/0xrzls/aztlan/blob/master/AztlanProfileRegistry.json
https://github.com/0xrzls/aztlan/blob/master/AztlanPrivateSocial.json

Aztlan Contracts Code : 

https://github.com/0xrzls/aztlan/blob/master/contracts/AztlanProfileRegistry.nr
https://github.com/0xrzls/aztlan/blob/master/contracts/AztlanPrivateSocial.nr

# Aztlan Quest Frontend - Aztec Network Integration

Gateway to the Aztec Network Ecosystem - Privacy-first Web3 application built on Aztec Protocol.

## 🌟 Features

- **Real Aztec Integration**: Live connection to Aztec Alpha Testnet
- **Privacy-First Profiles**: Zero-knowledge profile creation on blockchain  
- **Sponsored Transactions**: Fee-less onboarding for new users
- **Background Processing**: Real-time progress for 2-5 minute operations
- **Mock/Real Mode**: Development mode with instant fallback
- **Enhanced UX**: Comprehensive error handling & notifications

## 🏗️ Tech Stack

- **Frontend**: React 18 + Zustand + Tailwind CSS
- **Blockchain**: Aztec.js 0.87.7 + PXE Integration
- **Network**: Aztec Alpha Testnet
- **Contracts**: ProfileRegistry + PrivateSocials (deployed)

## 🚀 Quick Start

```bash
# Clone & install
git clone [repo-url]
cd aztlan-frontend
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development
npm start
```

## 🔧 Configuration

Key environment variables:
```bash
REACT_APP_PXE_URL=https://aztec-alpha-testnet-fullnode.zkv.xyz
REACT_APP_PROFILE_REGISTRY_ADDRESS=0x2dc4889b4091dc91d37f103128ab68b17f0b37533bbe66ba4f69f32781b23468
REACT_APP_SPONSORED_FPC_ADDRESS=0x0b27e30667202907fc700d50e9bc816be42f8141fae8b9f2281873dbdb9fc2e5
```

## 🎮 Development Mode

- **Real Mode**: Connects to live Aztec testnet (default)
- **Mock Mode**: Fast local simulation for testing
- **Auto-Fallback**: Switches to mock if real connection fails

Toggle with: `localStorage.setItem('aztec_use_mock', 'true')`

## 📱 Current Status

- ✅ Core integration implemented
- ✅ UI/UX components complete  
- 🔄 Debugging initialization process
- 🔄 Optimizing testnet connection

## 🐛 Known Issues

- App may hang on "Initializing Aztlan" (working on fix)
- Real testnet connection can be slow (36s+ block times)
- WebAssembly loading may timeout on some browsers

## 🤝 Contributing

See issues tab for current debugging needs.
