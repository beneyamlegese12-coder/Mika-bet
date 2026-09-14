import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const BetContext = createContext();

export const useBetContext = () => {
  const context = useContext(BetContext);
  if (!context) {
    throw new Error('useBetContext must be used within BetProvider');
  }
  return context;
};

export const BetProvider = ({ children }) => {
  const [bets, setBets] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [totalOdds, setTotalOdds] = useState(1);
  const [potentialWin, setPotentialWin] = useState(0);
  const [stakeAmount, setStakeAmount] = useState(0);

  useEffect(() => {
    calculateTotals();
  }, [bets, stakeAmount]);

  const calculateTotals = () => {
    // Calculate accumulator odds (multiply all odds together)
    let combinedOdds = 1;
    bets.forEach(bet => {
      combinedOdds *= bet.odds;
    });
    
    // If no bets, set to 1
    if (bets.length === 0) combinedOdds = 1;
    
    setTotalOdds(combinedOdds);
    
    // Calculate potential win: stake × total odds
    if (stakeAmount > 0 && bets.length > 0) {
      const win = stakeAmount * combinedOdds;
      setPotentialWin(win);
    } else {
      setPotentialWin(0);
    }
  };

  const addBet = (bet) => {
    // Check if bet already exists (same match and selection)
    const exists = bets.some(b => 
      b.matchId === bet.matchId && b.selection === bet.selection
    );
    
    if (exists) {
      toast.info('This bet is already in your slip');
      return;
    }
    
    setBets([...bets, { ...bet }]);
    toast.success(`Added ${bet.selection} bet @ ${bet.odds.toFixed(2)}`);
  };

  const removeBet = (index) => {
    const newBets = bets.filter((_, i) => i !== index);
    setBets(newBets);
    toast.success('Bet removed');
  };

  const updateStake = (amount) => {
    setStakeAmount(amount);
  };

  const clearBets = () => {
    setBets([]);
    setStakeAmount(0);
    setPotentialWin(0);
    setTotalOdds(1);
    toast.success('Bet slip cleared');
  };

  const placeBets = async () => {
    if (bets.length === 0) {
      toast.error('No bets to place');
      return;
    }

    if (stakeAmount < 1) {
      toast.error('Please enter a stake amount');
      return;
    }

    try {
      // Place each bet individually with the same stake
      for (const bet of bets) {
        await api.post('/bets', {
          matchId: bet.matchId,
          amount: stakeAmount,
          odds: bet.odds,
          selection: bet.selection,
        });
      }
      
      toast.success(`🎉 ${bets.length} bet(s) placed successfully!`);
      toast.success(`Potential win: ${potentialWin.toFixed(2)} ETB`);
      clearBets();
    } catch (error) {
      console.error('Place bet error:', error);
      toast.error(error.response?.data?.message || 'Failed to place bets');
    }
  };

  const value = {
    bets,
    activeTab,
    setActiveTab,
    totalOdds,
    potentialWin,
    stakeAmount,
    addBet,
    removeBet,
    updateStake,
    clearBets,
    placeBets,
    betCount: bets.length,
  };

  return (
    <BetContext.Provider value={value}>
      {children}
    </BetContext.Provider>
  );
};