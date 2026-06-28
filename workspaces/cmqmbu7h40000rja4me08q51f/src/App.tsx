import React from 'react';
import MainComponent from './components/MainComponent';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">CounterApp</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <MainComponent />
      </main>
    </div>
  );
};

export default App;