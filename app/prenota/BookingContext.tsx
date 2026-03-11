'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type ParticipantInfo = { nome: string; tipo: 'ADULTO' | 'BAMBINO' };

export type RoomSelection = {
  tipo: string;
  quantita: number;
};

export type BookingState = {
  // New categorization
  tipo_scelta: 'Pernotto' | 'pass' | 'pasti' | '';
  pacchetto_giorni: '3_giorni' | '2_giorni' | '';
  tipo_pass: '3_giorni' | '1_giorno' | '';

  struttura: string;
  camere: RoomSelection[];
  adulti: number;
  bambini: number;
  pranzi: number;
  cene: number;
  pranzo_scelto: boolean;
  cena_scelta: boolean;

  participants: ParticipantInfo[];
  nome: string;
  email: string;
  telefono: string;

  totale: number;
  metodo_pagamento: string;
};

type BookingContextType = {
  data: BookingState;
  updateData: (updates: Partial<BookingState>) => void;
  resetData: () => void;
};

const defaultState: BookingState = {
  tipo_scelta: '',
  pacchetto_giorni: '',
  tipo_pass: '',
  struttura: '',
  camere: [],
  adulti: 1,
  bambini: 0,
  pranzi: 0,
  cene: 0,
  pranzo_scelto: false,
  cena_scelta: false,
  participants: [],
  nome: '',
  email: '',
  telefono: '',
  totale: 0,
  metodo_pagamento: ''
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BookingState>(defaultState);

  const updateData = (updates: Partial<BookingState>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetData = () => setData(defaultState);

  return (
    <BookingContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
