import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaPlay, FaStop, FaRocket, FaHistory } from 'react-icons/fa';

const Aviator = () => {
  const { user } = useAuth();
  const [isFlying, setIsFlying] = useState(false);
  const [multiplier, setMultiplier] = useState(1.00);
  const [betAmount, setBetAmount] = useState(10);
  const [isCrashed, setIsCrashed] = useState(false);
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(user?.balance || 0);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    setBalance(user?.balance || 0);
  }, [user]);

  useEffect(() => {
    let interval;
    if (isFlying) {
      interval = setInterval(() => {
        setMultiplier(prev => {
          const increment = Math.random() * 0.05 + 0.02;
          const newMultiplier = prev + increment;
          const crashPoint = Math.random() * 8.5 + 1.5;
          if (newMultiplier >= crashPoint) {
            setIsFlying(false);
            setIsCrashed(true);
            const result = {
              multiplier: newMultiplier,
              time: new Date().toLocaleTimeString(),
              crashed: true
            };
            setHistory(prev => [result, ...prev].slice(0, 10));
            setLastResult(result);
            return parseFloat(newMultiplier.toFixed(2));
          }
          return parseFloat(newMultiplier.toFixed(2));
        });
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isFlying]);

  const startGame = () => {
    if (betAmount > balance) {
      alert('Insufficient balance!');
      return;
    }
    setIsFlying(true);
    setIsCrashed(false);
    setMultiplier(1.00);
    setBalance(prev => prev - betAmount);
  };

  const cashOut = () => {
    if (isFlying) {
      const winnings = betAmount * multiplier;
      setBalance(prev => prev + winnings);
      setIsFlying(false);
      const result = {
        multiplier: multiplier,
        time: new Date().toLocaleTimeString(),
        crashed: false,
        win: winnings
      };
      setHistory(prev => [result, ...prev].slice(0, 10));
      setLastResult(result);
    }
  };

  const getMultiplierColor = () => {
    if (multiplier < 2) return 'text-white';
    if (multiplier < 5) return 'text-green-500';
    if (multiplier < 10) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHistoryColor = (item) => {
    if (item.crashed) return 'bg-red-500/20 text-red-400';
    return 'bg-green-500/20 text-green-400';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <FaRocket className="text-gold-500" /> Aviator
        </h1>
        <div className="text-sm text-gray-400">
          Balance: <span className="text-gold-500 font-bold">{balance.toFixed(2)} ETB</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Game Area */}
        <div className="lg:col-span-2">
          <div className="bg-dark-200 rounded-2xl p-6 border border-gold-500/20">
            <div className="relative bg-dark-100 rounded-xl p-8 mb-6 min-h-[300px] flex flex-col items-center justify-center">
              <div className="text-center">
                <div className={`text-7xl font-bold ${getMultiplierColor()} transition-all duration-100`}>
                  {multiplier.toFixed(2)}x
                </div>
                <div className="text-gray-400 text-sm mt-2">
                  {isFlying ? (
                    <span className="text-green-500 animate-pulse">✈️ Flying...</span>
                  ) : isCrashed ? (
                    <span className="text-red-500">💥 Crashed!</span>
                  ) : (
                    <span className="text-gray-400">Ready to fly?</span>
                  )}
                </div>
                {isCrashed && (
                  <div className="text-red-500 text-2xl font-bold mt-4 animate-pulse">
                    💥 CRASHED at {multiplier.toFixed(2)}x
                  </div>
                )}
                {lastResult && !isFlying && !isCrashed && (
                  <div className={`mt-4 p-2 rounded-lg ${getHistoryColor(lastResult)}`}>
                    {lastResult.crashed ? `💥 Crashed at ${lastResult.multiplier.toFixed(2)}x` : `✅ Cashed out at ${lastResult.multiplier.toFixed(2)}x (${lastResult.win.toFixed(2)} ETB)`}
                  </div>
                )}
              </div>

              {isFlying && (
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-green-500 text-sm">LIVE</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <label className="text-gray-400 text-sm block mb-1">Bet Amount (ETB)</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  min="1"
                  max={balance}
                  className="w-full bg-dark-100 text-white px-4 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                  disabled={isFlying}
                />
              </div>
              <div className="flex gap-2 items-end">
                {!isFlying && !isCrashed && (
                  <button
                    onClick={startGame}
                    disabled={betAmount > balance}
                    className="bg-green-500 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-400 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <FaPlay /> Bet & Fly
                  </button>
                )}
                {isFlying && (
                  <button
                    onClick={cashOut}
                    className="bg-gold-500 text-dark-100 px-8 py-2 rounded-lg font-bold hover:bg-gold-400 transition flex items-center gap-2 animate-pulse"
                  >
                    <FaStop /> Cash Out ({multiplier.toFixed(2)}x)
                  </button>
                )}
                {isCrashed && (
                  <button
                    onClick={() => { setIsCrashed(false); setMultiplier(1.00); }}
                    className="bg-blue-500 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-400 transition"
                  >
                    Play Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-dark-200 rounded-2xl p-6 border border-gold-500/20">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaHistory /> History
            </h2>
            {history.length === 0 ? (
              <p className="text-gray-400 text-sm">No history yet. Play a game!</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg ${getHistoryColor(item)}`}
                  >
                    <div className="flex justify-between text-sm">
                      <span>{item.multiplier.toFixed(2)}x</span>
                      <span>{item.crashed ? '💥' : '✅'}</span>
                      <span>{item.win ? `+${item.win.toFixed(2)} ETB` : ''}</span>
                    </div>
                    <div className="text-xs opacity-60">{item.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Aviator;