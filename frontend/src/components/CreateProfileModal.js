import React, { useState } from 'react';

function CreateProfileModal({ isOpen, onClose, onSubmit, loading }) {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('1');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ username, avatar });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1f1f] rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white/70 mb-2 text-sm">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white"
              placeholder="Enter username"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-white/70 mb-2 text-sm">Avatar</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setAvatar(num.toString())}
                  className={`aspect-square rounded-lg flex items-center justify-center ${
                    avatar === num.toString() ? 'bg-purple-600' : 'bg-black/50 border border-white/20'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg bg-black/50 text-white/70"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 text-white flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProfileModal;

