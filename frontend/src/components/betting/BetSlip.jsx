import React from 'react';
import { useBetContext } from '../../context/BetContext';
import { FaTimes, FaInfoCircle } from 'react-icons/fa';

const BetSlip = () => {
  const { 
    bets, 
    activeTab, 
    setActiveTab, 
    totalOdds, 
    potentialWin,
    stakeAmount,
    removeBet,
    updateStake,
    clearBets,
    placeBets,
    betCount
  } = useBetContext();

  const tabs = ['BETSLIP 1', 'BETSLIP 2', 'BETSLIP 3'];

  return (
    <div className="bg-dark-200 rounded-xl border border-gold-500/20 overflow-hidden sticky top-20">
      {/* Tabs */}
      <div className="flex border-b border-gold-500/20">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`flex-1 py-3 text-sm font-semibold transition-all duration-300 ${
              activeTab === index
                ? 'bg-gold-500 text-dark-100'
                : 'text-gray-400 hover:text-white hover:bg-dark-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {bets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-gray-400 font-semibold">Click ODDS to Start</p>
            <p className="text-xs text-gray-500 mt-2">
              Select odds from matches to add to your accumulator
            </p>
          </div>
        ) : (
          <>
            {/* Bet Items */}
            <div className="space-y-2 mb-4">
              {bets.map((bet, index) => (
                <div
                  key={index}
                  className="bg-dark-100 rounded-lg p-3 border border-gold-500/10 hover:border-gold-500/30 transition group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 truncate">{bet.league}</p>
                      <p className="text-white font-semibold text-sm truncate">
                        {bet.homeTeam} vs {bet.awayTeam}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-gold-500 text-sm font-bold">
                          {bet.selection}
                        </span>
                        <span className="text-white text-sm">@</span>
                        <span className="text-green-400 text-sm font-bold">
                          {bet.odds.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBet(index)}
                      className="text-red-400 hover:text-red-300 transition p-1 opacity-0 group-hover:opacity-100"
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Multiplier Info */}
            <div className="bg-dark-100 rounded-lg p-3 mb-4 border border-gold-500/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center">
                  <FaInfoCircle className="mr-1 text-gold-500" size={12} />
                  Accumulator ({betCount} bets)
                </span>
                <span className="text-white font-bold">{betCount} ×</span>
              </div>
            </div>

            {/* Stake Input */}
            <div className="bg-dark-100 rounded-lg p-3 mb-4 border border-gold-500/20">
              <label className="text-gray-400 text-sm block mb-2">
                Stake Amount (ETB)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={stakeAmount || ''}
                  onChange={(e) => updateStake(parseFloat(e.target.value) || 0)}
                  className="flex-1 bg-dark-200 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none text-sm"
                  placeholder="Enter amount"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => updateStake(10)}
                    className="bg-dark-200 text-gray-400 px-2 py-1 rounded text-xs hover:bg-dark-300 hover:text-white transition"
                  >
                    10
                  </button>
                  <button
                    onClick={() => updateStake(50)}
                    className="bg-dark-200 text-gray-400 px-2 py-1 rounded text-xs hover:bg-dark-300 hover:text-white transition"
                  >
                    50
                  </button>
                  <button
                    onClick={() => updateStake(100)}
                    className="bg-dark-200 text-gray-400 px-2 py-1 rounded text-xs hover:bg-dark-300 hover:text-white transition"
                  >
                    100
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-dark-100 rounded-lg p-4 border border-gold-500/20">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Total Odds</span>
                <span className="text-gold-500 font-bold text-lg">
                  {totalOdds.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Stake</span>
                <span className="text-white font-bold">
                  {stakeAmount > 0 ? `${stakeAmount.toFixed(2)} ETB` : '--'}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gold-500/10">
                <span className="text-gray-400">Potential Win</span>
                <span className="text-green-500 font-bold text-lg">
                  {potentialWin > 0 ? `${potentialWin.toFixed(2)} ETB` : '--'}
                </span>
              </div>
              
              <button
                onClick={placeBets}
                disabled={bets.length === 0 || stakeAmount < 1}
                className={`w-full mt-3 font-bold py-2 rounded-lg transition ${
                  bets.length > 0 && stakeAmount >= 1
                    ? 'bg-gold-500 text-dark-100 hover:bg-gold-400'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Place Bet
              </button>
              
              {bets.length > 0 && stakeAmount > 0 && (
                <div className="text-xs text-gray-500 mt-2 text-center">
                  You are placing {betCount} bet(s) as an accumulator
                </div>
              )}
              
              <button
                onClick={clearBets}
                className="w-full mt-2 text-gray-400 text-sm hover:text-red-400 transition"
              >
                Clear All
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BetSlip;