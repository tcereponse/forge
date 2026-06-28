import { HashRouter, Routes, Route } from 'react-router-dom';
import MainComponent from './components/MainComponent';

const App = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 p-4 shadow-lg">
          <nav className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-purple-500">Tetris</h1>
            <div className="space-x-4">
              <a href="/" className="hover:text-purple-300 transition-colors">Game</a>
              <a href="/about" className="hover:text-purple-300 transition-colors">About</a>
            </div>
          </nav>
        </header>
        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<MainComponent />} />
            <Route path="/about" element={<div className="text-center py-10">About Tetris Game</div>} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;