import React, { useState } from 'react';
import { useBetContext } from '../../context/BetContext';
import { FaClock, FaCheck } from 'react-icons/fa';

const MatchCard = ({ match }) => {
  const { addBet, bets } = useBetContext();
  const [isHovered, setIsHovered] = useState(false);

  const isBetAdded = (selection) => {
    return bets.some(b => b.matchId === match._id && b.selection === selection);
  };

  const handleAddBet = (selection, odds, e) => {
    e.stopPropagation();
    addBet({
      matchId: match._id,
      league: match.league,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      selection,
      odds,
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isLive = match.status === 'LIVE' || match.status === 'HALFTIME';
  const isFinished = match.status === 'FINISHED';

  return (
    <div
      className={`bg-dark-200 rounded-xl p-4 border transition-all duration-300 ${
        isHovered ? 'border-gold-500/50 shadow-lg shadow-gold-500/10' : 'border-gold-500/10'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* League & Time */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gold-500 font-semibold truncate max-w-[60%]">
          {match.league}
        </span>
        <div className="flex items-center text-xs">
          {isLive ? (
            <span className="flex items-center text-red-500 animate-pulse">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
              LIVE
            </span>
          ) : isFinished ? (
            <span className="text-gray-400">FINISHED</span>
          ) : (
            <span className="text-gray-400 flex items-center">
              <FaClock className="mr-1" size={10} />
              {formatTime(match.kickoff)}
            </span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-dark-100 flex items-center justify-center text-xs font-bold text-gold-500">
              {match.homeTeam?.charAt(0) || 'H'}
            </div>
            <span className="text-white font-medium text-sm truncate">
              {match.homeTeam}
            </span>
          </div>
          {match.homeScore !== undefined && match.homeScore !== null && (
            <span className={`font-bold text-lg ${isLive ? 'text-white' : 'text-gray-400'}`}>
              {match.homeScore}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-dark-100 flex items-center justify-center text-xs font-bold text-gold-500">
              {match.awayTeam?.charAt(0) || 'A'}
            </div>
            <span className="text-white font-medium text-sm truncate">
              {match.awayTeam}
            </span>
          </div>
          {match.awayScore !== undefined && match.awayScore !== null && (
            <span className={`font-bold text-lg ${isLive ? 'text-white' : 'text-gray-400'}`}>
              {match.awayScore}
            </span>
          )}
        </div>
      </div>

      {/* Odds */}
      {!isFinished ? (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={(e) => handleAddBet('1', match.homeOdds, e)}
            className={`relative px-2 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
              isBetAdded('1')
                ? 'bg-gold-500 text-dark-100'
                : 'bg-dark-100 hover:bg-gold-500 hover:text-dark-100 text-white'
            }`}
          >
            {isBetAdded('1') && (
              <FaCheck className="absolute -top-1 -right-1 text-green-500 bg-dark-100 rounded-full p-0.5 text-xs" />
            )}
            <div>1</div>
            <div>{match.homeOdds?.toFixed(2) || '--'}</div>
          </button>

          {match.drawOdds ? (
            <button
              onClick={(e) => handleAddBet('X', match.drawOdds, e)}
              className={`relative px-2 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                isBetAdded('X')
                  ? 'bg-gold-500 text-dark-100'
                  : 'bg-dark-100 hover:bg-gold-500 hover:text-dark-100 text-white'
              }`}
            >
              {isBetAdded('X') && (
                <FaCheck className="absolute -top-1 -right-1 text-green-500 bg-dark-100 rounded-full p-0.5 text-xs" />
              )}
              <div>X</div>
              <div>{match.drawOdds?.toFixed(2) || '--'}</div>
            </button>
          ) : (
            <div className="bg-dark-100/50 px-2 py-2 rounded-lg text-center text-gray-500 text-sm">
              <div>X</div>
              <div>--</div>
            </div>
          )}

          <button
            onClick={(e) => handleAddBet('2', match.awayOdds, e)}
            className={`relative px-2 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
              isBetAdded('2')
                ? 'bg-gold-500 text-dark-100'
                : 'bg-dark-100 hover:bg-gold-500 hover:text-dark-100 text-white'
            }`}
          >
            {isBetAdded('2') && (
              <FaCheck className="absolute -top-1 -right-1 text-green-500 bg-dark-100 rounded-full p-0.5 text-xs" />
            )}
            <div>2</div>
            <div>{match.awayOdds?.toFixed(2) || '--'}</div>
          </button>
        </div>
      ) : (
        <div className="text-center text-gray-500 text-sm py-2">
          Match finished
        </div>
      )}

      {/* Double Chance */}
      {match.doubleChance && !isFinished && (
        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gold-500/10">
          <button
            onClick={(e) => handleAddBet('1X', match.doubleChance['1X'], e)}
            className={`text-xs px-1 py-1 rounded transition ${
              isBetAdded('1X')
                ? 'bg-gold-500/20 text-gold-500'
                : 'bg-dark-100/50 hover:bg-gold-500/20 text-gray-400 hover:text-gold-500'
            }`}
          >
            1X {match.doubleChance['1X']?.toFixed(2) || '--'}
          </button>
          <button
            onClick={(e) => handleAddBet('12', match.doubleChance['12'], e)}
            className={`text-xs px-1 py-1 rounded transition ${
              isBetAdded('12')
                ? 'bg-gold-500/20 text-gold-500'
                : 'bg-dark-100/50 hover:bg-gold-500/20 text-gray-400 hover:text-gold-500'
            }`}
          >
            12 {match.doubleChance['12']?.toFixed(2) || '--'}
          </button>
          <button
            onClick={(e) => handleAddBet('X2', match.doubleChance['X2'], e)}
            className={`text-xs px-1 py-1 rounded transition ${
              isBetAdded('X2')
                ? 'bg-gold-500/20 text-gold-500'
                : 'bg-dark-100/50 hover:bg-gold-500/20 text-gray-400 hover:text-gold-500'
            }`}
          >
            X2 {match.doubleChance['X2']?.toFixed(2) || '--'}
          </button>
        </div>
      )}

      {/* Both Score */}
      {match.bothScore && !isFinished && (
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gold-500/10">
          <button
            onClick={(e) => handleAddBet('Yes', match.bothScore.yes, e)}
            className={`text-xs px-1 py-1 rounded transition ${
              isBetAdded('Yes')
                ? 'bg-gold-500/20 text-gold-500'
                : 'bg-dark-100/50 hover:bg-gold-500/20 text-gray-400 hover:text-gold-500'
            }`}
          >
            Yes {match.bothScore.yes?.toFixed(2) || '--'}
          </button>
          <button
            onClick={(e) => handleAddBet('No', match.bothScore.no, e)}
            className={`text-xs px-1 py-1 rounded transition ${
              isBetAdded('No')
                ? 'bg-gold-500/20 text-gold-500'
                : 'bg-dark-100/50 hover:bg-gold-500/20 text-gray-400 hover:text-gold-500'
            }`}
          >
            No {match.bothScore.no?.toFixed(2) || '--'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchCard;