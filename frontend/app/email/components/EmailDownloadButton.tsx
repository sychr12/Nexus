// app/email/components/EmailDownloadButton.tsx
'use client';

import { Download } from 'lucide-react';

const COLORS = {
    accent: '#6B9D4A',
};

interface EmailDownloadButtonProps {
    onClick: () => void;
    isLoading?: boolean;
}

export default function EmailDownloadButton({ onClick, isLoading = false }: EmailDownloadButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
            style={{ backgroundColor: COLORS.accent, color: 'white' }}
        >
            <Download size={18} />
            {isLoading ? 'Processando...' : 'Baixar PDFs'}
        </button>
    );
}