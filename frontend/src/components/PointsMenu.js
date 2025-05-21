import React from 'react';
import { GiTrophyCup } from 'react-icons/gi';
import { FaExchangeAlt } from 'react-icons/fa';

function PointsMenu({ isOpen, onClose, points }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16" onClick={onClose}>
      <div className="bg-[#1f1f1f] rounded-xl w-[90%] max-w-sm shadow-lg p-4 border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Your Points</h3>
          <button onClick={onClose} className="p-1 text-white/60 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="bg-black/40 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                  fill="#8B5CF6" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm text-white/60">Total Points</p>
              <p className="text-2xl font-bold">{points}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition">
              <GiTrophyCup size={16} />
              <span className="text-sm">Redeem</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition">
              <FaExchangeAlt size={16} />
              <span className="text-sm">Transfer</span>
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80">Recent Activity</h4>
          
          <div className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">+</div>
              <div>
                <p className="text-sm font-medium">Quest Completed</p>
                <p className="text-xs text-white/60">Yesterday</p>
              </div>
            </div>
            <p className="text-green-400 font-medium">+100</p>
          </div>
          
          <div className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">+</div>
              <div>
                <p className="text-sm font-medium">Daily Login</p>
                <p className="text-xs text-white/60">2 days ago</p>
              </div>
            </div>
            <p className="text-green-400 font-medium">+50</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PointsMenu;
