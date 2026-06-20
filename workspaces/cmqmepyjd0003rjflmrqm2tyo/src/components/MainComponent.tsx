import React, { useState, useEffect } from 'react';

interface Game {
  id: number;
  name: string;
  description: string;
  releaseDate: string;
  cover: {
    id: number;
    image_id: string;
  };
}

const MainComponent: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const gamesPerPage = 6;

  useEffect(() => {
    // Simuler la récupération des données de l'API IGDB
    const mockData: Game[] = [
      {
        id: 1,
        name: "The Witcher 3",
        description: "Un jeu de rôle épique dans un monde fantastique.",
        releaseDate: "2015-05-19",
        cover: { id: 1, image_id: "co1q4y" }
      },
      {
        id: 2,
        name: "Cyberpunk 2077",
        description: "Un RPG d'action se déroulant dans Night City.",
        releaseDate: "2020-12-10",
        cover: { id: 2, image_id: "co2q5z" }
      },
      {
        id: 3,
        name: "Red Dead Redemption 2",
        description: "Un western épique dans le monde sauvage.",
        releaseDate: "2018-10-26",
        cover: { id: 3, image_id: "co3r6a" }
      },
      {
        id: 4,
        name: "The Last of Us Part II",
        description: "Un jeu d'action-aventure post-apocalyptique.",
        releaseDate: "2020-06-19",
        cover: { id: 4, image_id: "co4s7b" }
      },
      {
        id: 5,
        name: "God of War",
        description: "Un action-aventure dans le monde de la mythologie nordique.",
        releaseDate: "2018-04-20",
        cover: { id: 5, image_id: "co5t8c" }
      },
      {
        id: 6,
        name: "Horizon Zero Dawn",
        description: "Un RPG d'action dans un monde post-apocalyptique.",
        releaseDate: "2017-02-28",
        cover: { id: 6, image_id: "co6u9d" }
      }
    ];
    
    setGames(mockData);
    setFilteredGames(mockData);
  }, []);

  useEffect(() => {
    const filtered = games.filter(game => 
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.releaseDate.includes(searchTerm)
    );
    setFilteredGames(filtered);
    setCurrentPage(0);
  }, [searchTerm, games]);

  const indexOfLastGame = (currentPage + 1) * gamesPerPage;
  const indexOfFirstGame = currentPage * gamesPerPage;
  const currentGames = filteredGames.slice(indexOfFirstGame, indexOfLastGame);

  const totalPages = Math.ceil(filteredGames.length / gamesPerPage);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Jeux Vidéo</h2>
      
      <div className="mb-8">
        <input
          type="text"
          placeholder="Rechercher par nom ou date..."
          className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="relative overflow-hidden rounded-xl bg-gray-800 p-4 mb-8">
        <div className="flex transition-transform duration-500 ease-in-out" 
             style={{ transform: `translateX(-${currentPage * (100 / Math.min(totalPages, 3))}%)` }}>
          {Array.from({ length: Math.min(totalPages, 3) }).map((_, index) => (
            <div key={index} className="w-full flex-shrink-0 px-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGames.slice(index * gamesPerPage, index * gamesPerPage + gamesPerPage).map(game => (
                  <div key={game.id} className="bg-gray-700 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="aspect-w-16 aspect-h-9">
                      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">{game.name}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-bold mb-2">{game.name}</h3>
                      <p className="text-gray-300 mb-4">{game.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Date de sortie: {new Date(game.releaseDate).toLocaleDateString()}</span>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-300">
                          Détails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <button 
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className={`px-4 py-2 rounded-lg ${currentPage === 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          Précédent
        </button>
        <span className="px-4 py-2 bg-gray-700 rounded-lg">
          Page {currentPage + 1} sur {totalPages}
        </span>
        <button 
          onClick={handleNextPage}
          disabled={currentPage === totalPages - 1}
          className={`px-4 py-2 rounded-lg ${currentPage === totalPages - 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default MainComponent;