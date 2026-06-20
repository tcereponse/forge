import React, { useState, useEffect, useCallback } from 'react';

interface Tetromino {
  shape: number[][];
  color: string;
}

interface Position {
  x: number;
  y: number;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const TETROMINOS: Record<string, Tetromino> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 'bg-cyan-500',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-blue-500',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-orange-500',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'bg-yellow-500',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: 'bg-green-500',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-purple-500',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-red-500',
  },
};

const MainComponent = () => {
  const [board, setBoard] = useState<number[][]>([]);
  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 } as Position,
    tetromino: [] as number[][],
    collided: false,
  });
  const [nextTetromino, setNextTetromino] = useState<number[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // Create an empty board
  const createBoard = () => {
    return Array.from(Array(BOARD_HEIGHT), () =>
      Array(BOARD_WIDTH).fill(0)
    );
  };

  // Get a random tetromino
  const randomTetromino = useCallback(() => {
    const tetrominos = 'IJLOSTZ';
    const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
    return TETROMINOS[randTetromino].shape;
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    setBoard(createBoard());
    setPlayer({
      pos: { x: BOARD_WIDTH / 2 - 2, y: 0 },
      tetromino: randomTetromino(),
      collided: false,
    });
    setNextTetromino(randomTetromino());
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameStarted(true);
  }, [randomTetromino]);

  // Rotate tetromino
  const rotate = (matrix: number[][], dir: number) => {
    const rotatedTetro = matrix.map((_, index) =>
      matrix.map((col) => col[index])
    );

    if (dir > 0) return rotatedTetro.map((row) => row.reverse());
    return rotatedTetro.reverse();
  };

  // Check collision
  const checkCollision = (
    player: { pos: Position; tetromino: number[][] },
    board: number[][],
    pos: Position
  ) => {
    for (let y = 0; y < player.tetromino.length; y++) {
      for (let x = 0; x < player.tetromino[y].length; x++) {
        // 1. Check that we're on an actual Tetromino cell
        if (player.tetromino[y][x] !== 0) {
          // 2. Check that our move is inside the game areas height (y)
          // 3. Check that our move is inside the game areas width (x)
          // 4. Check that the cell we're moving to isn't set to clear
          if (
            !board[y + pos.y] ||
            !board[y + pos.y][x + pos.x] ||
            board[y + pos.y][x + pos.x] !== 0
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Update player position
  const updatePlayerPos = ({ pos, tetromino }: { pos: Position; tetromino: number[][] }) => {
    if (!checkCollision(player, board, pos)) {
      setPlayer(prev => ({
        ...prev,
        pos,
        tetromino,
      }));
    }
  };

  // Handle keyboard controls
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      if (e.key === 'ArrowLeft') {
        updatePlayerPos({
          pos: { x: player.pos.x - 1, y: player.pos.y },
          tetromino: player.tetromino,
        });
      } else if (e.key === 'ArrowRight') {
        updatePlayerPos({
          pos: { x: player.pos.x + 1, y: player.pos.y },
          tetromino: player.tetromino,
        });
      } else if (e.key === 'ArrowDown') {
        updatePlayerPos({
          pos: { x: player.pos.x, y: player.pos.y + 1 },
          tetromino: player.tetromino,
        });
      } else if (e.key === 'ArrowUp') {
        updatePlayerPos({
          pos: { x: player.pos.x, y: player.pos.y },
          tetromino: rotate(player.tetromino, 1),
        });
      }
    },
    [player, board, gameStarted, gameOver]
  );

  // Start game
  const startGame = () => {
    initGame();
  };

  // Effect for keyboard controls
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Initialize board on first render
  useEffect(() => {
    setBoard(createBoard());
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameInterval = setInterval(() => {
      // Move player down
      updatePlayerPos({
        pos: { x: player.pos.x, y: player.pos.y + 1 },
        tetromino: player.tetromino,
      });
    }, 1000 - (level - 1) * 100);

    return () => {
      clearInterval(gameInterval);
    };
  }, [player, gameStarted, gameOver, level]);

  // Render the game board
  const renderBoard = () => {
    return board.map((row, y) =>
      row.map((cell, x) => {
        const isPlayerCell = player.tetromino[y - player.pos.y]?.[x - player.pos.x];
        
        if (isPlayerCell) {
          const tetrominoColor = Object.values(TETROMINOS).find(t => 
            JSON.stringify(t.shape) === JSON.stringify(player.tetromino)
          )?.color || 'bg-gray-500';
          
          return (
            <div 
              key={`${y}-${x}`} 
              className={`w-6 h-6 border border-gray-800 ${tetrominoColor}`}
            />
          );
        }
        
        return (
          <div 
            key={`${y}-${x}`} 
            className={`w-6 h-6 border border-gray-800 ${cell ? 'bg-gray-700' : 'bg-gray-900'}`}
          />
        );
      })
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-3xl font-bold mb-6 text-purple-500">Tetris Game</h2>
      
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
          <div className="grid grid-cols-10 gap-0">
            {renderBoard()}
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-xs">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Game Info</h3>
            <p className="mb-1">Score: <span className="font-bold">{score}</span></p>
            <p className="mb-1">Level: <span className="font-bold">{level}</span></p>
            <p className="mb-1">Lines: <span className="font-bold">{lines}</span></p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Next Tetromino</h3>
            <div className="bg-gray-900 p-4 rounded flex justify-center">
              {nextTetromino.map((row, y) =>
                row.map((cell, x) => (
                  <div 
                    key={`next-${y}-${x}`} 
                    className={`w-4 h-4 m-1 ${cell ? 'bg-gray-400' : 'bg-transparent'}`}
                  />
                ))
              )}
            </div>
          </div>
          
          {!gameStarted ? (
            <button 
              onClick={startGame}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Start Game
            </button>
          ) : (
            <button 
              onClick={() => setGameOver(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              End Game
            </button>
          )}
          
          {gameOver && (
            <div className="mt-4 text-center">
              <p className="text-xl font-bold text-red-500 mb-2">Game Over!</p>
              <button 
                onClick={startGame}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Controls</h3>
            <ul className="text-sm space-y-1">
              <li>← → : Move</li>
              <li>↑ : Rotate</li>
              <li>↓ : Soft Drop</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainComponent;