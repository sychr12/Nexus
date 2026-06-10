// app/email/components/EmailFilters.tsx
'use client';

import { Search, X } from 'lucide-react';
import { useState } from 'react';

const COLORS = {
    primary: '#1F3A2E',
    accent: '#6B9D4A',
    border: '#E2E8E0',
    text: '#1E2A22',
    textLight: '#6B7C6A',
    white: '#FFFFFF',
    inputBg: '#FDFDFC',
};

interface EmailFiltersProps {
    onSearch: (texto: string) => void;
    onMunicipioChange: (municipio: string) => void;
    municipios: string[];
}

export default function EmailFilters({ onSearch, onMunicipioChange, municipios }: EmailFiltersProps) {
    const [searchText, setSearchText] = useState('');
    const [selectedMunicipio, setSelectedMunicipio] = useState('');

    const handleSearch = () => {
        onSearch(searchText);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleMunicipioChange = (municipio: string) => {
        setSelectedMunicipio(municipio);
        onMunicipioChange(municipio);
    };

    const clearFilters = () => {
        setSearchText('');
        setSelectedMunicipio('');
        onSearch('');
        onMunicipioChange('');
    };

    const hasFilters = searchText || selectedMunicipio;

    return (
        <div className="rounded-xl p-4 border mb-6" style={{ backgroundColor: COLORS.white, borderColor: COLORS.border }}>
            <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-50">
                    <label className="block text-xs font-medium mb-1" style={{ color: COLORS.textLight }}>
                        Buscar
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: COLORS.textLight }} />
                            <input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Remetente ou assunto..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                                style={{ backgroundColor: COLORS.inputBg, borderColor: COLORS.border }}
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 rounded-lg text-white font-medium"
                            style={{ backgroundColor: COLORS.accent }}
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                <div className="w-48">
                    <label className="block text-xs font-medium mb-1" style={{ color: COLORS.textLight }}>
                        Município
                    </label>
                    <select
                        value={selectedMunicipio}
                        onChange={(e) => handleMunicipioChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                        style={{ backgroundColor: COLORS.inputBg, borderColor: COLORS.border }}
                    >
                        <option value="">Todos</option>
                        {municipios.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-100"
                        style={{ color: COLORS.accent }}
                    >
                        <X size={16} />
                        Limpar
                    </button>
                )}
            </div>
        </div>
    );
}