import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainComponent from './components/MainComponent';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 p-4 shadow-lg">
          <h1 className="text-2xl font-bold text-center">Dépendances</h1>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<MainComponent />} />
            <Route path="/about" element={<div className="text-center p-8">À propos de notre application de jeux vidéo</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;