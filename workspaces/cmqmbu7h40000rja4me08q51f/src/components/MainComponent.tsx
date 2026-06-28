import React, { useState } from 'react';

interface CounterState {
  count: number;
}

const MainComponent: React.FC = () => {
  const [state, setState] = useState<CounterState>({ count: 0 });

  const increment = () => {
    setState(prev => ({ count: prev.count + 1 }));
  };

  const decrement = () => {
    setState(prev => ({ count: prev.count - 1 }));
  };

  const reset = () => {
    setState({ count: 0 });
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Compteur</h2>
        <div className="text-4xl font-bold text-center text-indigo-600 mb-6">
          {state.count}
        </div>
        <div className="flex justify-between space-x-4">
          <button
            onClick={increment}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Incrementer
          </button>
          <button
            onClick={decrement}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Décrementer
          </button>
          <button
            onClick={reset}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainComponent;