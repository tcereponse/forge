import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Game {
  id: number;
  name: string;
  description: string;
  releaseDate: string;
  coverImage: string;
}

const MainComponent: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        // Simulating RSS feed data fetching
        // In a real app, you would fetch from IGDB API
        const mockGames: Game[] = [
          {
            id: 1,
            name: "The Witcher 3",
            description: "Un RPG épique dans un monde fantastique",
            releaseDate: "2015-05-19",
            coverImage: "https://example.com/witcher3.jpg"
          },
          {
            id: 2,
            name: "Cyberpunk 2077",
            description: "RPG dans un futur dystopique",
            releaseDate: "2020-12-10",
            coverImage: "https://example.com/cyberpunk.jpg"
          },
          {
            id: 3,
            name: "Red Dead Redemption 2",
            description: "Western épique dans l'Amérique du début du XXe siècle",
            releaseDate: "2018-10-26",
            coverImage: "https://example.com/rdr2.jpg"
          }
        ];
        
        // Simulate API delay
        setTimeout(() => {
          setGames(mockGames);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Erreur lors du chargement des jeux");
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) return <div className="text-center py-8">Chargement...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="py-8">
      <h2 className="text-3xl font-bold mb-8 text-center">Jeux Vidéo</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <div 
            key={game.id} 
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            onClick={() => navigate(`/game/${game.id}`)}
          >
            <div className="h-48 bg-gray-700 flex items-center justify-center">
              {game.coverImage ? (
                <img 
                  src={game.coverImage} 
                  alt={game.name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-gray-500 text-center p-4">Image indisponible</div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2">{game.name}</h3>
              <p className="text-gray-300 mb-3 line-clamp-3">{game.description}</p>
              <div className="text-sm text-gray-400">Sorti le: {new Date(game.releaseDate).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainComponent;