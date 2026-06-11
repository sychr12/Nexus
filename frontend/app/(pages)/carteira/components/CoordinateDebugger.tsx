// frontend/app/carteira/components/CoordinateDebugger.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

export default function CoordinateDebugger() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x: Math.round(x), y: Math.round(y) });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    alert(`Coordenadas clicadas: X: ${Math.round(x)}%, Y: ${Math.round(y)}%`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-4 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Debug de Coordenadas</h2>
          <button className="px-3 py-1 bg-red-500 text-white rounded">
            Fechar
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-2">
          Mova o mouse sobre a imagem para ver as coordenadas. Clique para marcar um ponto.
        </p>
        <p className="text-sm font-mono bg-gray-100 p-2 rounded mb-4">
          Posição atual: X: {mousePos.x}%, Y: {mousePos.y}%
        </p>
        
        <div 
          className="relative cursor-crosshair"
          onMouseMove={handleMouseMove}
          onClick={handleClick}
        >
          <Image
            src="/images/carteira/frente.png"
            alt="Frente do Cartão"
            width={800}
            height={500}
            className="w-full h-auto border rounded"
          />
          <div 
            className="absolute w-2 h-2 bg-red-500 rounded-full pointer-events-none"
            style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%` }}
          />
        </div>
        
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm font-semibold mb-2">Posições encontradas:</p>
          <ul className="text-xs space-y-1 font-mono">
            <li>• Registro: {"{ x: '22%', y: '38%' }"}</li>
            <li>• CPF: {"{ x: '62%', y: '38%' }"}</li>
            <li>• Nome: {"{ x: '22%', y: '50%' }"}</li>
            <li>• Propriedade: {"{ x: '22%', y: '60%' }"}</li>
            <li>• Unidade Local: {"{ x: '18%', y: '75%' }"}</li>
            <li>• Início: {"{ x: '52%', y: '75%' }"}</li>
            <li>• Validade: {"{ x: '75%', y: '75%' }"}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
