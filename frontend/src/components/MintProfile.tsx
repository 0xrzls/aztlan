// src/components/MintProfile.tsx
import React, { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { ProfileData } from '../services/aztecClient';

interface MintProfileProps {
  onSuccess?: (profileId: string) => void;
  onError?: (error: string) => void;
}

export const MintProfile: React.FC<MintProfileProps> = ({ onSuccess, onError }) => {
  const { 
    wallet, 
    connectWallet, 
    mintProfile, 
    isLoading, 
    error,
    hasProfile,
    isInitialized 
  } = useProfile();

  const [formData, setFormData] = useState<ProfileData>({
    username: '',
    displayName: '',
    bio: '',
    avatar: '',
    socialMedia: {}
  });

  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState<string | null>(null);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialMediaChange = (platform: 'twitter' | 'discord', value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      onError?.(error.message);
    }
  };

  const handleMint = async () => {
    if (!formData.username.trim() || !formData.displayName.trim()) {
      onError?.('Username and display name are required');
      return;
    }

    setIsMinting(true);
    try {
      const result = await mintProfile(formData);
      
      if (result.success) {
        setMintSuccess(result.profileId || 'Profile minted successfully!');
        onSuccess?.(result.profileId || '');
        
        // Reset form
        setFormData({
          username: '',
          displayName: '',
          bio: '',
          avatar: '',
          socialMedia: {}
        });
      } else {
        onError?.(result.error || 'Failed to mint profile');
      }
    } catch (error) {
      onError?.(error.message);
    } finally {
      setIsMinting(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Connecting to Aztec network...</p>
        </div>
      </div>
    );
  }

  if (!wallet.isConnected) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your Aztec wallet to mint your profile NFT
          </p>
          <button
            onClick={handleConnect}
            disabled={wallet.isConnecting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {wallet.isConnecting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connecting...
              </div>
            ) : (
              'Connect Wallet'
            )}
          </button>
        </div>
      </div>
    );
  }

  if (hasProfile) {
    return (
      <div className="max-w-md mx-auto p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-center">
          <div className="text-green-600 text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Profile Already Exists</h2>
          <p className="text-green-700">
            You already have a profile minted on Aztec!
          </p>
        </div>
      </div>
    );
  }

  if (mintSuccess) {
    return (
      <div className="max-w-md mx-auto p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-center">
          <div className="text-green-600 text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Profile Minted!</h2>
          <p className="text-green-700 mb-4">
            Your profile has been successfully minted on Aztec blockchain.
          </p>
          <p className="text-sm text-green-600 break-all">
            Profile ID: {mintSuccess}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Mint Your Profile</h2>
        <p className="text-gray-600">
          Create your decentralized profile on Aztec
        </p>
        <div className="text-sm text-gray-500 mt-2">
          Connected: {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleMint(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="Enter username"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name *
          </label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            placeholder="Enter display name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Tell us about yourself"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Avatar URL
          </label>
          <input
            type="url"
            value={formData.avatar}
            onChange={(e) => handleInputChange('avatar', e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Social Media</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter Handle
              </label>
              <input
                type="text"
                value={formData.socialMedia.twitter || ''}
                onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                placeholder="@username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discord Handle
              </label>
              <input
                type="text"
                value={formData.socialMedia.discord || ''}
                onChange={(e) => handleSocialMediaChange('discord', e.target.value)}
                placeholder="username#1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isMinting || isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isMinting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Minting Profile...
            </div>
          ) : (
            'Mint Profile NFT'
          )}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700 text-sm">
          💡 Your profile data will be hashed and stored on Aztec blockchain for privacy.
        </p>
      </div>
    </div>
  );
};
