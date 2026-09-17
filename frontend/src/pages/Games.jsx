import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaSearch, FaGamepad, FaStar, FaFire, FaRocket } from 'react-icons/fa';

const Games = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState('All');

  const categories = [
    { name: 'All', icon: <FaGamepad /> },
    { name: 'Popular', icon: <FaFire /> },
    { name: 'New', icon: <FaStar /> },
    { name: 'Crash', icon: <FaRocket /> },
    { name: 'Roulette', icon: '🎰' },
    { name: 'Blackjack', icon: '🃏' },
    { name: 'Baccarat', icon: '🎲' },
    { name: 'Slots', icon: '🎰' },
  ];

  const providers = [
    'Spribe', 'PragmaticPlay', 'Endorphina', 'Betsoft', 'BGaming',
    'NetEnt', "Play'n GO", 'PGSoft', 'Evoplay', 'Kalamba',
    'Blueprint', 'BigPot Gaming', 'Belatra Games', 'Boongo', 'EvoPlay',
    'Hacksaw', 'Relax Gaming', 'Yggdrasil', 'Microgaming', 'Playtech'
  ];

  const games = [
    { id: 1, name: 'Aviator', category: 'Crash', provider: 'Spribe', icon: '✈️', popular: true, new: false, path: '/aviator' },
    { id: 2, name: 'Mega Roulette', category: 'Roulette', provider: 'PragmaticPlay', icon: '🎰', popular: true, new: false },
    { id: 3, name: 'Gates of Olympus', category: 'Slots', provider: 'PragmaticPlay', icon: '⚡', popular: true, new: false },
    { id: 4, name: 'Sweet Bonanza', category: 'Slots', provider: 'PragmaticPlay', icon: '🍬', popular: true, new: false },
    { id: 5, name: 'Blackjack VIP', category: 'Blackjack', provider: 'NetEnt', icon: '🃏', popular: false, new: false },
    { id: 6, name: 'Baccarat', category: 'Baccarat', provider: 'Evolution', icon: '🎲', popular: false, new: true },
    { id: 7, name: 'Crazy Time', category: 'Live', provider: 'Evolution', icon: '🎯', popular: true, new: false },
    { id: 8, name: 'Spaceman', category: 'Crash', provider: 'PragmaticPlay', icon: '🚀', popular: false, new: true },
    { id: 9, name: 'Book of Dead', category: 'Slots', provider: "Play'n GO", icon: '📖', popular: true, new: false },
    { id: 10, name: 'Starburst', category: 'Slots', provider: 'NetEnt', icon: '✨', popular: false, new: false },
    { id: 11, name: 'Roulette Royal', category: 'Roulette', provider: 'Evolution', icon: '🎰', popular: false, new: true },
    { id: 12, name: 'Blackjack 21', category: 'Blackjack', provider: 'PragmaticPlay', icon: '🃏', popular: false, new: false },
    { id: 13, name: 'Wolf Gold', category: 'Slots', provider: 'PragmaticPlay', icon: '🐺', popular: true, new: false },
    { id: 14, name: 'The Dog House', category: 'Slots', provider: 'PragmaticPlay', icon: '🐕', popular: false, new: false },
    { id: 15, name: 'Big Bass Bonanza', category: 'Slots', provider: 'PragmaticPlay', icon: '🐟', popular: true, new: false },
  ];

  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || game.category === selectedCategory;
    const matchesProvider = selectedProvider === 'All' || game.provider === selectedProvider;
    return matchesSearch && matchesCategory && matchesProvider;
  });

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">🎮 Games</h1>
          <p className="text-gray-400 text-sm mt-1">Discover and play the best casino games</p>
          <p className="text-gold-500 text-xs mt-1">Balance: {user?.balance?.toLocaleString()} ETB</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-200 text-white px-4 py-2 pl-10 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              selectedCategory === category.name
                ? 'bg-gold-500 text-dark-100'
                : 'bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300'
            }`}
          >
            <span>{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Providers */}
      <div className="mb-6">
        <label className="text-gray-400 text-sm block mb-2">Provider</label>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="bg-dark-200 text-white px-4 py-2 pr-10 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition appearance-none w-full md:w-64"
        >
          <option value="All">All Providers</option>
          {providers.map(provider => (
            <option key={provider} value={provider}>{provider}</option>
          ))}
        </select>
      </div>

      {/* Games Grid */}
      {filteredGames.length === 0 ? (
        <div className="text-center py-12 bg-dark-200 rounded-xl">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-400">No games found</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredGames.map(game => {
            const isAviator = game.path === '/aviator';
            
            if (isAviator) {
              return (
                <Link
                  key={game.id}
                  to={game.path}
                  className="bg-dark-200 rounded-xl overflow-hidden hover:ring-2 hover:ring-gold-500 transition-all duration-300 cursor-pointer group"
                >
                  <div className="aspect-square bg-dark-100 relative">
                    <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-dark-200 to-dark-100">
                      {game.icon}
                    </div>
                    
                    {game.popular && (
                      <span className="absolute top-2 left-2 bg-gold-500 text-dark-100 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        <FaFire className="text-xs" /> Popular
                      </span>
                    )}
                    {game.new && (
                      <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                        New
                      </span>
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button className="bg-gold-500 text-dark-100 px-4 py-2 rounded-lg font-semibold hover:bg-gold-400 transition transform hover:scale-105">
                        Play Now
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <p className="text-white text-sm font-semibold truncate">{game.name}</p>
                    <p className="text-gray-400 text-xs">{game.provider}</p>
                    <p className="text-gray-500 text-xs">{game.category}</p>
                  </div>
                </Link>
              );
            }

            return (
              <div
                key={game.id}
                onClick={() => alert(`🎮 Opening ${game.name}\nProvider: ${game.provider}\nCategory: ${game.category}`)}
                className="bg-dark-200 rounded-xl overflow-hidden hover:ring-2 hover:ring-gold-500 transition-all duration-300 cursor-pointer group"
              >
                <div className="aspect-square bg-dark-100 relative">
                  <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-dark-200 to-dark-100">
                    {game.icon}
                  </div>
                  
                  {game.popular && (
                    <span className="absolute top-2 left-2 bg-gold-500 text-dark-100 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <FaFire className="text-xs" /> Popular
                    </span>
                  )}
                  {game.new && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                      New
                    </span>
                  )}
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button className="bg-gold-500 text-dark-100 px-4 py-2 rounded-lg font-semibold hover:bg-gold-400 transition transform hover:scale-105">
                      Play Now
                    </button>
                  </div>
                </div>
                
                <div className="p-3">
                  <p className="text-white text-sm font-semibold truncate">{game.name}</p>
                  <p className="text-gray-400 text-xs">{game.provider}</p>
                  <p className="text-gray-500 text-xs">{game.category}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Games;
