// src/App.tsx
import React, { useState } from 'react';
import { MintProfile } from './components/MintProfile';
import { useProfile } from './hooks/useProfile';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'mint' | 'profile' | 'verify'>('mint');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const { 
    wallet, 
    profile, 
    localProfileData, 
    socialVerification,
    disconnectWallet,
    hasProfile 
  } = useProfile();

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleMintSuccess = (profileId: string) => {
    showNotification('success', `Profile minted successfully! ID: ${profileId}`);
    setActiveTab('profile');
  };

  const handleMintError = (error: string) => {
    showNotification('error', error);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                🌟 Aztlan Profile
              </h1>
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Aztec Alpha
              </span>
            </div>
            
            {wallet.isConnected && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                </div>
                <button
                  onClick={disconnectWallet}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        } border rounded-lg p-4 shadow-lg`}>
          <div className="flex items-start">
            <div className="text-lg mr-2">
              {notification.type === 'success' ? '✅' : '❌'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {wallet.isConnected && (
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('mint')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'mint'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mint Profile
              </button>
              
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Profile
              </button>
              
              <button
                onClick={() => setActiveTab('verify')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'verify'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Social Verification
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {!wallet.isConnected ? (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Aztlan Profile
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Create your decentralized identity on Aztec blockchain
            </p>
            <MintProfile 
              onSuccess={handleMintSuccess}
              onError={handleMintError}
            />
          </div>
        ) : (
          <div>
            {activeTab === 'mint' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Mint Profile</h2>
                  <p className="text-gray-600">Create your decentralized profile NFT</p>
                </div>
                <MintProfile 
                  onSuccess={handleMintSuccess}
                  onError={handleMintError}
                />
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                  <p className="text-gray-600">View and manage your profile</p>
                </div>
                
                {hasProfile ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start space-x-4">
                      {localProfileData?.avatar ? (
                        <img
                          src={localProfileData.avatar}
                          alt="Avatar"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                          {localProfileData?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">
                          {localProfileData?.displayName || 'Unknown User'}
                        </h3>
                        <p className="text-gray-600">
                          @{localProfileData?.username || 'unknown'}
                        </p>
                        
                        {localProfileData?.bio && (
                          <p className="mt-2 text-gray-700">
                            {localProfileData.bio}
                          </p>
                        )}
                        
                        <div className="mt-4 space-y-2">
                          <div className="text-sm">
                            <strong>Profile ID:</strong> {profile?.profileId}
                          </div>
                          <div className="text-sm">
                            <strong>Owner:</strong> {profile?.owner}
                          </div>
                          <div className="text-sm">
                            <strong>Data Hash:</strong> {profile?.dataHash}
                          </div>
                        </div>
                        
                        {/* Social Media Links */}
                        {localProfileData?.socialMedia && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2">Social Media</h4>
                            <div className="flex space-x-4">
                              {localProfileData.socialMedia.twitter && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-blue-500">🐦</span>
                                  <span className="text-sm">{localProfileData.socialMedia.twitter}</span>
                                  {socialVerification.twitter && (
                                    <span className="text-green-500 text-xs">✓ Verified</span>
                                  )}
                                </div>
                              )}
                              
                              {localProfileData.socialMedia.discord && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-indigo-500">💬</span>
                                  <span className="text-sm">{localProfileData.socialMedia.discord}</span>
                                  {socialVerification.discord && (
                                    <span className="text-green-500 text-xs">✓ Verified</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">👤</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Profile Found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      You haven't minted a profile yet. Create one to get started!
                    </p>
                    <button
                      onClick={() => setActiveTab('mint')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Mint Profile
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'verify' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Social Verification</h2>
                  <p className="text-gray-600">Verify your social media accounts</p>
                </div>
                
                {hasProfile ? (
                  <div className="space-y-6">
                    {/* Twitter Verification */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-blue-500 text-2xl">🐦</span>
                          <div>
                            <h3 className="font-medium text-gray-900">Twitter</h3>
                            <p className="text-sm text-gray-600">
                              {localProfileData?.socialMedia?.twitter || 'Not provided'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {socialVerification.twitter ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              ✓ Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                              Not Verified
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!socialVerification.twitter && localProfileData?.socialMedia?.twitter && (
                        <div className="mt-4">
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Verify Twitter
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Discord Verification */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-indigo-500 text-2xl">💬</span>
                          <div>
                            <h3 className="font-medium text-gray-900">Discord</h3>
                            <p className="text-sm text-gray-600">
                              {localProfileData?.socialMedia?.discord || 'Not provided'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {socialVerification.discord ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              ✓ Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                              Not Verified
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!socialVerification.discord && localProfileData?.socialMedia?.discord && (
                        <div className="mt-4">
                          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                            Verify Discord
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🔗</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Profile Required
                    </h3>
                    <p className="text-gray-600 mb-6">
                      You need to mint a profile before you can verify social media accounts.
                    </p>
                    <button
                      onClick={() => setActiveTab('mint')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Mint Profile First
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              Built on Aztec Alpha Testnet • 
              <a 
                href="https://aztec-alpha-testnet-fullnode.zkv.xyz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 ml-1"
              >
                Network Status
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
