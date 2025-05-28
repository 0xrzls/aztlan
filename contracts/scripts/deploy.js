// contracts/scripts/deploy.js
const { AztecAddress, createPXEClient, getDeployedTestAccountsWallets } = require('@aztec/aztec.js');
const { AztlanProfileContract } = require('../aztlan_profile/target/aztlan_profile.json');

async function deployContract() {
  // Connect to sandbox or testnet
  const pxe = createPXEClient(process.env.PXE_URL || 'http://localhost:8080');
  
  // Get accounts
  const accounts = await getDeployedTestAccountsWallets(pxe);
  const deployer = accounts[0];
  
  console.log('Deploying AztlanProfile contract...');
  
  // Deploy contract
  const contract = await AztlanProfileContract.deploy(
    deployer,
    deployer.getAddress() // owner
  )
    .send()
    .deployed();
  
  console.log('Contract deployed at:', contract.address.toString());
  console.log('Add this to your .env file:');
  console.log(`REACT_APP_PROFILE_CONTRACT_ADDRESS=${contract.address.toString()}`);
  
  return contract;
}

// Run deployment
deployContract()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Deployment failed:', err);
    process.exit(1);
  });
