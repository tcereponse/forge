import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainComponent from './components/MainComponent';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-center">Cibert</h1>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<MainComponent />} />
            <Route path="/about" element={<div className="container mx-auto px-4 py-8"><h2 className="text-2xl font-bold mb-4">À propos de Cibert</h2><p className="text-gray-300">Cibert est une application de référencement de jeux vidéo utilisant des flux RSS IGDB.</p></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;